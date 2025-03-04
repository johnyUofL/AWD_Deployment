# addon/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatRoomViewSet, ChatMessageViewSet, ChatParticipantViewSet

router = DefaultRouter()
router.register(r'chat-rooms', ChatRoomViewSet)
router.register(r'chat-messages', ChatMessageViewSet)
router.register(r'chat-participants', ChatParticipantViewSet)

urlpatterns = [
    path('api/', include(router.urls)),  # Maps to /chat/api/chat-rooms/, etc.
]