import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
import addon.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elearning.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # Handles HTTP requests
    "websocket": URLRouter(addon.routing.websocket_urlpatterns),  # Handles WebSocket connections
})
