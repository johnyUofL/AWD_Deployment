# addon/serializers.py
from rest_framework import serializers
from .models import ChatRoom, ChatMessage, ChatParticipant
from userauths.serializers import UserSerializer
from core.serializers import CourseSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatRoomSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    participants = UserSerializer(many=True, source='participants.user', read_only=True)
    course_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'description', 'course', 'created_by', 'created_at', 'is_active', 'is_private', 'participants', 'course_id']

    def create(self, validated_data):
        # Extract course_id if present
        course_id = validated_data.pop('course_id', None)
        
        # Get the user from the request context
        user = self.context['request'].user
        
        # Create the chat room with the user as created_by
        chat_room = ChatRoom.objects.create(
            created_by=user,
            **validated_data
        )
        
        return chat_room

class ChatMessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    room = ChatRoomSerializer(read_only=True)
    room_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'room', 'user', 'content', 'sent_at', 'room_id', 'is_deleted']
    
    def create(self, validated_data):
        # Get the room_id from validated_data
        room_id = validated_data.pop('room_id')
        
        # Get the room object
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            raise serializers.ValidationError({"room_id": f"Chat room with id {room_id} does not exist"})
        
        # Get the user from the request context
        user = self.context['request'].user
        
        # Create the message
        message = ChatMessage.objects.create(
            room=room,
            user=user,
            **validated_data
        )
        
        return message

class ChatParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    room = ChatRoomSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    room_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ChatParticipant
        fields = ['id', 'room', 'user', 'joined_at', 'last_read_message', 'user_id', 'room_id']
    
    def create(self, validated_data):
        # Extract user_id and room_id
        user_id = validated_data.pop('user_id')
        room_id = validated_data.pop('room_id')
        
        # Get the user and room objects
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"user_id": f"User with id {user_id} does not exist"})
            
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            raise serializers.ValidationError({"room_id": f"Chat room with id {room_id} does not exist"})
        
        # Check if participant already exists
        existing_participant = ChatParticipant.objects.filter(user=user, room=room).first()
        if existing_participant:
            return existing_participant
        
        # Create the participant
        participant = ChatParticipant.objects.create(
            user=user,
            room=room,
            **validated_data
        )
        
        return participant