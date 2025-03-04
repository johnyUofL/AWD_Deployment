# addon/serializers.py
from rest_framework import serializers
from .models import ChatRoom, ChatMessage, ChatParticipant
from userauths.serializers import UserSerializer
from core.serializers import CourseSerializer

class ChatRoomSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    participants = UserSerializer(many=True, source='participants.user', read_only=True)  # Add this

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'description', 'course', 'created_by', 'created_at', 'is_active', 'is_private', 'participants']

class ChatMessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    room = ChatRoomSerializer(read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'room', 'user', 'content', 'sent_at', 'is_deleted']

class ChatParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    room = ChatRoomSerializer(read_only=True)

    class Meta:
        model = ChatParticipant
        fields = ['id', 'room', 'user', 'joined_at', 'last_read_message']