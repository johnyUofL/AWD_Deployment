import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elearning.settings')
django.setup()  # This line is crucial - it sets up Django before importing other modules

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import addon.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            addon.routing.websocket_urlpatterns
        )
    ),
})