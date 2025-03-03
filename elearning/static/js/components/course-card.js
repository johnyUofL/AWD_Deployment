// components/course-card.js
// Course card component for displaying course information

/**
 * Generate HTML for a course card
 * @param {Object} course - Course data
 * @param {boolean} isEnrolled - Whether the user is enrolled in this course
 * @param {number} enrollmentId - ID of the enrollment if enrolled
 * @returns {string} - HTML string for the course card
 */
export function createCourseCard(course, isEnrolled, enrollmentId) {
    return `
        <div class="col-md-4 mb-3">
            <div class="card h-100 course-card">
                ${course.cover_image_path ? 
                    `<img src="${course.cover_image_path}" class="card-img-top" alt="${course.title}" style="max-height: 200px; object-fit: cover;">` : 
                    `<img src="https://via.placeholder.com/200x200?text=No+Image" class="card-img-top" alt="No Image" style="max-height: 200px; object-fit: cover;">`
                }
                <div class="card-body">
                    <h5 class="card-title">${course.title}</h5>
                    <p class="card-text">Taught by ${course.teacher.username}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        ${isEnrolled ? 
                            `<span class="badge bg-success">Enrolled</span>
                             <div>
                                <button class="btn btn-primary btn-sm me-1 profile-btn" data-user-id="${course.teacher.id}">View Teacher</button>
                                <button class="btn btn-primary btn-sm me-1" data-course-id="${course.id}">Open</button>
                                <button class="btn btn-danger btn-sm unenroll-btn" data-enrollment-id="${enrollmentId}">Unenroll</button>
                             </div>` : 
                            `<button class="btn btn-primary btn-sm me-1 profile-btn" data-user-id="${course.teacher.id}">View Teacher</button>
                            <button class="btn btn-primary btn-sm enroll-btn" data-course-id="${course.id}">Enroll</button>`
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate HTML for a teacher course card (used in the teacher dashboard)
 * @param {Object} course - Course data
 * @returns {string} - HTML string for the teacher course card
 */
export function createTeacherCourseCard(course) {
    return `
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
                    <p class="card-text text-truncate">${course.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-${course.is_active ? 'success' : 'secondary'}">
                            ${course.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Manage
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item view-course" href="#" data-course-id="${course.id}">View Details</a></li>
                                <li><a class="dropdown-item edit-course" href="#" data-course-id="${course.id}">Edit Course</a></li>
                                <li><a class="dropdown-item view-students" href="#" data-course-id="${course.id}">View Students</a></li>
                                <li><a class="dropdown-item manage-assignments" href="#" data-course-id="${course.id}">Manage Assignments</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item toggle-status" href="#" data-course-id="${course.id}" data-status="${course.is_active}">
                                    ${course.is_active ? 'Deactivate' : 'Activate'} Course
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-footer text-muted">
                    <small>Created: ${new Date(course.start_date).toLocaleDateString()}</small>
                </div>
            </div>
        </div>
    `;
}