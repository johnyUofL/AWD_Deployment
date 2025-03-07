from django.test import TestCase, Client
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from unittest.mock import patch
from .models import UserPermission, StatusUpdate, Notification
from .serializers import UserSerializer
from .forms import UserSignupForm

User = get_user_model()


# Model Tests
class UserModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a user
        cls.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            user_type='student',
            bio='Test bio'
        )
    
    def test_user_creation(self):
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.email, 'test@test.com')
        self.assertEqual(self.user.user_type, 'student')
        self.assertEqual(self.user.bio, 'Test bio')
        self.assertFalse(self.user.is_blocked)
    
    def test_user_str_method(self):
        self.assertEqual(str(self.user), 'testuser')


class UserPermissionModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a user
        cls.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        
        # Create a permission
        cls.permission = UserPermission.objects.create(
            user=cls.user,
            permission='can_edit_course'
        )
    
    def test_permission_creation(self):
        self.assertEqual(self.permission.user, self.user)
        self.assertEqual(self.permission.permission, 'can_edit_course')
    
    def test_permission_str_method(self):
        expected_str = f"{self.user.username} - can_edit_course"
        self.assertEqual(str(self.permission), expected_str)
    
    def test_unique_together_constraint(self):
        # Try to create a duplicate permission
        with self.assertRaises(Exception):  
            UserPermission.objects.create(
                user=self.user,
                permission='can_edit_course'
            )


class StatusUpdateModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a user
        cls.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        
        # Create a status update
        cls.status_update = StatusUpdate.objects.create(
            user=cls.user,
            content='Test status update'
        )
    
    def test_status_update_creation(self):
        self.assertEqual(self.status_update.user, self.user)
        self.assertEqual(self.status_update.content, 'Test status update')
        self.assertTrue(self.status_update.is_visible)
    
    def test_status_update_str_method(self):
        expected_str = f"{self.user.username} - {self.status_update.posted_at.strftime('%Y-%m-%d %H:%M')}"
        self.assertEqual(str(self.status_update), expected_str)


class NotificationModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a user
        cls.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        
    
        cls.notification = Notification.objects.create(
            user=cls.user,
            related_id=1,  
            notification_type='assignment',
            message='New assignment created'
        )
    
    def test_notification_creation(self):
        self.assertEqual(self.notification.user, self.user)
        self.assertEqual(self.notification.related_id, 1)  
        self.assertEqual(self.notification.notification_type, 'assignment')
        self.assertEqual(self.notification.message, 'New assignment created')
        self.assertFalse(self.notification.is_read)
    
    def test_notification_str_method(self):
        actual_str = str(self.notification)
        expected_prefix = f"{self.user.username} - {self.notification.notification_type}"
        self.assertTrue(actual_str.startswith(expected_prefix), 
                       f"String '{actual_str}' doesn't start with '{expected_prefix}'")


# Serializer Tests
class UserSerializerTest(TestCase):
    def test_user_serializer_valid_data(self):
        # User data
        user_data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'newpassword123',
            'user_type': 'student',
            'bio': 'New user bio'
        }
        
        # Serialize the data
        serializer = UserSerializer(data=user_data)
        
        # Check if valid
        self.assertTrue(serializer.is_valid())
    
    def test_user_serializer_invalid_data(self):
        # User data with invalid email
        user_data = {
            'username': 'newuser',
            'email': 'invalid-email',  # Invalid email
            'password': 'newpassword123',
            'user_type': 'student'
        }
        
        # Serialize the data
        serializer = UserSerializer(data=user_data)
        
        # Check if invalid
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)


# Form Tests
class UserSignupFormTest(TestCase):
    def test_signup_form_valid_data(self):
        form_data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'SecurePassword123',
            'confirm_password': 'SecurePassword123',
            'user_type': 'student',
            'first_name': 'New',
            'last_name': 'User',
            'bio': 'Test bio'
        }
        form = UserSignupForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_signup_form_password_mismatch(self):
        form_data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'SecurePassword123',
            'confirm_password': 'DifferentPassword123',  # Different password
            'user_type': 'student'
        }
        form = UserSignupForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('confirm_password', form.errors)


# View Tests
class UserSignupViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.signup_url = '/userauths/signup/'
    
    def test_user_signup(self):
        client = Client()
        
        signup_data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'SecurePassword123',
            'confirm_password': 'SecurePassword123',
            'user_type': 'student',
            'first_name': 'New',
            'last_name': 'User',
            'bio': 'Test bio'
        }
        
        try:

            client.post(self.signup_url, signup_data)
        except:

            pass
        
        # Verify the user was created successfully
        user_created = User.objects.filter(username='newuser').exists()
        self.assertTrue(user_created, "User should be created after signup")


class UserLoginViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create a user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
    
    def test_user_login_success(self):
 
        client = Client()
        
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        

        with patch('userauths.views.redirect') as mock_redirect:
            # Set a dummy return value for the redirect
            mock_redirect.return_value = HttpResponse(status=302)
            
            # Make the request
            response = client.post('/accounts/login/', login_data)
            
            # Verify the redirect was called (meaning login was successful)
            mock_redirect.assert_called_once()
        
        # Verify direct login works
        verification_client = Client()
        login_success = verification_client.login(username='testuser', password='testpass123')
        self.assertTrue(login_success, "User should be able to log in with correct credentials")
    
    def test_user_login_failure(self):
        login_data = {
            'username': 'testuser',
            'password': 'wrongpassword'  
        }
        

        response = self.client.post('/accounts/login/', login_data)
        

        self.assertContains(response, 'Invalid credentials')
