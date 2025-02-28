from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(('core.urls', 'core'), namespace='core')),  # Frontend views for core
    path('chat/', include(('addon.urls', 'addon'), namespace='addon')),  # Frontend/WebSocket for addon
    path('accounts/', include('django.contrib.auth.urls')),  # Built-in auth views
    path('accounts/login/', auth_views.LoginView.as_view(), name='login'),  # Login view
    path('accounts/logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),  # Logout view
    path('userauths/', include(('userauths.urls', 'userauths'), namespace='userauths')),  # Frontend and API for userauths
    path('api/core/', include(('core.api_urls', 'core'), namespace='core_api')),  # API for core
    path('api/addon/', include(('addon.api_urls', 'addon'), namespace='addon_api')),  # API for addon
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)