from rest_framework import serializers
from .models import User, UserPermission, StatusUpdate, Notification
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'password', 'user_type', 'bio', 'profile_picture_path']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'bio': {'required': False},
            'profile_picture_path': {'required': False},
            'user_type': {'required': False},
        }
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value
    
    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def create(self, validated_data):
        # Set default values for missing fields
        if 'first_name' not in validated_data:
            validated_data['first_name'] = validated_data['username']
        
        if 'last_name' not in validated_data:
            validated_data['last_name'] = ' '
            
        if 'user_type' not in validated_data:
            validated_data['user_type'] = 'student'
            
        if 'bio' not in validated_data:
            validated_data['bio'] = ''
        
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            user_type=validated_data['user_type'],
            bio=validated_data['bio']
        )
        
        user.set_password(validated_data['password'])
        user.save()
        
        return user

class UserPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPermission
        fields = ['id', 'user', 'permission']

class StatusUpdateSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = StatusUpdate
        fields = ['id', 'user', 'content', 'posted_at', 'is_visible']

class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Notification
        fields = ['id', 'user', 'notification_type', 'message', 'is_read', 'created_at', 'related_id']