from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, UserPermissionViewSet, StatusUpdateViewSet, NotificationViewSet, signup
)

app_name = 'userauths_api'

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'permissions', UserPermissionViewSet)
router.register(r'status-updates', StatusUpdateViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('signup/', signup, name='signup'),
]