from rest_framework import serializers
from .models import (
    Course, Enrollment, CourseMaterial, VideoResource,
    Assignment, Submission, Grade, CourseFeedback, Announcement, CourseStructure
)
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

class VideoResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoResource
        fields = ['id', 'material', 'duration', 'thumbnail_path', 'resolution', 'streaming_url']

class CourseMaterialSerializer(serializers.ModelSerializer):
    video_details = VideoResourceSerializer(read_only=True)
    
    class Meta:
        model = CourseMaterial
        fields = ['id', 'course', 'title', 'description', 'file_path', 
                  'file_type', 'upload_date', 'is_visible', 'video_details']

class AssignmentSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())  # Accept course ID as input
    
    class Meta:
        model = Assignment
        fields = ['id', 'course', 'title', 'description', 'file_path', 'due_date', 'total_points', 'creation_date']
    
    def validate_file_path(self, value):
        if value:
            valid_extensions = ['.pdf', '.doc', '.docx', '.txt']
            if not value.name.lower().endswith(tuple(valid_extensions)):
                raise serializers.ValidationError("Only PDF, DOC, DOCX, and TXT files are allowed.")
            if value.size > 10 * 1024 * 1024:  # 10MB limit
                raise serializers.ValidationError("File size must not exceed 10MB.")
        return value
    
class SubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    assignment = AssignmentSerializer(read_only=True)
    
    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student', 'submission_date', 'file_path', 'comments', 'is_late']
    
    def validate_file_path(self, value):
        # Optional: Add validation for student submission files
        if value:
            valid_extensions = ['.pdf', '.doc', '.docx', '.txt', '.zip']  # Example allowed file types
            if not value.name.lower().endswith(tuple(valid_extensions)):
                raise serializers.ValidationError("Only PDF, DOC, DOCX, TXT, or ZIP files are allowed.")
            if value.size > 5 * 1024 * 1024:  # Example: Limit to 5MB
                raise serializers.ValidationError("File size must not exceed 5MB.")
        return value
    
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

class CourseStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseStructure
        fields = ['id', 'course', 'structure_data', 'last_updated']