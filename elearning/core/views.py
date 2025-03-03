from rest_framework import viewsets, permissions
from .models import Course, Enrollment, CourseMaterial, Assignment, Submission, Grade, CourseFeedback, Announcement, VideoResource
from .serializers import CourseSerializer, EnrollmentSerializer, CourseMaterialSerializer, AssignmentSerializer, SubmissionSerializer, GradeSerializer, CourseFeedbackSerializer, AnnouncementSerializer, VideoResourceSerializer
from .tasks import notify_teacher_enrollment
import os
from django.conf import settings

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