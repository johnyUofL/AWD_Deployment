// Add this function to handle opening a course
function handleOpenCourse(courseId, state) {
    import('./courseContent.js').then(module => {
        module.renderCourseContentPage(courseId, state);
    });
}

// Modify your renderStudentDashboard function to include the Open button
export async function renderStudentDashboard(state) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="container mt-4">
            <h1>My Courses</h1>
            <div class="row mb-4">
                <div class="col">
                    <ul class="nav nav-pills" id="coursesTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="enrolled-tab" data-bs-toggle="tab" data-bs-target="#enrolled" type="button" role="tab">
                                Enrolled Courses
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="available-tab" data-bs-toggle="tab" data-bs-target="#available" type="button" role="tab">
                                Available Courses
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div class="tab-content" id="coursesTabContent">
                <div class="tab-pane fade show active" id="enrolled" role="tabpanel">
                    <div id="enrolled-courses-container">
                        <div class="d-flex justify-content-center">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade" id="available" role="tabpanel">
                    <div id="available-courses-container">
                        <div class="d-flex justify-content-center">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Fetch courses
    try {
        const courses = await apiFetch('/api/core/courses/', {}, state.token);
        const enrollments = await apiFetch('/api/core/enrollments/', {}, state.token);
        
        const userEnrollments = enrollments.filter(e => 
            e.student_detail.id === parseInt(state.userId) && 
            e.is_active === true
        );
        
        const enrollmentMap = {};
        userEnrollments.forEach(enrollment => {
            enrollmentMap[enrollment.course_detail.id] = enrollment.id;
        });
        const enrolledCourseIds = userEnrollments.map(e => e.course_detail.id);
        
        // Render enrolled courses
        renderEnrolledCourses(courses.filter(c => enrolledCourseIds.includes(c.id)), enrollmentMap, state);
        
        // Render available courses
        renderAvailableCourses(courses.filter(c => !enrolledCourseIds.includes(c.id)), state);
    } catch (error) {
        console.error('Error fetching courses:', error);
        document.getElementById('enrolled-courses-container').innerHTML = 
            `<div class="alert alert-danger">Error loading courses: ${error.message}</div>`;
    }
}

/**
 * Render enrolled courses
 * @param {Array} courses - Enrolled courses
 * @param {Object} enrollmentMap - Map of course IDs to enrollment IDs
 * @param {Object} state - Application state
 */
function renderEnrolledCourses(courses, enrollmentMap, state) {
    const container = document.getElementById('enrolled-courses-container');
    
    if (courses.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                You are not enrolled in any courses yet. Check the "Available Courses" tab to find courses to enroll in.
            </div>
        `;
        return;
    }
    
    let enrolledCoursesHtml = '<div class="row">';
    
    courses.forEach(course => {
        enrolledCoursesHtml += `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    ${course.cover_image_path ? 
                        `<img src="${course.cover_image_path}" class="card-img-top" alt="${course.title}" style="height: 180px; object-fit: cover;">` : 
                        `<div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 180px;">
                            <i class="bi bi-image text-secondary" style="font-size: 3rem;"></i>
                        </div>`
                    }
                    <div class="card-body">
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text text-truncate">${course.description || 'No description available'}</p>
                        <p class="card-text"><small class="text-muted">Teacher: ${course.teacher_name || course.teacher.username}</small></p>
                    </div>
                    <div class="card-footer d-flex justify-content-between">
                        <button class="btn btn-primary open-course" data-course-id="${course.id}">Open</button>
                        <button class="btn btn-outline-danger unenroll-btn" data-course-id="${course.id}" data-enrollment-id="${enrollmentMap[course.id]}">Unenroll</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    enrolledCoursesHtml += '</div>';
    container.innerHTML = enrolledCoursesHtml;
    
    // Add event listeners for the Open buttons
    document.querySelectorAll('.open-course').forEach(button => {
        button.addEventListener('click', () => {
            const courseId = button.getAttribute('data-course-id');
            handleOpenCourse(courseId, state);
        });
    });
    
    // Add event listeners for the Unenroll buttons
    document.querySelectorAll('.unenroll-btn').forEach(button => {
        button.addEventListener('click', () => {
            const enrollmentId = button.getAttribute('data-enrollment-id');
            unenrollFromCourse(enrollmentId, state);
        });
    });
}

/**
 * Render available courses
 * @param {Array} courses - Available courses
 * @param {Object} state - Application state
 */
function renderAvailableCourses(courses, state) {
    const container = document.getElementById('available-courses-container');
    
    if (courses.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                There are no available courses at the moment.
            </div>
        `;
        return;
    }
    
    let availableCoursesHtml = '<div class="row">';
    
    courses.forEach(course => {
        availableCoursesHtml += `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    ${course.cover_image_path ? 
                        `<img src="${course.cover_image_path}" class="card-img-top" alt="${course.title}" style="height: 180px; object-fit: cover;">` : 
                        `<div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 180px;">
                            <i class="bi bi-image text-secondary" style="font-size: 3rem;"></i>
                        </div>`
                    }
                    <div class="card-body">
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text text-truncate">${course.description || 'No description available'}</p>
                        <p class="card-text"><small class="text-muted">Teacher: ${course.teacher_name || course.teacher.username}</small></p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary enroll-btn" data-course-id="${course.id}">Enroll</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    availableCoursesHtml += '</div>';
    container.innerHTML = availableCoursesHtml;
    
    // Add event listeners for the Enroll buttons
    document.querySelectorAll('.enroll-btn').forEach(button => {
        button.addEventListener('click', () => {
            const courseId = button.getAttribute('data-course-id');
            enrollInCourse(courseId, state);
        });
    });
}

/**
 * Enroll in a course
 * @param {string} courseId - Course ID
 * @param {Object} state - Application state
 */
async function enrollInCourse(courseId, state) {
    try {
        const response = await apiFetch('/api/core/enrollments/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                course: courseId,
                student: state.userId
            })
        }, state.token);
        
        showToast('Successfully enrolled in course!', 'success');
        renderStudentDashboard(state);
    } catch (error) {
        console.error('Error enrolling in course:', error);
        showToast('Failed to enroll in course: ' + error.message, 'danger');
    }
}

/**
 * Unenroll from a course
 * @param {string} enrollmentId - Enrollment ID
 * @param {Object} state - Application state
 */
async function unenrollFromCourse(enrollmentId, state) {
    if (!confirm('Are you sure you want to unenroll from this course?')) return;
    
    try {
        await apiFetch(`/api/core/enrollments/${enrollmentId}/`, {
            method: 'DELETE'
        }, state.token);
        
        showToast('Successfully unenrolled from course', 'warning');
        renderStudentDashboard(state);
    } catch (error) {
        console.error('Error unenrolling from course:', error);
        showToast('Failed to unenroll from course: ' + error.message, 'danger');
    }
}

// Export the view course progress function from the previous code
export { viewCourseProgress, renderCourseProgress, viewMaterial };

// Add these functions if they were in your original student.js
function viewVideoMaterial(material) {
    // Implementation from your original code
}

function viewDocumentMaterial(material) {
    // Implementation from your original code
}

async function viewAssignment(assignmentId) {
    // Implementation from your original code
} 