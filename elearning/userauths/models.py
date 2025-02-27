from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Administrator'),
    )
    
    profile_picture_path = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='student')
    bio = models.TextField(blank=True)
    is_blocked = models.BooleanField(default=False)
    
    def __str__(self):
        return self.username

class UserPermission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='permissions')
    permission = models.CharField(max_length=50)
    
    class Meta:
        unique_together = ('user', 'permission')
    
    def __str__(self):
        return f"{self.user.username} - {self.permission}"

class StatusUpdate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='status_updates')
    content = models.TextField()
    posted_at = models.DateTimeField(auto_now_add=True)
    is_visible = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-posted_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.posted_at.strftime('%Y-%m-%d %H:%M')}"

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('assignment', 'New Assignment'),
        ('grade', 'New Grade'),
        ('announcement', 'New Announcement'),
        ('message', 'New Message'),
        ('enrollment', 'Course Enrollment'),
        ('feedback', 'Course Feedback'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    related_id = models.IntegerField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.notification_type} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"