document.querySelectorAll('.course-card button[data-course-id]').forEach(btn => {
    if (!btn.classList.contains('enroll-btn') && !btn.classList.contains('unenroll-btn')) {
        btn.addEventListener('click', () => {
            const courseId = btn.getAttribute('data-course-id');
            import('./modules/courseContent.js').then(module => {
                module.renderCourseContentPage(courseId, state);
            });
        });
    }
}); 