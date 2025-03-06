import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .models import ChatRoom, ChatMessage, ChatParticipant

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract token from query string
        query_string = self.scope.get('query_string', b'').decode()
        query_params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
        token = query_params.get('token', None)
        
        if not token:
            await self.close(code=4001)
            return
        
        # Validate token and get user
        try:
            self.user = await self.get_user_from_token(token)
            if not self.user:
                await self.close(code=4002)
                return
        except Exception as e:
            print(f"Error authenticating WebSocket connection: {str(e)}")
            await self.close(code=4003)
            return
        
        # Add the user to a personal notification group
        self.notification_group_name = f'notifications_{self.user.id}'
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        # Also add the user to all chat room groups they are a participant in
        chat_rooms = await self.get_user_chat_rooms(self.user.id)
        for room in chat_rooms:
            room_group_name = f'chat_{room.id}'
            await self.channel_layer.group_add(
                room_group_name,
                self.channel_name
            )
        
        await self.accept()
        
        # Send a connection confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to notification system'
        }))
    
    async def disconnect(self, close_code):
        # Remove from notification group
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )
        
        # Remove from all chat room groups
        if hasattr(self, 'user'):
            chat_rooms = await self.get_user_chat_rooms(self.user.id)
            for room in chat_rooms:
                room_group_name = f'chat_{room.id}'
                await self.channel_layer.group_discard(
                    room_group_name,
                    self.channel_name
                )
    
    async def receive(self, text_data):
        # We don't expect to receive messages from the client in this consumer
        pass
    
    async def new_message_notification(self, event):
        # Send the notification to the WebSocket
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))
    
    async def read_status_notification(self, event):
        # Send the read status notification to the WebSocket
        await self.send(text_data=json.dumps({
            'type': 'read_status',
            'room_id': event['room_id'],
            'user_id': event['user_id'],
            'timestamp': event['timestamp']
        }))
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            # Validate the token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get the user
            return User.objects.get(id=user_id)
        except (TokenError, InvalidToken, User.DoesNotExist) as e:
            print(f"Token validation error: {str(e)}")
            return None
        except Exception as e:
            print(f"Unexpected error during token validation: {str(e)}")
            return None
    
    @database_sync_to_async
    def get_user_chat_rooms(self, user_id):
        # Get all chat rooms where the user is a participant
        return list(ChatRoom.objects.filter(
            participants__user_id=user_id
        )) 