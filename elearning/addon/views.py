from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ChatRoom, ChatMessage, ChatParticipant
from .serializers import ChatRoomSerializer, ChatMessageSerializer, ChatParticipantSerializer
from django.utils import timezone

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    """
    Get the count of unread messages for the current user
    """
    print(f"Getting unread count for user: {request.user.username}")
    
    # Get all rooms where the user is a participant
    user_rooms = ChatRoom.objects.filter(participants__user=request.user)
    print(f"Found {user_rooms.count()} rooms for user")
    
    # Count unread messages in these rooms
    unread_count = 0
    for room in user_rooms:
        # Get the participant object for the current user in this room
        try:
            participant = ChatParticipant.objects.get(room=room, user=request.user)
            print(f"Room {room.id}: last_read = {participant.last_read}")
            
            # Count messages sent after the last_read timestamp
            if participant.last_read:
                room_unread = ChatMessage.objects.filter(
                    room=room,
                    sent_at__gt=participant.last_read
                ).exclude(user=request.user).count()
                print(f"Room {room.id}: {room_unread} unread messages (after {participant.last_read})")
            else:
                # If last_read is None, count all messages not from the current user
                room_unread = ChatMessage.objects.filter(
                    room=room
                ).exclude(user=request.user).count()
                print(f"Room {room.id}: {room_unread} unread messages (no last_read timestamp)")
                
            unread_count += room_unread
        except ChatParticipant.DoesNotExist:
            print(f"User is not a participant in room {room.id}")
            continue
    
    print(f"Total unread count: {unread_count}")
    return Response({'count': unread_count})

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def mark_messages_as_read(request):
    """
    Mark all messages in a room as read for the current user
    """
    room_id = request.query_params.get('room')
    print(f"Marking messages as read for room ID: {room_id}, user: {request.user.username}")
    
    if not room_id:
        print("Room ID is required but was not provided")
        return Response(
            {'error': 'Room ID is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        room_id = int(room_id)  # Ensure room_id is an integer
        room = ChatRoom.objects.get(id=room_id)
        print(f"Found room: {room}")
        
        # Check if the user is a participant in this room
        try:
            participant = ChatParticipant.objects.get(room=room, user=request.user)
            print(f"Found participant: {participant}, last_read before: {participant.last_read}")
            
            # Update the last_read timestamp
            participant.last_read = timezone.now()
            participant.save()
            print(f"Updated last_read to: {participant.last_read}")
            
            return Response({'status': 'Messages marked as read'})
            
        except ChatParticipant.DoesNotExist:
            print(f"User {request.user.username} is not a participant in room {room_id}")
            return Response(
                {'error': 'You are not a participant in this room'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
    except ValueError:
        print(f"Invalid room ID format: {room_id}")
        return Response(
            {'error': 'Invalid room ID format'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except ChatRoom.DoesNotExist:
        print(f"Room not found with ID: {room_id}")
        return Response(
            {'error': 'Room not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

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