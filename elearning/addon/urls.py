from django.urls import path
from . import views

app_name = 'addon'

urlpatterns = [
    path('rooms/', views.chat_room_list, name='chat_room_list'),
]