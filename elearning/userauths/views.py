from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from rest_framework import viewsets, permissions
from .models import User, UserPermission, StatusUpdate, Notification
from .serializers import UserSerializer, UserPermissionSerializer, StatusUpdateSerializer, NotificationSerializer
from .forms import UserSignupForm
from django.contrib.auth.views import LoginView

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
    permission_classes = [permissions.IsAuthenticated]

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
    # Get the referer (previous page) to determine if this is an admin logout
    referer = request.META.get('HTTP_REFERER', '')
    is_admin_logout = '/admin/' in referer
    
    # Perform the logout
    logout(request)
    
    # Redirect based on the source of the logout request
    if is_admin_logout:
        return redirect('/admin/login/?next=/admin/')
    else:
        # Use the default logout behavior for non-admin logouts
        return redirect('login')