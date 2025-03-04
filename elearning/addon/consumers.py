import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from .models import ChatRoom, ChatMessage, ChatParticipant
from userauths.models import User

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract token from query string
        query_string = self.scope['query_string'].decode()
        print(f"WebSocket connection attempt with query string: {query_string}")
        
        token = dict(q.split('=') for q in query_string.split('&') if '=' in q).get('token')
        
        if not token:
            print("No token provided in WebSocket connection")
            await self.close(code=4001, reason="Authentication token required")
            return

        # Authenticate user
        try:
            print(f"Attempting to authenticate with token: {token[:10]}...")
            user = await self.get_user_from_token(token)
            self.scope['user'] = user
            print(f"Successfully authenticated user: {user.username} (ID: {user.id})")
        except Exception as e:
            print(f"Authentication failed: {str(e)}")
            await self.close(code=4002, reason=f"Invalid token: {str(e)}")
            return

        if not user.is_authenticated:
            await self.close(code=4003, reason="User not authenticated")
            return

        # Get target user ID from URL
        self.target_user_id = self.scope['url_route']['kwargs'].get('target_user_id')
        if not self.target_user_id:
            await self.close(code=4004, reason="Target user ID required")
            return

        try:
            self.target_user = await database_sync_to_async(User.objects.get)(id=self.target_user_id)
        except User.DoesNotExist:
            await self.close(code=4005, reason="Target user not found")
            return

        # Generate or retrieve chat room
        self.room = await self.ensure_chat_room()
        self.room_id = str(self.room.id)
        self.room_group_name = f'chat_{self.room_id}'

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        
        # Send room info to the client
        await self.send(text_data=json.dumps({
            'type': 'room_info',
            'room_id': self.room_id,
            'message': 'Connected to chat room'
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data.get('content', '').strip()
            if not message:
                return

            chat_message = await self.save_message(message)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'id': chat_message.id,
                        'user': self.scope['user'].username,
                        'user_id': self.scope['user'].id,
                        'content': message,
                        'sent_at': str(chat_message.sent_at),
                        'room_id': self.room_id
                    }
                }
            )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Invalid message format'}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def get_user_from_token(self, token):
        """Validate JWT token and return the user."""
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id)
        except Exception as e:
            print(f"Token validation error: {str(e)}")
            raise

    @database_sync_to_async
    def ensure_chat_room(self):
        """Get or create a private chat room between the current user and target user."""
        try:
            # Try to find an existing private room with both users
            participants = [self.scope['user'].id, int(self.target_user_id)]
            
            # Look for rooms where both users are participants
            rooms = ChatRoom.objects.filter(is_private=True)
            for room in rooms:
                room_participants = room.participants.values_list('user_id', flat=True)
                if set(participants) == set(room_participants) and len(room_participants) == 2:
                    print(f"Found existing chat room: {room.id}")
                    return room
            
            # If no room exists, create a new one
            room = ChatRoom.objects.create(
                name=f"Private chat: {self.scope['user'].username} and {self.target_user.username}",
                is_private=True
            )
            
            # Add both users as participants
            ChatParticipant.objects.create(room=room, user=self.scope['user'])
            ChatParticipant.objects.create(room=room, user=self.target_user)
            
            print(f"Created new chat room: {room.id}")
            return room
        except Exception as e:
            print(f"Error ensuring chat room: {str(e)}")
            raise

    @database_sync_to_async
    def save_message(self, content):
        """Save the chat message to the database."""
        return ChatMessage.objects.create(
            room=self.room,
            user=self.scope['user'],
            content=content
        )