from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatRoomViewSet, ChatMessageViewSet, ChatParticipantViewSet

app_name = 'addon_api'

router = DefaultRouter()
router.register(r'chat-rooms', ChatRoomViewSet)
router.register(r'messages', ChatMessageViewSet)
router.register(r'participants', ChatParticipantViewSet)

urlpatterns = [
    path('', include(router.urls)),
]