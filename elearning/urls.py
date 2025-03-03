from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    path('userauths/', include('userauths.urls')),
    path('api/core/', include('core.api_urls', namespace='core_api')),
    path('api/userauths/', include('userauths.api_urls', namespace='userauths_api')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 