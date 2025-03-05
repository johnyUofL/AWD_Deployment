# elearning/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from userauths.views import custom_login, custom_logout

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', serve, {'document_root': settings.STATICFILES_DIRS[0], 'path': 'index.html'}),
    path('courses/', serve, {'document_root': settings.STATICFILES_DIRS[0], 'path': 'index.html'}),
    path('accounts/login/', custom_login, name='login'),
    path('accounts/logout/', custom_logout, name='logout'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('userauths/', include(('userauths.urls', 'userauths'), namespace='userauths')),
    path('api/core/', include(('core.urls', 'core'), namespace='core_api')),
    path('api/addon/', include(('addon.api_urls', 'addon'), namespace='addon_api')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('chat/', include('addon.urls')),  
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])