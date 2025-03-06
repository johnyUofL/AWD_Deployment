# addon/routing.py
from django.urls import re_path
from . import consumers
from . import notification_consumer

websocket_urlpatterns = [
    re_path(r'^ws/chat/user/(?P<target_user_id>\d+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'^ws/notifications/$', notification_consumer.NotificationConsumer.as_asgi()),
]