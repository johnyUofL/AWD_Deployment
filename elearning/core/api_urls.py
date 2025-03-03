from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, EnrollmentViewSet, CourseMaterialViewSet, AssignmentViewSet,
    SubmissionViewSet, GradeViewSet, CourseFeedbackViewSet, AnnouncementViewSet,
    VideoResourceViewSet
)

app_name = 'core_api'

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'enrollments', EnrollmentViewSet)
router.register(r'materials', CourseMaterialViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'grades', GradeViewSet)
router.register(r'feedback', CourseFeedbackViewSet)
router.register(r'announcements', AnnouncementViewSet)
router.register(r'video-resources', VideoResourceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]