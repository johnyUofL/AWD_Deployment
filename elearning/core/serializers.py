from rest_framework import serializers
from .models import Course, Enrollment, CourseMaterial, VideoResource, Assignment, Submission, Grade, CourseFeedback, Announcement
from userauths.models import User  # Import User model
from userauths.serializers import UserSerializer

class CourseSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    enrollment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'teacher', 'cover_image_path', 
                  'start_date', 'end_date', 'is_active', 'enrollment_count']
    
    def get_enrollment_count(self, obj):
        return obj.enrollments.filter(is_active=True).count()

class EnrollmentSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True)  # Write ID, read as serialized
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), write_only=True)  # Write ID, read as serialized
    student_detail = UserSerializer(source='student', read_only=True)  # Rename for output
    course_detail = CourseSerializer(source='course', read_only=True)  # Rename for output
    
    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'course', 'student_detail', 'course_detail', 'enrollment_date', 'is_active']

class CourseMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseMaterial
        fields = ['id', 'course', 'title', 'description', 'file_path', 'file_type', 'upload_date', 'is_visible']

class VideoResourceSerializer(serializers.ModelSerializer):
    material = CourseMaterialSerializer(read_only=True)
    class Meta:
        model = VideoResource
        fields = ['id', 'material', 'duration', 'thumbnail_path', 'resolution', 'streaming_url']

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['id', 'course', 'title', 'description', 'due_date', 'total_points', 'creation_date']

class SubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    assignment = AssignmentSerializer(read_only=True)
    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student', 'submission_date', 'file_path', 'comments', 'is_late']

class GradeSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    assignment = AssignmentSerializer(read_only=True)
    class Meta:
        model = Grade
        fields = ['id', 'submission', 'student', 'course', 'assignment', 'score', 'feedback', 'graded_date']

class CourseFeedbackSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    class Meta:
        model = CourseFeedback
        fields = ['id', 'course', 'student', 'rating', 'comments', 'submission_date', 'is_anonymous']

class AnnouncementSerializer(serializers.ModelSerializer):
    posted_by = UserSerializer(read_only=True)
    class Meta:
        model = Announcement
        fields = ['id', 'course', 'title', 'content', 'posted_by', 'posted_at', 'is_pinned']