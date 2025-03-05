// modules/student.js
// Functions related to student operations

import { apiFetch } from './api.js';
import { renderStudentProfile } from './ui.js';
import { showToast } from '../components/toast.js';

/**
 * View student's course progress
 * @param {number} courseId - The course ID
 * @param {Object} state - Application state
 */
export async function viewCourseProgress(courseId, state) {
    try {
        const course = await apiFetch(`http://127.0.0.1:8000/api/core/courses/${courseId}/`, {}, state.token);
        const materials = await apiFetch(`http://127.0.0.1:8000/api/core/materials/?course=${courseId}`, {}, state.token);
        const assignments = await apiFetch(`http://127.0.0.1:8000/api/core/assignments/?course=${courseId}`, {}, state.token);
        
        // Get student's progress on this course
        const progress = await apiFetch(`http://127.0.0.1:8000/api/core/progress/?student=${state.userId}&course=${courseId}`, {}, state.token);
        
        renderCourseProgress(course, materials, assignments, progress);
    } catch (error) {
        console.error('Error fetching course progress:', error);
        showToast('Failed to load course progress: ' + error.message, 'danger');
    }
}

/**
 * Render course progress view
 * @param {Object} course - Course data
 * @param {Array} materials - Course materials
 * @param {Array} assignments - Course assignments
 * @param {Array} progress - Student's progress data
 */
export function renderCourseProgress(course, materials, assignments, progress) {
    const content = document.getElementById('content');
    
    // Get completed materials
    const completedMaterialIds = progress
        .filter(p => p.content_type === 'material' && p.is_completed)
        .map(p => p.content_id);
    
    // Get submitted assignments
    const submittedAssignmentIds = progress
        .filter(p => p.content_type === 'assignment' && p.is_submitted)
        .map(p => p.content_id);
    
    // Calculate progress percentage
    const totalItems = materials.length + assignments.length;
    const completedItems = completedMaterialIds.length + submittedAssignmentIds.length;
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    content.innerHTML = `
        <div class="container mt-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>${course.title}</h1>
                <button class="btn btn-secondary" id="back-to-courses">Back to Courses</button>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Your Progress</h5>
                            <div class="progress mb-3">
                                <div class="progress-bar bg-success" role="progressbar" style="width: ${progressPercentage}%" 
                                    aria-valuenow="${progressPercentage}" aria-valuemin="0" aria-valuemax="100">
                                    ${progressPercentage}%
                                </div>
                            </div>
                            <p><strong>Materials Completed:</strong> ${completedMaterialIds.length} of ${materials.length}</p>
                            <p><strong>Assignments Submitted:</strong> ${submittedAssignmentIds.length} of ${assignments.length}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <ul class="nav nav-tabs mb-4" id="courseContentTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="materials-tab" data-bs-toggle="tab" data-bs-target="#materials" type="button" role="tab">
                        Course Materials
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="assignments-tab" data-bs-toggle="tab" data-bs-target="#assignments" type="button" role="tab">
                        Assignments
                    </button>
                </li>
            </ul>
            
            <div class="tab-content" id="courseContentTabContent">
                <!-- Materials Tab -->
                <div class="tab-pane fade show active" id="materials" role="tabpanel">
                    <div class="materials-container">
                        ${materials.length > 0 ? `
                            <div class="list-group">
                                ${materials.map(material => `
                                    <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 class="mb-1">${material.title}</h5>
                                            <small>${material.description.substring(0, 100)}${material.description.length > 100 ? '...' : ''}</small>
                                            <span class="badge bg-secondary">${material.file_type}</span>
                                        </div>
                                        <div>
                                            ${completedMaterialIds.includes(material.id) ? 
                                                `<span class="badge bg-success me-2">Completed</span>` : 
                                                `<span class="badge bg-warning me-2">Pending</span>`
                                            }
                                            <button class="btn btn-sm btn-outline-primary view-material-btn" data-id="${material.id}">
                                                <i class="bi bi-eye"></i> View
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="alert alert-info">
                                No materials have been added to this course yet.
                            </div>
                        `}
                    </div>
                </div>
                
                <!-- Assignments Tab -->
                <div class="tab-pane fade" id="assignments" role="tabpanel">
                    <div class="assignments-container">
                        ${assignments.length > 0 ? `
                            <div class="list-group">
                                ${assignments.map(assignment => `
                                    <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 class="mb-1">${assignment.title}</h5>
                                            <small>${assignment.description.substring(0, 100)}${assignment.description.length > 100 ? '...' : ''}</small>
                                            <div class="mt-1">
                                                <span class="badge bg-info">Due: ${new Date(assignment.due_date).toLocaleString()}</span>
                                                <span class="badge bg-secondary">Points: ${assignment.total_points}</span>
                                            </div>
                                        </div>
                                        <div>
                                            ${submittedAssignmentIds.includes(assignment.id) ? 
                                                `<span class="badge bg-success me-2">Submitted</span>` : 
                                                new Date(assignment.due_date) < new Date() ?
                                                    `<span class="badge bg-danger me-2">Overdue</span>` :
                                                    `<span class="badge bg-warning me-2">Pending</span>`
                                            }
                                            <button class="btn btn-sm btn-outline-primary view-assignment-btn" data-id="${assignment.id}">
                                                <i class="bi bi-eye"></i> View
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="alert alert-info">
                                No assignments have been added to this course yet.
                            </div>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('back-to-courses').addEventListener('click', () => {
        // Redirect back to courses list
        window.location.hash = '#courses';
    });
    
    // Material view buttons
    document.querySelectorAll('.view-material-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            viewMaterial(btn.getAttribute('data-id'));
        });
    });
    
    // Assignment view buttons
    document.querySelectorAll('.view-assignment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            viewAssignment(btn.getAttribute('data-id'));
        });
    });
}

/**
 * View a specific material
 * @param {number} materialId - Material ID
 */
export async function viewMaterial(materialId) {
    try {
        const material = await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`);
        
        // Handle different material types
        if (material.file_type === 'video') {
            viewVideoMaterial(material);
        } else {
            viewDocumentMaterial(material);
        }
    } catch (error) {
        console.error('Error fetching material:', error);
        showToast('Failed to load material: ' + error.message, 'danger');
    }
}

/**
 * View a video material
 * @param {Object} material - Material data
 */
function viewVideoMaterial(material) {
    const modalContent = `
        <div class="ratio ratio-16x9 mb-3">
            <video controls autoplay>
                <source src="${material.file_path}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>
        <h4>${material.title}</h4>
        <p>${material.description}</p>
    `;
    
    // Create modal with video player
    const modal = new bootstrap.Modal(document.getElementById('videoModal'));
    
    // Check if modal already exists
    let videoModal = document.getElementById('videoModal');
    if (videoModal) {
        videoModal.remove();
    }
    
    // Create new modal
    const modalHtml = `
        <div class="modal fade" id="videoModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Video: ${material.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${modalContent}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" id="markCompleteBtn">Mark as Complete</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    videoModal = document.getElementById('videoModal');
    const modal = new bootstrap.Modal(videoModal);
    modal.show();
    
    // Add mark complete event
    document.getElementById('markCompleteBtn').addEventListener('click', () => {
        markMaterialComplete(material.id);
        modal.hide();
    });
    
    // Cleanup when modal is hidden
    videoModal.addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

/**
 * View a document material
 * @param {Object} material - Material data
 */
function viewDocumentMaterial(material) {
    // Handle PDF or other document types
    window.open(material.file_path, '_blank');
    
    // Mark as viewed after opening
    setTimeout(() => {
        if (confirm('Did you review this material? Mark as complete?')) {
            markMaterialComplete(material.id);
        }
    }, 1000);
}

/**
 * Mark a material as complete
 * @param {number} materialId - Material ID
 */
async function markMaterialComplete(materialId) {
    try {
        // Update progress in the database
        await apiFetch('http://127.0.0.1:8000/api/core/progress/', {
            method: 'POST',
            body: JSON.stringify({
                content_type: 'material',
                content_id: materialId,
                is_completed: true
            })
        });
        
        showToast('Material marked as complete!', 'success');
        
        // Refresh the current page
        window.location.reload();
    } catch (error) {
        console.error('Error marking material complete:', error);
        showToast('Failed to mark material as complete: ' + error.message, 'danger');
    }
}

/**
 * View and work on an assignment
 * @param {number} assignmentId - Assignment ID
 */
export async function viewAssignment(assignmentId) {
    try {
        const assignment = await apiFetch(`http://127.0.0.1:8000/api/core/assignments/${assignmentId}/`);
        const submissions = await apiFetch(`http://127.0.0.1:8000/api/core/submissions/?assignment=${assignmentId}`);
        
        // Check if student already submitted
        const userSubmission = submissions.find(s => s.student_id === parseInt(window.appState.userId));
        
        const isSubmitted = !!userSubmission;
        const isPastDue = new Date(assignment.due_date) < new Date();
        
        const modalTitle = `Assignment: ${assignment.title}`;
        
        let modalContent = `
            <div class="mb-3">
                <h5>Description</h5>
                <p>${assignment.description}</p>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <p><strong>Due Date:</strong> ${new Date(assignment.due_date).toLocaleString()}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Points:</strong> ${assignment.total_points}</p>
                </div>
            </div>
        `;
        
        // Add submission form or show existing submission
        if (isSubmitted) {
            modalContent += `
                <div class="alert alert-success">
                    <h5>Your Submission</h5>
                    <p>${userSubmission.content || 'No text content provided.'}</p>
                    ${userSubmission.file_path ? `
                        <p><a href="${userSubmission.file_path}" target="_blank" class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-file-earmark"></i> View Submitted File
                        </a></p>
                    ` : ''}
                    <p class="mb-0"><small>Submitted on: ${new Date(userSubmission.submitted_at).toLocaleString()}</small></p>
                </div>
                ${userSubmission.grade ? `
                    <div class="alert ${userSubmission.grade >= assignment.total_points * 0.6 ? 'alert-success' : 'alert-warning'}">
                        <h5>Grade</h5>
                        <p><strong>${userSubmission.grade} / ${assignment.total_points}</strong></p>
                        ${userSubmission.feedback ? `<p><strong>Feedback:</strong> ${userSubmission.feedback}</p>` : ''}
                    </div>
                ` : '<div class="alert alert-info">Your submission is waiting to be graded.</div>'}
            `;
        } else if (isPastDue) {
            modalContent += `
                <div class="alert alert-danger">
                    <h5>Past Due</h5>
                    <p>This assignment is past its due date. Please contact your instructor if you still want to submit.</p>
                </div>
            `;
        } else {
            modalContent += `
                <form id="assignmentSubmissionForm">
                    <div class="mb-3">
                        <label for="assignmentContent" class="form-label">Your Answer</label>
                        <textarea class="form-control" id="assignmentContent" rows="6" required></textarea>
                    </div>
                    <div class="mb-3">
                        <label for="assignmentFile" class="form-label">Attach File (Optional)</label>
                        <input type="file" class="form-control" id="assignmentFile">
                    </div>
                </form>
            `;
        }
        
        // Create modal
        let assignmentModal = document.getElementById('assignmentModal');
        if (assignmentModal) {
            assignmentModal.remove();
        }
        
        const modalHtml = `
            <div class="modal fade" id="assignmentModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${modalTitle}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${modalContent}
                        </div>
                        <div class="modal-footer">
                            ${!isSubmitted && !isPastDue ? `
                                <button type="button" class="btn btn-primary" id="submitAssignmentBtn">Submit Assignment</button>
                            ` : ''}
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        assignmentModal = document.getElementById('assignmentModal');
        const modal = new bootstrap.Modal(assignmentModal);
        modal.show();
        
        // Add submit event if form is present
        if (!isSubmitted && !isPastDue) {
            document.getElementById('submitAssignmentBtn').addEventListener('click', () => {
                submitAssignment(assignment.id, modal);
            });
        }
        
        // Cleanup when modal is hidden
        assignmentModal.addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    } catch (error) {
        console.error('Error fetching assignment:', error);
        showToast('Failed to load assignment: ' + error.message, 'danger');
    }
}

/**
 * Submit an assignment
 * @param {number} assignmentId - Assignment ID
 * @param {bootstrap.Modal} modal - Bootstrap modal instance
 */
async function submitAssignment(assignmentId, modal) {
    const content = document.getElementById('assignmentContent').value;
    const file = document.getElementById('assignmentFile').files[0];
    
    if (!content) {
        showToast('Please provide an answer for the assignment', 'warning');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('assignment', assignmentId);
        formData.append('content', content);
        
        if (file) {
            formData.append('file_path', file);
        }
        
        // Submit the assignment
        const response = await apiFetch('http://127.0.0.1:8000/api/core/submissions/', {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set content-type for FormData
        }, window.appState.token);
        
        showToast('Assignment submitted successfully!', 'success');
        modal.hide();
        
        // Refresh the page to show updated submission status
        window.location.reload();
    } catch (error) {
        console.error('Error submitting assignment:', error);
        showToast('Failed to submit assignment: ' + error.message, 'danger');
    }
}

// Add this function to handle rendering the student dashboard
export async function renderStudentDashboard(state) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="d-flex justify-content-center my-5">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    try {
        // Fetch courses and enrollments
        const courses = await apiFetch(`http://127.0.0.1:8000/api/core/courses/`, {}, state.token);
        const enrollments = await apiFetch(`http://127.0.0.1:8000/api/core/enrollments/`, {}, state.token);
        
        // Filter enrollments for the current user
        const userEnrollments = enrollments.filter(e => 
            e.student_detail.id === parseInt(state.userId) && 
            e.is_active === true
        );
        
        // Create a map of course IDs to enrollment IDs
        const enrollmentMap = {};
        userEnrollments.forEach(enrollment => {
            enrollmentMap[enrollment.course_detail.id] = enrollment.id;
        });
        
        // Get IDs of enrolled courses
        const enrolledCourseIds = userEnrollments.map(e => e.course_detail.id);
        
        // Filter courses to only show enrolled ones
        const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));
        
        // Render the dashboard
        content.innerHTML = `
            <div class="container mt-4">
                <h1>My Courses</h1>
                <div class="row mb-4">
                    <div class="col">
                        <div class="alert alert-info">
                            Welcome back! You are enrolled in ${enrolledCourses.length} course(s).
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    ${enrolledCourses.length > 0 ? 
                        enrolledCourses.map(course => `
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
                                        <button class="btn btn-outline-secondary view-progress" data-course-id="${course.id}">View Progress</button>
                                    </div>
                                </div>
                            </div>
                        `).join('') : 
                        `<div class="col-12">
                            <div class="alert alert-warning">
                                You are not enrolled in any courses yet. Browse available courses to enroll.
                            </div>
                        </div>`
                    }
                </div>
                
                <div class="mt-4">
                    <h2>Available Courses</h2>
                    <button class="btn btn-outline-primary" id="browse-courses-btn">Browse All Courses</button>
                </div>
            </div>
        `;
        
        // Add event listeners for the Open buttons
        document.querySelectorAll('.open-course').forEach(button => {
            button.addEventListener('click', () => {
                const courseId = button.getAttribute('data-course-id');
                import('./courseContent.js').then(module => {
                    module.renderCourseContentPage(courseId, state);
                });
            });
        });
        
        // Add event listeners for the View Progress buttons
        document.querySelectorAll('.view-progress').forEach(button => {
            button.addEventListener('click', () => {
                const courseId = button.getAttribute('data-course-id');
                viewCourseProgress(courseId, state);
            });
        });
        
        // Add event listener for the Browse All Courses button
        document.getElementById('browse-courses-btn')?.addEventListener('click', () => {
            import('./courses.js').then(module => {
                module.fetchCourses(state);
            });
        });
        
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        content.innerHTML = `
            <div class="container mt-4">
                <div class="alert alert-danger">
                    <h4>Error Loading Dashboard</h4>
                    <p>There was a problem loading your dashboard. Please try again later.</p>
                    <p>Error: ${error.message}</p>
                </div>
            </div>
        `;
    }
}