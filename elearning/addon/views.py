from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ChatRoom, ChatMessage, ChatParticipant
from .serializers import ChatRoomSerializer, ChatMessageSerializer, ChatParticipantSerializer
from django.utils import timezone

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
        after = self.request.query_params.get('after')
        
        if room_id:
            queryset = queryset.filter(room_id=room_id)
            
        if after:
            queryset = queryset.filter(sent_at__gt=after)
            
        # Order by sent_at to show messages in chronological order
        return queryset.order_by('sent_at')
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get the count of unread messages for the current user
        """
        # Get all rooms where the user is a participant
        user_rooms = ChatRoom.objects.filter(participants__user=request.user)
        
        # Count unread messages in these rooms
        unread_count = 0
        for room in user_rooms:
            # Get the participant object for the current user in this room
            participant = ChatParticipant.objects.get(room=room, user=request.user)
            
            # Count messages sent after the last_read timestamp
            if participant.last_read:
                room_unread = ChatMessage.objects.filter(
                    room=room,
                    sent_at__gt=participant.last_read
                ).exclude(user=request.user).count()
            else:
                # If last_read is None, count all messages not from the current user
                room_unread = ChatMessage.objects.filter(
                    room=room
                ).exclude(user=request.user).count()
                
            unread_count += room_unread
            
        return Response({'count': unread_count})
    
    @action(detail=False, methods=['put', 'get'])
    def mark_read(self, request):
        """
        Mark all messages in a room as read for the current user
        """
        room_id = request.query_params.get('room')
        if not room_id:
            return Response(
                {'error': 'Room ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            room = ChatRoom.objects.get(id=room_id)
            
            # Check if the user is a participant in this room
            try:
                participant = ChatParticipant.objects.get(room=room, user=request.user)
                
                # Update the last_read timestamp
                participant.last_read = timezone.now()
                participant.save()
                
                return Response({'status': 'Messages marked as read'})
                
            except ChatParticipant.DoesNotExist:
                return Response(
                    {'error': 'You are not a participant in this room'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
                
        except ChatRoom.DoesNotExist:
            return Response(
                {'error': 'Room not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

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