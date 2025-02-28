import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import ChatMessage
from userauths.models import User

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['content']
        user = self.scope['user']
        chat_message = ChatMessage.objects.create(room_id=self.room_id, user=user, content=message)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {'user': user.username, 'content': message, 'sent_at': str(chat_message.sent_at)}
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))