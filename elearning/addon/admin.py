from django.contrib import admin
from .models import ChatRoom, ChatMessage, ChatParticipant

@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'course', 'created_by', 'created_at', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description', 'course__title')

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('user', 'room', 'sent_at', 'is_deleted')
    list_filter = ('is_deleted', 'sent_at')
    search_fields = ('content', 'user__username', 'room__name')

@admin.register(ChatParticipant)
class ChatParticipantAdmin(admin.ModelAdmin):
    list_display = ('user', 'room', 'joined_at')
    search_fields = ('user__username', 'room__name')