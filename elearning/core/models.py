# core/models.py
from django.db import models
from userauths.models import User


class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses_teaching')
    cover_image_path = models.ImageField(upload_to='course_covers/', null=True, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.title


class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrollment_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('student', 'course')
    
    def __str__(self):
        return f"{self.student.username} enrolled in {self.course.title}"


class CourseMaterial(models.Model):
    FILE_TYPES = (
        ('document', 'Document'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('archive', 'Archive'),
        ('other', 'Other'),
    )
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=200)
    description = models.TextField()
    file_path = models.FileField(upload_to='course_materials/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPES)
    upload_date = models.DateTimeField(auto_now_add=True)
    is_visible = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"


class VideoResource(models.Model):
    material = models.OneToOneField(CourseMaterial, on_delete=models.CASCADE, related_name='video_details')
    duration = models.IntegerField(help_text="Duration in seconds")
    thumbnail_path = models.ImageField(upload_to='video_thumbnails/', null=True, blank=True)
    resolution = models.CharField(max_length=20, blank=True)
    streaming_url = models.URLField(blank=True)
    
    def __str__(self):
        return f"Video: {self.material.title}"


class Assignment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField()
    total_points = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"


class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    submission_date = models.DateTimeField(auto_now_add=True)
    file_path = models.FileField(upload_to='assignment_submissions/')
    comments = models.TextField(blank=True)
    is_late = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('assignment', 'student')
    
    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}"
    
    def save(self, *args, **kwargs):
        if self.submission_date and self.assignment.due_date and self.submission_date > self.assignment.due_date:
            self.is_late = True
        super().save(*args, **kwargs)


class Grade(models.Model):
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE, related_name='grade')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='grades')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='grades')
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='grades')
    score = models.DecimalField(max_digits=5, decimal_places=2)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='grades_given')
    graded_date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.student.username} - {self.assignment.title} - {self.score}"


class CourseFeedback(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='feedback')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_feedback')
    rating = models.IntegerField()
    comments = models.TextField(blank=True)
    submission_date = models.DateTimeField(auto_now_add=True)
    is_anonymous = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('course', 'student')
    
    def __str__(self):
        if self.is_anonymous:
            return f"Anonymous - {self.course.title} - {self.rating}"
        return f"{self.student.username} - {self.course.title} - {self.rating}"


class Announcement(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='announcements')
    title = models.CharField(max_length=200)
    content = models.TextField()
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_announcements')
    posted_at = models.DateTimeField(auto_now_add=True)
    is_pinned = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-is_pinned', '-posted_at']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"

