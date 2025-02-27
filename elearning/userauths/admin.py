# userauths/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserPermission, StatusUpdate, Notification

class CustomUserAdmin(BaseUserAdmin):
    # Include your custom fields in the admin interface
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Information', {'fields': ('profile_picture_path', 'user_type', 'bio', 'is_blocked')}),
    )
    
    # If you want these fields in the "add user" form as well
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Information', {
            'classes': ('wide',),
            'fields': ('profile_picture_path', 'user_type', 'bio', 'is_blocked'),
        }),
    )
    
    list_display = BaseUserAdmin.list_display + ('user_type', 'is_blocked')
    list_filter = BaseUserAdmin.list_filter + ('user_type', 'is_blocked')
    search_fields = BaseUserAdmin.search_fields + ('bio',)

# Register the models
admin.site.register(User, CustomUserAdmin)
admin.site.register(UserPermission)
admin.site.register(StatusUpdate)
admin.site.register(Notification)