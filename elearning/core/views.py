from rest_framework import viewsets, permissions
from .models import Course, Enrollment, CourseMaterial, Assignment, Submission, Grade, CourseFeedback, Announcement, VideoResource, CourseStructure
from .serializers import CourseSerializer, EnrollmentSerializer, CourseMaterialSerializer, AssignmentSerializer, SubmissionSerializer, GradeSerializer, CourseFeedbackSerializer, AnnouncementSerializer, VideoResourceSerializer, CourseStructureSerializer
from .tasks import notify_teacher_enrollment
import os
from django.conf import settings
from rest_framework.decorators import action
from rest_framework.response import Response

# REST API Viewsets
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'teacher':
            # Teachers see all their courses
            return Course.objects.filter(teacher=user)
        else:
            # Students only see active courses
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
        # Delete the file from storage if it exists
        if instance.file_path and os.path.exists(os.path.join(settings.MEDIA_ROOT, str(instance.file_path))):
            try:
                os.remove(os.path.join(settings.MEDIA_ROOT, str(instance.file_path)))
                print(f"Deleted file: {instance.file_path}")
            except Exception as e:
                print(f"Error deleting file: {e}")
        
        # Delete the instance
        instance.delete()

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
        # Delete the thumbnail file if it exists
        if instance.thumbnail_path and os.path.exists(os.path.join(settings.MEDIA_ROOT, str(instance.thumbnail_path))):
            try:
                os.remove(os.path.join(settings.MEDIA_ROOT, str(instance.thumbnail_path)))
                print(f"Deleted thumbnail: {instance.thumbnail_path}")
            except Exception as e:
                print(f"Error deleting thumbnail: {e}")
        
        # Delete the instance
        instance.delete()

class CourseStructureViewSet(viewsets.ModelViewSet):
    queryset = CourseStructure.objects.all()
    serializer_class = CourseStructureSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        course_id = self.request.query_params.get('course')
        
        # Base queryset
        queryset = CourseStructure.objects.all()
        
        # Filter by course if specified
        if course_id:
            queryset = queryset.filter(course_id=course_id)
            
        # For teachers, only show their courses
        if user.user_type == 'teacher':
            queryset = queryset.filter(course__teacher=user)
        # For students, show courses they're enrolled in
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
        
        # Save the structure
        structure, created = CourseStructure.objects.update_or_create(
            course=course,
            defaults={'structure_data': sections}
        )
        
        return Response({'status': 'success', 'message': 'Course structure saved'})