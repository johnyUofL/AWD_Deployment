from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, EnrollmentViewSet, CourseMaterialViewSet, AssignmentViewSet,
    SubmissionViewSet, GradeViewSet, CourseFeedbackViewSet, AnnouncementViewSet,
    course_list, enroll_course, teacher_dashboard, block_student
)

app_name = "core"

# REST API Router
router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'enrollments', EnrollmentViewSet)
router.register(r'materials', CourseMaterialViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'grades', GradeViewSet)
router.register(r'feedback', CourseFeedbackViewSet)
router.register(r'announcements', AnnouncementViewSet)

# Frontend URL patterns
urlpatterns = [
    path('', course_list, name='course_list'),
    path('enroll/<int:course_id>/', enroll_course, name='enroll_course'),
    path('teacher/', teacher_dashboard, name='teacher_dashboard'),
    path('block/<int:student_id>/', block_student, name='block_student'),
]

print("core.urls loaded, urlpatterns:", urlpatterns)