from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import ChatRoom, ChatMessage, ChatParticipant
from .serializers import ChatRoomSerializer, ChatMessageSerializer, ChatParticipantSerializer

class ChatRoomViewSet(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatRoom.objects.filter(participants__user=self.request.user)

class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = ChatMessage.objects.all()
        room_id = self.request.query_params.get('room')
        
        if room_id:
            queryset = queryset.filter(room_id=room_id)
            
        # Order by sent_at to show messages in chronological order
        return queryset.order_by('sent_at')

class ChatParticipantViewSet(viewsets.ModelViewSet):
    queryset = ChatParticipant.objects.all()
    serializer_class = ChatParticipantSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = ChatParticipant.objects.all()
        room_id = self.request.query_params.get('room')
        user_id = self.request.query_params.get('user')
        
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        return queryset