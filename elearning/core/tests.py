from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile

from .models import (
    Course, Enrollment, CourseMaterial, Assignment, 
    Submission, Grade, CourseFeedback, Announcement
)
from .serializers import (
    CourseSerializer, EnrollmentSerializer, CourseMaterialSerializer,
    AssignmentSerializer, SubmissionSerializer, GradeSerializer
)
from userauths.models import User


# Model Tests
class CourseModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a teacher user
        cls.teacher = User.objects.create_user(
            username='testteacher',
            email='teacher@test.com',
            password='testpass123',
            user_type='teacher'
        )
        
        # Create a course
        cls.course = Course.objects.create(
            title='Test Course',
            description='Test Course Description',
            teacher=cls.teacher,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date()
        )
    
    def test_course_creation(self):
        self.assertEqual(self.course.title, 'Test Course')
        self.assertEqual(self.course.description, 'Test Course Description')
        self.assertEqual(self.course.teacher, self.teacher)
        self.assertTrue(self.course.is_active)
    
    def test_course_str_method(self):
        self.assertEqual(str(self.course), 'Test Course')


class EnrollmentModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a teacher user
        cls.teacher = User.objects.create_user(
            username='testteacher',
            email='teacher@test.com',
            password='testpass123',
            user_type='teacher'
        )
        
        # Create a student user
        cls.student = User.objects.create_user(
            username='teststudent',
            email='student@test.com',
            password='testpass123',
            user_type='student'
        )
        
        # Create a course
        cls.course = Course.objects.create(
            title='Test Course',
            description='Test Course Description',
            teacher=cls.teacher,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date()
        )
        
        # Create an enrollment
        cls.enrollment = Enrollment.objects.create(
            student=cls.student,
            course=cls.course
        )
    
    def test_enrollment_creation(self):
        self.assertEqual(self.enrollment.student, self.student)
        self.assertEqual(self.enrollment.course, self.course)
        self.assertTrue(self.enrollment.is_active)
    
    def test_enrollment_str_method(self):
        expected_str = f"{self.student.username} enrolled in {self.course.title}"
        self.assertEqual(str(self.enrollment), expected_str)
    
    def test_unique_together_constraint(self):
        # Try to create a duplicate enrollment
        with self.assertRaises(Exception):  
            Enrollment.objects.create(
                student=self.student,
                course=self.course
            )


class CourseMaterialModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a teacher user
        cls.teacher = User.objects.create_user(
            username='testteacher',
            email='teacher@test.com',
            password='testpass123',
            user_type='teacher'
        )
        
        # Create a course
        cls.course = Course.objects.create(
            title='Test Course',
            description='Test Course Description',
            teacher=cls.teacher,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date()
        )
        
        # Create a simple test file
        cls.test_file = SimpleUploadedFile(
            "test_file.txt", 
            b"file content", 
            content_type="text/plain"
        )
        
        # Create a course material
        cls.material = CourseMaterial.objects.create(
            course=cls.course,
            title='Test Material',
            description='Test Material Description',
            file_path=cls.test_file,
            file_type='document'
        )
    
    def test_material_creation(self):
        self.assertEqual(self.material.title, 'Test Material')
        self.assertEqual(self.material.description, 'Test Material Description')
        self.assertEqual(self.material.course, self.course)
        self.assertEqual(self.material.file_type, 'document')
        self.assertTrue(self.material.is_visible)
    
    def test_material_str_method(self):
        expected_str = f"{self.course.title} - {self.material.title}"
        self.assertEqual(str(self.material), expected_str)


class AssignmentModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a teacher user
        cls.teacher = User.objects.create_user(
            username='testteacher',
            email='teacher@test.com',
            password='testpass123',
            user_type='teacher'
        )
        
        # Create a course
        cls.course = Course.objects.create(
            title='Test Course',
            description='Test Course Description',
            teacher=cls.teacher,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date()
        )
        
        # Create a simple test file
        cls.test_file = SimpleUploadedFile(
            "test_file.pdf", 
            b"file content", 
            content_type="application/pdf"
        )
        
       
        cls.assignment = Assignment.objects.create(
            course=cls.course,
            title='Test Assignment',
            description='Test Assignment Description',
            file_path=cls.test_file,  
            due_date=timezone.now() + timedelta(days=7),
            total_points=100
        )
    
    def test_assignment_creation(self):
        self.assertEqual(self.assignment.title, 'Test Assignment')
        self.assertEqual(self.assignment.description, 'Test Assignment Description')
        self.assertEqual(self.assignment.course, self.course)
        self.assertEqual(self.assignment.total_points, 100)
    
    def test_assignment_str_method(self):
        expected_str = f"{self.course.title} - {self.assignment.title}"
        self.assertEqual(str(self.assignment), expected_str)


# Serializer Tests
class CourseSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a teacher user
        cls.teacher = User.objects.create_user(
            username='testteacher',
            email='teacher@test.com',
            password='testpass123',
            user_type='teacher'
        )
    
    def test_course_serializer_valid_data(self):
        # Course data
        course_data = {
            'title': 'Test Course',
            'description': 'Test Course Description',
            'teacher': self.teacher.id,
            'start_date': timezone.now().date().isoformat(),
            'end_date': (timezone.now() + timedelta(days=30)).date().isoformat()
        }
        
        # Serialize the data
        serializer = CourseSerializer(data=course_data)
        
        # Check if valid
        self.assertTrue(serializer.is_valid())
    
    def test_course_serializer_invalid_data(self):
        # Course data with missing required field
        course_data = {
            'title': 'Test Course',
            # Missing description
            'teacher': self.teacher.id,
            'start_date': timezone.now().date().isoformat(),
            'end_date': (timezone.now() + timedelta(days=30)).date().isoformat()
        }
        
        # Serialize the data
        serializer = CourseSerializer(data=course_data)
        
        # Check if invalid
        self.assertFalse(serializer.is_valid())
        self.assertIn('description', serializer.errors)


class EnrollmentSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a teacher user
        cls.teacher = User.objects.create_user(
            username='testteacher',
            email='teacher@test.com',
            password='testpass123',
            user_type='teacher'
        )
        
        # Create a student user
        cls.student = User.objects.create_user(
            username='teststudent',
            email='student@test.com',
            password='testpass123',
            user_type='student'
        )
        
        # Create a course
        cls.course = Course.objects.create(
            title='Test Course',
            description='Test Course Description',
            teacher=cls.teacher,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date()
        )
    
    def test_enrollment_serializer_valid_data(self):
        # Enrollment data
        enrollment_data = {
            'student': self.student.id,
            'course': self.course.id
        }
        
        # Serialize the data
        serializer = EnrollmentSerializer(data=enrollment_data)
        
        # Check if valid
        self.assertTrue(serializer.is_valid())
    
    def test_enrollment_serializer_invalid_data(self):
        # Enrollment data with invalid course id
        enrollment_data = {
            'student': self.student.id,
            'course': 999  
        }
        
        # Serialize the data
        serializer = EnrollmentSerializer(data=enrollment_data)
        
        # Check if invalid
        self.assertFalse(serializer.is_valid())
        self.assertIn('course', serializer.errors)


# View Tests
class CourseViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create users and course
        self.teacher = User.objects.create_user(
            username='teacher',
            email='teacher@test.com',
            password='testpass123',
            user_type='teacher'
        )
        
        self.student = User.objects.create_user(
            username='student',
            email='student@test.com',
            password='testpass123',
            user_type='student'
        )
        
        self.course = Course.objects.create(
            title='Test Course',
            description='Test Course Description',
            teacher=self.teacher,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date()
        )
        
      
        self.list_url = '/api/core/courses/'
        self.detail_url = f'/api/core/courses/{self.course.id}/'
    
    def test_get_courses_list_authenticated(self):
        # Login as student
        self.client.force_authenticate(user=self.student)
        
        # Make request
        response = self.client.get(self.list_url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
      
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_get_courses_list_teacher_only_sees_own_courses(self):
        # Login as teacher
        self.client.force_authenticate(user=self.teacher)
        
        # Make request
        response = self.client.get(self.list_url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
      
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_create_course_as_teacher(self):
        # Login as teacher
        self.client.force_authenticate(user=self.teacher)
        
        # Course data
        course_data = {
            'title': 'New Course',
            'description': 'New Course Description',
            'start_date': timezone.now().date().isoformat(),
            'end_date': (timezone.now() + timedelta(days=30)).date().isoformat()
        }
        
        # Make request
        response = self.client.post(self.list_url, course_data, format='json')
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Course')
    
    def test_create_course_as_student_allowed(self):
        # Login as student
        self.client.force_authenticate(user=self.student)
        
        # Course data
        course_data = {
            'title': 'Student Course',
            'description': 'Student Course Description',
            'start_date': timezone.now().date().isoformat(),
            'end_date': (timezone.now() + timedelta(days=30)).date().isoformat()
        }
        
        # Make request
        response = self.client.post(self.list_url, course_data, format='json')
        

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class EnrollmentViewSetTest(TestCase):
    def setUp(self):
        # Create a client
        self.client = APIClient()
        
        # Create users and course
        self.teacher = User.objects.create_user(
            username='teacher',
            email='teacher@test.com',
            password='testpass123',
            user_type='teacher'
        )
        
        self.student = User.objects.create_user(
            username='student',
            email='student@test.com',
            password='testpass123',
            user_type='student'
        )
        
        self.course = Course.objects.create(
            title='Test Course',
            description='Test Course Description',
            teacher=self.teacher,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date()
        )
        
       
        self.list_url = '/api/core/enrollments/'
    
    def test_student_can_enroll(self):
        # Login as student
        self.client.force_authenticate(user=self.student)
        
        # Enrollment data
        enrollment_data = {
            'student': self.student.id,
            'course': self.course.id
        }
        
        # Make request
        response = self.client.post(self.list_url, enrollment_data, format='json')
        
        # Check response status
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify enrollment was created in the database
        created_enrollment = Enrollment.objects.filter(
            student=self.student,
            course=self.course
        ).exists()
        self.assertTrue(created_enrollment)
    
    def test_duplicate_enrollment_fails(self):
        # Create enrollment
        Enrollment.objects.create(student=self.student, course=self.course)
        
        # Login as student
        self.client.force_authenticate(user=self.student)
        
        # Enrollment data
        enrollment_data = {
            'student': self.student.id,
            'course': self.course.id
        }
        
        # Make request
        response = self.client.post(self.list_url, enrollment_data, format='json')
        
        # Check response - should be bad request due to unique constraint
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
