from rest_framework import viewsets, permissions
from .models import Course, Enrollment, CourseMaterial, Assignment, Submission, Grade, CourseFeedback, Announcement
from .serializers import CourseSerializer, EnrollmentSerializer, CourseMaterialSerializer, AssignmentSerializer, SubmissionSerializer, GradeSerializer, CourseFeedbackSerializer, AnnouncementSerializer
from .tasks import notify_teacher_enrollment

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