from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatRoomViewSet, ChatMessageViewSet, ChatParticipantViewSet, mark_messages_as_read, get_unread_count

app_name = 'addon_api'

router = DefaultRouter()
router.register(r'chat-rooms', ChatRoomViewSet)
router.register(r'messages', ChatMessageViewSet)
router.register(r'participants', ChatParticipantViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # views for the custom actions
    path('messages/unread/count/', get_unread_count, name='unread-count'),
    path('messages/mark-read/', mark_messages_as_read, name='mark-read'),
]