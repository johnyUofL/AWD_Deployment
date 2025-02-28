from django.contrib import admin
from .models import (
    Course, Enrollment, CourseMaterial, VideoResource,
    Assignment, Submission, Grade, CourseFeedback, Announcement
)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'teacher', 'start_date', 'end_date', 'is_active')
    list_filter = ('is_active', 'start_date', 'end_date')
    search_fields = ('title', 'description')

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'enrollment_date', 'is_active')
    list_filter = ('is_active', 'enrollment_date')
    search_fields = ('student__username', 'course__title')

@admin.register(CourseMaterial)
class CourseMaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'file_type', 'upload_date', 'is_visible')
    list_filter = ('file_type', 'is_visible', 'upload_date')
    search_fields = ('title', 'description', 'course__title')

@admin.register(VideoResource)
class VideoResourceAdmin(admin.ModelAdmin):
    list_display = ('material', 'duration', 'resolution')
    search_fields = ('material__title',)

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'due_date', 'total_points')
    list_filter = ('due_date', 'course')
    search_fields = ('title', 'description')

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('student', 'assignment', 'submission_date', 'is_late')
    list_filter = ('is_late', 'submission_date')
    search_fields = ('student__username', 'assignment__title')

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'assignment', 'score', 'graded_date')
    list_filter = ('graded_date',)
    search_fields = ('student__username', 'assignment__title')

@admin.register(CourseFeedback)
class CourseFeedbackAdmin(admin.ModelAdmin):
    list_display = ('course', 'student', 'rating', 'submission_date', 'is_anonymous')
    list_filter = ('rating', 'is_anonymous', 'submission_date')
    search_fields = ('course__title', 'student__username')

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'posted_by', 'posted_at', 'is_pinned')
    list_filter = ('is_pinned', 'posted_at')
    search_fields = ('title', 'content')