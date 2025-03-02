from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from rest_framework import viewsets, permissions
from django.http import JsonResponse  # Add this import
from .models import User, UserPermission, StatusUpdate, Notification
from .serializers import UserSerializer, UserPermissionSerializer, StatusUpdateSerializer, NotificationSerializer
from .forms import UserSignupForm
from django.contrib.auth.views import LoginView
from rest_framework.permissions import AllowAny, IsAuthenticated

def custom_login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('core:course_list')  # Always to home
        else:
            return render(request, 'registration/login.html', {'error': 'Invalid credentials'})
    return render(request, 'registration/login.html')

def signup(request):
    if request.method == 'POST':
        form = UserSignupForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            login(request, user)
            return redirect('core:course_list')
    else:
        form = UserSignupForm()
    return render(request, 'userauths/signup.html', {'form': form})

# REST API Viewsets
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

class UserPermissionViewSet(viewsets.ModelViewSet):
    queryset = UserPermission.objects.all()
    serializer_class = UserPermissionSerializer
    permission_classes = [permissions.IsAuthenticated]

class StatusUpdateViewSet(viewsets.ModelViewSet):
    queryset = StatusUpdate.objects.all()
    serializer_class = StatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

class CustomLoginView(LoginView):
    def get_success_url(self):
        return self.request.POST.get('next', '/home/')  # Redirect to home if 'next' is not provided

def custom_logout(request):
    # Get the referer to determine if this is an admin logout
    referer = request.META.get('HTTP_REFERER', '')
    is_admin_logout = '/admin/' in referer
    
    # Perform the logout
    logout(request)
    
    # Redirect based on the source of the logout request
    if is_admin_logout:
        return redirect('/admin/login/?next=/admin/')
    else:
        # Return JSON response for API frontend instead of redirect
        return JsonResponse({'status': 'success'})