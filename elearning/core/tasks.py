from celery import shared_task
from userauths.models import Notification
from .models import Enrollment, CourseMaterial

@shared_task
def notify_teacher_enrollment(student_id, course_id):
    student = User.objects.get(id=student_id)
    course = Course.objects.get(id=course_id)
    Notification.objects.create(
        user=course.teacher,
        notification_type='enrollment',
        message=f"{student.username} enrolled in {course.title}",
        related_id=course_id
    )

@shared_task
def notify_students_material(material_id):
    material = CourseMaterial.objects.get(id=material_id)
    enrollments = Enrollment.objects.filter(course=material.course)
    for enrollment in enrollments:
        Notification.objects.create(
            user=enrollment.student,
            notification_type='material',
            message=f"New material '{material.title}' added to {material.course.title}",
            related_id=material_id
        )