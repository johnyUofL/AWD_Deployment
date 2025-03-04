from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
import os
from .models import (
    Course, Enrollment, CourseMaterial, Assignment, Submission, Grade,
    CourseFeedback, Announcement, VideoResource, CourseStructure
)
from .serializers import (
    CourseSerializer, EnrollmentSerializer, CourseMaterialSerializer,
    AssignmentSerializer, SubmissionSerializer, GradeSerializer,
    CourseFeedbackSerializer, AnnouncementSerializer, VideoResourceSerializer,
    CourseStructureSerializer
)
from .tasks import notify_teacher_enrollment

# REST API Viewsets
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'teacher':
            return Course.objects.filter(teacher=user)
        else:
            return Course.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

class CourseMaterialViewSet(viewsets.ModelViewSet):
    queryset = CourseMaterial.objects.all()
    serializer_class = CourseMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = CourseMaterial.objects.all()
        course_id = self.request.query_params.get('course', None)
        if course_id is not None:
            queryset = queryset.filter(course_id=course_id)
        return queryset
    
    def perform_destroy(self, instance):
        if instance.file_path and os.path.exists(os.path.join(settings.MEDIA_ROOT, str(instance.file_path))):
            try:
                os.remove(os.path.join(settings.MEDIA_ROOT, str(instance.file_path)))
                print(f"Deleted file: {instance.file_path}")
            except Exception as e:
                print(f"Error deleting file: {e}")
        instance.delete()
        
class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Assignment.objects.all()
        
        # Apply course filter if provided
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Apply user-specific filters
        if user.user_type == 'teacher':
            queryset = queryset.filter(course__teacher=user)
        else:
            queryset = queryset.filter(
                course__enrollments__student=user,
                course__enrollments__is_active=True
            ).distinct()
        
        return queryset
    
    def perform_create(self, serializer):
        print(f"Request data: {self.request.data}")  # Log incoming data
        if self.request.user.user_type != 'teacher':
            return Response({'error': 'Only teachers can create assignments'}, status=403)
        try:
            serializer.save()
            print("Assignment saved successfully")
        except Exception as e:
            print(f"Error saving assignment: {e}")
            raise
    
    def perform_destroy(self, instance):
        if instance.file_path and os.path.exists(os.path.join(settings.MEDIA_ROOT, str(instance.file_path))):
            try:
                os.remove(os.path.join(settings.MEDIA_ROOT, str(instance.file_path)))
                print(f"Deleted file: {instance.file_path}")
            except Exception as e:
                print(f"Error deleting file: {e}")
        instance.delete()

class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'teacher':
            # Teachers see submissions for their courses
            return Submission.objects.filter(assignment__course__teacher=user)
        else:
            # Students see only their own submissions
            return Submission.objects.filter(student=user)
    
    def perform_create(self, serializer):
        # Ensure only students can submit assignments and link the submission to the student
        if self.request.user.user_type != 'student':  # Assuming User has a `user_type` field
            return Response({'error': 'Only students can submit assignments'}, status=403)
        
        assignment_id = self.request.data.get('assignment')
        try:
            assignment = Assignment.objects.get(id=assignment_id)
            # Check if the student is enrolled in the course
            if not Enrollment.objects.filter(student=self.request.user, course=assignment.course, is_active=True).exists():
                return Response({'error': 'You are not enrolled in this course'}, status=403)
            serializer.save(student=self.request.user)
        except Assignment.DoesNotExist:
            return Response({'error': 'Assignment not found'}, status=404)
    
    def perform_destroy(self, instance):
        # Delete the submission file from storage if it exists
        if instance.file_path and os.path.exists(os.path.join(settings.MEDIA_ROOT, str(instance.file_path))):
            try:
                os.remove(os.path.join(settings.MEDIA_ROOT, str(instance.file_path)))
                print(f"Deleted file: {instance.file_path}")
            except Exception as e:
                print(f"Error deleting file: {e}")
        instance.delete()

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]

class CourseFeedbackViewSet(viewsets.ModelViewSet):
    queryset = CourseFeedback.objects.all()
    serializer_class = CourseFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

class VideoResourceViewSet(viewsets.ModelViewSet):
    queryset = VideoResource.objects.all()
    serializer_class = VideoResourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = VideoResource.objects.all()
        material_id = self.request.query_params.get('material', None)
        if material_id is not None:
            queryset = queryset.filter(material_id=material_id)
        return queryset
    
    def perform_destroy(self, instance):
        if instance.thumbnail_path and os.path.exists(os.path.join(settings.MEDIA_ROOT, str(instance.thumbnail_path))):
            try:
                os.remove(os.path.join(settings.MEDIA_ROOT, str(instance.thumbnail_path)))
                print(f"Deleted thumbnail: {instance.thumbnail_path}")
            except Exception as e:
                print(f"Error deleting thumbnail: {e}")
        instance.delete()

class CourseStructureViewSet(viewsets.ModelViewSet):
    queryset = CourseStructure.objects.all()
    serializer_class = CourseStructureSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        course_id = self.request.query_params.get('course')
        queryset = CourseStructure.objects.all()
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if user.user_type == 'teacher':
            queryset = queryset.filter(course__teacher=user)
        else:
            queryset = queryset.filter(
                course__enrollments__student=user,
                course__enrollments__is_active=True
            ).distinct()
        return queryset
    
    @action(detail=False, methods=['post'])
    def save_structure(self, request):
        course_id = request.data.get('course_id')
        sections = request.data.get('sections', [])
        try:
            course = Course.objects.get(id=course_id, teacher=request.user)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found or you do not have permission'}, status=404)
        structure, created = CourseStructure.objects.update_or_create(
            course=course,
            defaults={'structure_data': sections}
        )
        return Response({'status': 'success', 'message': 'Course structure saved'})