from rest_framework import viewsets, permissions
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from .models import Course, Enrollment, CourseMaterial, Assignment, Submission, Grade, CourseFeedback, Announcement
from .serializers import CourseSerializer, EnrollmentSerializer, CourseMaterialSerializer, AssignmentSerializer, SubmissionSerializer, GradeSerializer, CourseFeedbackSerializer, AnnouncementSerializer
from .tasks import notify_teacher_enrollment

# REST API Viewsets
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.filter(is_active=True)
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer

class CourseMaterialViewSet(viewsets.ModelViewSet):
    queryset = CourseMaterial.objects.all()
    serializer_class = CourseMaterialSerializer

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer

class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer

class CourseFeedbackViewSet(viewsets.ModelViewSet):
    queryset = CourseFeedback.objects.all()
    serializer_class = CourseFeedbackSerializer

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer

# Frontend Views
@login_required
def course_list(request):
    courses = Course.objects.filter(is_active=True)
    enrollments = Enrollment.objects.filter(student=request.user)
    enrolled_course_ids = [enrollment.course.id for enrollment in enrollments]
    return render(request, 'core/course_list.html', {
        'courses': courses,
        'enrolled_course_ids': enrolled_course_ids
    })

@login_required
def enroll_course(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    enrollment, created = Enrollment.objects.get_or_create(student=request.user, course=course)
    if created:
        notify_teacher_enrollment.delay(request.user.id, course_id)
    return redirect('core:course_list')

@login_required
def teacher_dashboard(request):
    if request.user.user_type != 'teacher':
        return HttpResponseForbidden()
    courses = Course.objects.filter(teacher=request.user)
    return render(request, 'core/teacher_dashboard.html', {'courses': courses})

@login_required
def block_student(request, student_id):
    if request.user.user_type != 'teacher':
        return HttpResponseForbidden()
    student = get_object_or_404(User, id=student_id, user_type='student')
    student.is_blocked = True
    student.save()
    return redirect('core:teacher_dashboard')