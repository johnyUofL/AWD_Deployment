from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rest_framework import viewsets
from .models import ChatRoom, ChatMessage, ChatParticipant
from .serializers import ChatRoomSerializer, ChatMessageSerializer, ChatParticipantSerializer

# REST API Viewsets
class ChatRoomViewSet(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.filter(is_active=True)
    serializer_class = ChatRoomSerializer

class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer

class ChatParticipantViewSet(viewsets.ModelViewSet):
    queryset = ChatParticipant.objects.all()
    serializer_class = ChatParticipantSerializer

# Frontend View
@login_required
def chat_room_list(request):
    chat_rooms = ChatRoom.objects.filter(is_active=True)
    return render(request, 'addon/chat_room_list.html', {'chat_rooms': chat_rooms})