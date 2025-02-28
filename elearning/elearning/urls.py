from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from userauths.views import custom_login, custom_logout  # Import custom_logout

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(('core.urls', 'core'), namespace='core')),
    path('chat/', include(('addon.urls', 'addon'), namespace='addon')),
    path('accounts/login/', custom_login, name='login'),  # Custom login
    path('accounts/logout/', custom_logout, name='logout'),  # Custom logout
    path('accounts/', include('django.contrib.auth.urls')),  # Other auth URLs
    path('userauths/', include(('userauths.urls', 'userauths'), namespace='userauths')),
    path('api/core/', include(('core.api_urls', 'core'), namespace='core_api')),
    path('api/addon/', include(('addon.api_urls', 'addon'), namespace='addon_api')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)