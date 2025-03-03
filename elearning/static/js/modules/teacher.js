// modules/teacher.js
import { apiFetch } from '../utils/api.js';
import { showToast } from '../components/toast.js';

export function renderTeacherDashboard(state) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="container mt-4">
            <div class="row mb-4">
                <div class="col">
                    <h1>Teacher Dashboard</h1>
                </div>
                <div class="col-auto">
                    <button id="create-course-btn" class="btn btn-primary">
                        <i class="bi bi-plus-circle"></i> Create New Course
                    </button>
                </div>
            </div>
            
            <ul class="nav nav-tabs mb-4" id="teacherTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="courses-tab" data-bs-toggle="tab" data-bs-target="#courses" type="button" role="tab">
                        My Courses
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="students-tab" data-bs-toggle="tab" data-bs-target="#students" type="button" role="tab">
                        My Students
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="assignments-tab" data-bs-toggle="tab" data-bs-target="#assignments" type="button" role="tab">
                        Assignments & Grades
                    </button>
                </li>
            </ul>
            
            <div class="tab-content" id="teacherTabContent">
                <div class="tab-pane fade show active" id="courses" role="tabpanel">
                    <div id="teacher-courses-container">
                        <div class="d-flex justify-content-center">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade" id="students" role="tabpanel">
                    <div id="teacher-students-container">
                        <p>Select a course to view enrolled students</p>
                    </div>
                </div>
                <div class="tab-pane fade" id="assignments" role="tabpanel">
                    <div id="teacher-assignments-container">
                        <p>Select a course to manage assignments and grades</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('create-course-btn').addEventListener('click', () => showCreateCourseModal(state));
    
    // Load teacher's courses
    fetchTeacherCourses(state);
}

export async function fetchTeacherCourses(state) {
    try {
        const courses = await apiFetch('http://127.0.0.1:8000/api/core/courses/', {}, state.token);
        const teacherCourses = courses.filter(course => course.teacher.id === parseInt(state.userId));
        
        renderTeacherCourses(teacherCourses, state);
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        document.getElementById('teacher-courses-container').innerHTML = 
            `<div class="alert alert-danger">Error loading courses: ${error.message}</div>`;
    }
}

export function renderTeacherCourses(courses, state) {
    const container = document.getElementById('teacher-courses-container');
    
    if (courses.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                You haven't created any courses yet. Click the "Create New Course" button to get started.
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="row">
            ${courses.map(course => `
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
                                        <li><a class="dropdown-item manage-content" href="#" data-course-id="${course.id}">Manage Content</a></li>
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
            `).join('')}
        </div>
    `;
    
    // Add event listeners
    document.querySelectorAll('.view-course').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            viewCourseDetails(btn.getAttribute('data-course-id'), state);
        });
    });
    
    document.querySelectorAll('.edit-course').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            editCourse(btn.getAttribute('data-course-id'), state);
        });
    });
    
    document.querySelectorAll('.view-students').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            viewCourseStudents(btn.getAttribute('data-course-id'), state);
        });
    });
    
    document.querySelectorAll('.manage-assignments').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            manageCourseAssignments(btn.getAttribute('data-course-id'), state);
        });
    });
    
    document.querySelectorAll('.manage-content').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            manageCourseContent(btn.getAttribute('data-course-id'), state);
        });
    });
    
    document.querySelectorAll('.toggle-status').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCourseStatus(
                btn.getAttribute('data-course-id'),
                btn.getAttribute('data-status') === 'true',
                state
            );
        });
    });
}

export function showCreateCourseModal(state) {
    // Get today's date in YYYY-MM-DD format for min attribute
    const today = new Date().toISOString().split('T')[0];
    
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="createCourseModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Create New Course</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="create-course-form">
                            <div class="mb-3">
                                <label for="course-title" class="form-label">Course Title</label>
                                <input type="text" class="form-control" id="course-title" required>
                            </div>
                            <div class="mb-3">
                                <label for="course-description" class="form-label">Description</label>
                                <textarea class="form-control" id="course-description" rows="4" required></textarea>
                            </div>
                            <div class="row mb-3">
                                <div class="col">
                                    <label for="course-start-date" class="form-label">Start Date</label>
                                    <input type="date" class="form-control" id="course-start-date" min="${today}" required>
                                </div>
                                <div class="col">
                                    <label for="course-end-date" class="form-label">End Date</label>
                                    <input type="date" class="form-control" id="course-end-date" min="${today}" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="course-cover-image" class="form-label">Cover Image</label>
                                <input type="file" class="form-control" id="course-cover-image" accept="image/*">
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="course-is-active" checked>
                                <label class="form-check-label" for="course-is-active">
                                    Make course active immediately
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="save-course-btn">Create Course</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Initialize modal
    const modal = new bootstrap.Modal(document.getElementById('createCourseModal'));
    modal.show();
    
    // Add event listener to save button
    document.getElementById('save-course-btn').addEventListener('click', () => createCourse(modal, state));
    
    // Add validation for end date to be after start date
    document.getElementById('course-start-date').addEventListener('change', function() {
        document.getElementById('course-end-date').min = this.value;
    });
}

export async function createCourse(modal, state) {
    const title = document.getElementById('course-title').value;
    const description = document.getElementById('course-description').value;
    const startDate = document.getElementById('course-start-date').value;
    const endDate = document.getElementById('course-end-date').value;
    const isActive = document.getElementById('course-is-active').checked;
    const coverImageFile = document.getElementById('course-cover-image').files[0];
    
    // Validate end date is after start date
    if (new Date(endDate) <= new Date(startDate)) {
        alert('End date must be after start date');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);
    formData.append('is_active', isActive);
    formData.append('teacher', state.userId);
    
    if (coverImageFile) {
        formData.append('cover_image_path', coverImageFile);
    }
    
    try {
        const response = await apiFetch('http://127.0.0.1:8000/api/core/courses/', {
            method: 'POST',
            body: formData,
            headers: {} // Let the browser set the content type for FormData
        }, state.token);
        
        console.log('Course created:', response);
        modal.hide();
        
        // Remove modal from DOM after hiding
        document.getElementById('createCourseModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
        // Show success message
        showToast('Course created successfully!', 'success');
        
        // Refresh courses list
        fetchTeacherCourses(state);
    } catch (error) {
        console.error('Error creating course:', error);
        showToast('Failed to create course: ' + error.message, 'danger');
    }
}

export async function viewCourseDetails(courseId, state) {
    try {
        // Fetch course details
        const course = await apiFetch(`http://127.0.0.1:8000/api/core/courses/${courseId}/`, {}, state.token);
        
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="courseDetailsModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Course Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-4">
                                    ${course.cover_image_path ? 
                                        `<img src="${course.cover_image_path}" class="img-fluid rounded" alt="${course.title}">` : 
                                        `<div class="bg-light d-flex align-items-center justify-content-center rounded" style="height: 200px;">
                                            <i class="bi bi-image text-secondary" style="font-size: 3rem;"></i>
                                        </div>`
                                    }
                                </div>
                                <div class="col-md-8">
                                    <h4>${course.title}</h4>
                                    <p>${course.description}</p>
                                    <div class="row mt-3">
                                        <div class="col-md-6">
                                            <p><strong>Start Date:</strong> ${new Date(course.start_date).toLocaleDateString()}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p><strong>End Date:</strong> ${new Date(course.end_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p><strong>Status:</strong> 
                                        <span class="badge bg-${course.is_active ? 'success' : 'secondary'}">
                                            ${course.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary edit-course-btn" data-course-id="${course.id}">Edit Course</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('courseDetailsModal'));
        modal.show();
        
        document.querySelector('.edit-course-btn').addEventListener('click', () => {
            modal.hide();
            editCourse(course.id, state);
        });
        
        document.getElementById('courseDetailsModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    } catch (error) {
        console.error('Error fetching course details:', error);
        showToast('Failed to load course details: ' + error.message, 'danger');
    }
}

export function renderCourseDetailView(course, videoMaterials, documentMaterials, assignments, state) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="container mt-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>${course.title}</h1>
                <button class="btn btn-secondary" id="back-to-dashboard">Back to Dashboard</button>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Course Information</h5>
                            <p>${course.description}</p>
                            <div class="d-flex justify-content-between">
                                <span><strong>Start Date:</strong> ${new Date(course.start_date).toLocaleDateString()}</span>
                                <span><strong>End Date:</strong> ${new Date(course.end_date).toLocaleDateString()}</span>
                                <span><strong>Status:</strong> <span class="badge bg-${course.is_active ? 'success' : 'secondary'}">${course.is_active ? 'Active' : 'Inactive'}</span></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Course Stats</h5>
                            <p><strong>Enrolled Students:</strong> ${course.enrollment_count || 0}</p>
                            <p><strong>Video Materials:</strong> ${videoMaterials.length}</p>
                            <p><strong>Assignments:</strong> ${assignments.length}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <ul class="nav nav-tabs mb-4" id="courseContentTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="videos-tab" data-bs-toggle="tab" data-bs-target="#videos" type="button" role="tab">
                        Video Sequence
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="materials-tab" data-bs-toggle="tab" data-bs-target="#materials" type="button" role="tab">
                        Other Materials
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="assignments-tab" data-bs-toggle="tab" data-bs-target="#assignments" type="button" role="tab">
                        Assignments
                    </button>
                </li>
            </ul>
            
            <div class="tab-content" id="courseContentTabContent">
                <!-- Videos Tab -->
                <div class="tab-pane fade show active" id="videos" role="tabpanel">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3>Video Sequence</h3>
                        <button class="btn btn-primary" id="add-video-btn">
                            <i class="bi bi-plus-circle"></i> Add Video
                        </button>
                    </div>
                    
                    <div class="video-sequence-container">
                        ${videoMaterials.length > 0 ? `
                            <div class="list-group" id="sortable-videos">
                                ${videoMaterials.map((video, index) => `
                                    <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-id="${video.id}">
                                        <div class="d-flex align-items-center">
                                            <span class="me-3">${index + 1}.</span>
                                            <div>
                                                <h5 class="mb-1">${video.title}</h5>
                                                <small>${video.description.substring(0, 100)}${video.description.length > 100 ? '...' : ''}</small>
                                            </div>
                                        </div>
                                        <div class="btn-group">
                                            <button class="btn btn-sm btn-outline-primary preview-video-btn" data-id="${video.id}">
                                                <i class="bi bi-play-circle"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-secondary edit-video-btn" data-id="${video.id}">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger delete-video-btn" data-id="${video.id}">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="alert alert-info">
                                No videos have been added to this course yet. Click the "Add Video" button to get started.
                            </div>
                        `}
                    </div>
                </div>
                
                <!-- Materials Tab -->
                <div class="tab-pane fade" id="materials" role="tabpanel">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3>Course Materials</h3>
                        <button class="btn btn-primary" id="add-material-btn">
                            <i class="bi bi-plus-circle"></i> Add Material
                        </button>
                    </div>
                    
                    <div class="materials-container">
                        ${documentMaterials.length > 0 ? `
                            <div class="list-group">
                                ${documentMaterials.map(material => `
                                    <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 class="mb-1">${material.title}</h5>
                                            <small>${material.description.substring(0, 100)}${material.description.length > 100 ? '...' : ''}</small>
                                            <span class="badge bg-secondary">${material.file_type}</span>
                                        </div>
                                        <div class="btn-group">
                                            <button class="btn btn-sm btn-outline-primary download-material-btn" data-id="${material.id}">
                                                <i class="bi bi-download"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-secondary edit-material-btn" data-id="${material.id}">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger delete-material-btn" data-id="${material.id}">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="alert alert-info">
                                No additional materials have been added to this course yet.
                            </div>
                        `}
                    </div>
                </div>
                
                <!-- Assignments Tab -->
                <div class="tab-pane fade" id="assignments" role="tabpanel">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3>Assignments</h3>
                        <button class="btn btn-primary" id="add-assignment-btn">
                            <i class="bi bi-plus-circle"></i> Add Assignment
                        </button>
                    </div>
                    
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
                                        <div class="btn-group">
                                            <button class="btn btn-sm btn-outline-success view-submissions-btn" data-id="${assignment.id}">
                                                <i class="bi bi-check-circle"></i> Submissions
                                            </button>
                                            <button class="btn btn-sm btn-outline-secondary edit-assignment-btn" data-id="${assignment.id}">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger delete-assignment-btn" data-id="${assignment.id}">
                                                <i class="bi bi-trash"></i>
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
    document.getElementById('back-to-dashboard').addEventListener('click', () => {
        renderTeacherDashboard(state);
    });
    
    // Video tab event listeners
    document.getElementById('add-video-btn').addEventListener('click', () => {
        showAddVideoModal(course.id, state);
    });
    
    document.querySelectorAll('.preview-video-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            previewVideo(btn.getAttribute('data-id'), state);
        });
    });
    
    document.querySelectorAll('.edit-video-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editVideo(btn.getAttribute('data-id'), state);
        });
    });
    
    document.querySelectorAll('.delete-video-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteVideo(btn.getAttribute('data-id'), course.id, state);
        });
    });
    
    // Materials tab event listeners
    document.getElementById('add-material-btn').addEventListener('click', () => {
        showAddMaterialModal(course.id, state);
    });
    
    document.querySelectorAll('.download-material-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            downloadMaterial(btn.getAttribute('data-id'), state);
        });
    });
    
    document.querySelectorAll('.edit-material-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editMaterial(btn.getAttribute('data-id'), course.id, state);
        });
    });
    
    document.querySelectorAll('.delete-material-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteMaterial(btn.getAttribute('data-id'), course.id, state);
        });
    });
    
    // Assignments tab event listeners
    document.getElementById('add-assignment-btn').addEventListener('click', () => {
        showAddAssignmentModal(course.id, state);
    });
    
    document.querySelectorAll('.view-submissions-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            viewAssignmentSubmissions(btn.getAttribute('data-id'), state);
        });
    });
    
    document.querySelectorAll('.edit-assignment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editAssignment(btn.getAttribute('data-id'), state);
        });
    });
    
    document.querySelectorAll('.delete-assignment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteAssignment(btn.getAttribute('data-id'), course.id, state);
        });
    });
}

export function showAddVideoModal(courseId, state) {
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="addVideoModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New Video</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-video-form">
                            <div class="mb-3">
                                <label for="video-title" class="form-label">Video Title</label>
                                <input type="text" class="form-control" id="video-title" required>
                            </div>
                            <div class="mb-3">
                                <label for="video-description" class="form-label">Description</label>
                                <textarea class="form-control" id="video-description" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="video-file" class="form-label">Video File</label>
                                <input type="file" class="form-control" id="video-file" accept="video/*" required>
                            </div>
                            <div class="mb-3">
                                <label for="video-thumbnail" class="form-label">Thumbnail (Optional)</label>
                                <input type="file" class="form-control" id="video-thumbnail" accept="image/*">
                            </div>
                            <div class="mb-3">
                                <label for="video-duration" class="form-label">Duration (seconds)</label>
                                <input type="number" class="form-control" id="video-duration" min="1" required>
                            </div>
                            <div class="mb-3">
                                <label for="video-resolution" class="form-label">Resolution (Optional)</label>
                                <input type="text" class="form-control" id="video-resolution" placeholder="e.g., 1920x1080">
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="video-is-visible" checked>
                                <label class="form-check-label" for="video-is-visible">
                                    Visible to students
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="save-video-btn">Upload Video</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to the DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Initialize the modal
    const modal = new bootstrap.Modal(document.getElementById('addVideoModal'));
    modal.show();
    
    // Add event listener for the save button
    document.getElementById('save-video-btn').addEventListener('click', async () => {
        await uploadVideo(courseId, modal, state);
    });
    
    // Clean up the modal when it's closed
    document.getElementById('addVideoModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('addVideoModal').remove();
    });
}

export async function uploadVideo(courseId, modal, state) {
    const title = document.getElementById('video-title').value;
    const description = document.getElementById('video-description').value;
    const videoFile = document.getElementById('video-file').files[0];
    const thumbnailFile = document.getElementById('video-thumbnail').files[0];
    const duration = document.getElementById('video-duration').value;
    const resolution = document.getElementById('video-resolution').value;
    const isVisible = document.getElementById('video-is-visible').checked;
    
    if (!title || !description || !videoFile || !duration) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }
    
    try {
        // First create the course material
        const materialFormData = new FormData();
        materialFormData.append('title', title);
        materialFormData.append('description', description);
        materialFormData.append('course', courseId);
        materialFormData.append('file_path', videoFile);
        materialFormData.append('file_type', 'video');
        materialFormData.append('is_visible', isVisible);
        
        const material = await apiFetch('http://127.0.0.1:8000/api/core/materials/', {
            method: 'POST',
            body: materialFormData,
            headers: {}
        }, state.token);
        
        // Then create the video resource
        const videoFormData = new FormData();
        videoFormData.append('material', material.id);
        videoFormData.append('duration', duration);
        
        if (thumbnailFile) {
            videoFormData.append('thumbnail_path', thumbnailFile);
        }
        
        if (resolution) {
            videoFormData.append('resolution', resolution);
        }
        
        await apiFetch('http://127.0.0.1:8000/api/core/video-resources/', {
            method: 'POST',
            body: videoFormData,
            headers: {}
        }, state.token);
        
        modal.hide();
        showToast('Video uploaded successfully!', 'success');
        
        // Change this line to call manageCourseContent instead of viewCourseDetails
        manageCourseContent(courseId, state);
    } catch (error) {
        console.error('Error uploading video:', error);
        showToast('Failed to upload video: ' + error.message, 'danger');
    }
}

export async function previewVideo(materialId, state) {
    try {
        const material = await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`, {}, state.token);
        const videoResource = await apiFetch(`http://127.0.0.1:8000/api/core/video-resources/?material=${materialId}`, {}, state.token);
        
        if (videoResource.length === 0) {
            showToast('Video details not found', 'danger');
            return;
        }
        
        const video = videoResource[0];
        
        const modalHtml = `
            <div class="modal fade" id="previewVideoModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${material.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="ratio ratio-16x9">
                                <video controls>
                                    <source src="${material.file_path}" type="video/mp4">
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                            <div class="mt-3">
                                <h6>Description:</h6>
                                <p>${material.description}</p>
                                <div class="d-flex justify-content-between">
                                    <span><strong>Duration:</strong> ${formatDuration(video.duration)}</span>
                                    <span><strong>Resolution:</strong> ${video.resolution || 'Not specified'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('previewVideoModal'));
        modal.show();
        
        document.getElementById('previewVideoModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    } catch (error) {
        console.error('Error previewing video:', error);
        showToast('Failed to load video: ' + error.message, 'danger');
    }
}

// Helper functions
export function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Edit Course functionality
export async function editCourse(courseId, state) {
    try {
        // Fetch the course details
        const course = await apiFetch(`http://127.0.0.1:8000/api/core/courses/${courseId}/`, {}, state.token);
        
        // Format dates for the form
        const startDate = new Date(course.start_date).toISOString().split('T')[0];
        const endDate = new Date(course.end_date).toISOString().split('T')[0];
        
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="editCourseModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Course</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-course-form">
                                <div class="mb-3">
                                    <label for="course-title" class="form-label">Course Title</label>
                                    <input type="text" class="form-control" id="course-title" value="${course.title}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="course-description" class="form-label">Description</label>
                                    <textarea class="form-control" id="course-description" rows="4" required>${course.description}</textarea>
                                </div>
                                <div class="row mb-3">
                                    <div class="col">
                                        <label for="course-start-date" class="form-label">Start Date</label>
                                        <input type="date" class="form-control" id="course-start-date" value="${startDate}" required>
                                    </div>
                                    <div class="col">
                                        <label for="course-end-date" class="form-label">End Date</label>
                                        <input type="date" class="form-control" id="course-end-date" value="${endDate}" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="course-cover-image" class="form-label">Cover Image (Leave empty to keep current image)</label>
                                    <input type="file" class="form-control" id="course-cover-image" accept="image/*">
                                    ${course.cover_image_path ? 
                                        `<div class="mt-2">
                                            <img src="${course.cover_image_path}" class="img-thumbnail" style="max-height: 100px;">
                                        </div>` : ''}
                                </div>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="course-is-active" ${course.is_active ? 'checked' : ''}>
                                    <label class="form-check-label" for="course-is-active">
                                        Course is active
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-course-btn">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editCourseModal'));
        modal.show();
        
        document.getElementById('save-course-btn').addEventListener('click', () => {
            updateCourse(courseId, modal, state);
        });
        
        document.getElementById('editCourseModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    } catch (error) {
        console.error('Error fetching course details:', error);
        showToast('Failed to load course details: ' + error.message, 'danger');
    }
}

export async function updateCourse(courseId, modal, state) {
    const title = document.getElementById('course-title').value;
    const description = document.getElementById('course-description').value;
    const startDate = document.getElementById('course-start-date').value;
    const endDate = document.getElementById('course-end-date').value;
    const isActive = document.getElementById('course-is-active').checked;
    const coverImage = document.getElementById('course-cover-image').files[0];
    
    if (!title || !description || !startDate || !endDate) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('start_date', startDate);
        formData.append('end_date', endDate);
        formData.append('is_active', isActive);
        
        if (coverImage) {
            formData.append('cover_image_path', coverImage);
        }
        
        await apiFetch(`http://127.0.0.1:8000/api/core/courses/${courseId}/`, {
            method: 'PATCH',
            body: formData,
            headers: {}
        }, state.token);
        
        modal.hide();
        showToast('Course updated successfully!', 'success');
        fetchTeacherCourses(state);
    } catch (error) {
        console.error('Error updating course:', error);
        showToast('Failed to update course: ' + error.message, 'danger');
    }
}

// View Students functionality
export async function viewCourseStudents(courseId, state) {
    try {
        // Fetch course details
        const course = await apiFetch(`http://127.0.0.1:8000/api/core/courses/${courseId}/`, {}, state.token);
        
        // Fetch enrollments for this course
        const enrollments = await apiFetch(`http://127.0.0.1:8000/api/core/enrollments/`, {}, state.token);
        const courseEnrollments = enrollments.filter(enrollment => 
            enrollment.course_detail.id === parseInt(courseId) && 
            enrollment.is_active === true
        );
        
        // Update the students tab content
        const studentsContainer = document.getElementById('teacher-students-container');
        
        if (courseEnrollments.length === 0) {
            studentsContainer.innerHTML = `
                <div class="alert alert-info">
                    <h4 class="alert-heading">No Students Enrolled</h4>
                    <p>There are currently no students enrolled in "${course.title}".</p>
                </div>
            `;
        } else {
            studentsContainer.innerHTML = `
                <div class="card mb-4">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Students Enrolled in "${course.title}"</h5>
                        <span class="badge bg-primary">${courseEnrollments.length} Students</span>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Email</th>
                                        <th>Enrollment Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${courseEnrollments.map(enrollment => `
                                        <tr>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <img src="${enrollment.student_detail.profile_picture_path || 'https://via.placeholder.com/40?text=User'}" 
                                                         class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;">
                                                    ${enrollment.student_detail.first_name} ${enrollment.student_detail.last_name}
                                                </div>
                                            </td>
                                            <td>${enrollment.student_detail.email || 'N/A'}</td>
                                            <td>${new Date(enrollment.enrollment_date).toLocaleDateString()}</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-danger remove-student" 
                                                        data-enrollment-id="${enrollment.id}">
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            // Switch to the students tab
            document.getElementById('students-tab').click();
            
            // Add event listeners
            document.querySelectorAll('.remove-student').forEach(btn => {
                btn.addEventListener('click', () => {
                    removeStudentFromCourse(btn.getAttribute('data-enrollment-id'), courseId, state);
                });
            });
        }
    } catch (error) {
        console.error('Error fetching course students:', error);
        showToast('Failed to load students: ' + error.message, 'danger');
    }
}

export async function removeStudentFromCourse(enrollmentId, courseId, state) {
    if (!confirm('Are you sure you want to remove this student from the course?')) {
        return;
    }
    
    try {
        await apiFetch(`http://127.0.0.1:8000/api/core/enrollments/${enrollmentId}/`, {
            method: 'DELETE'
        }, state.token);
        
        showToast('Student removed successfully', 'success');
        viewCourseStudents(courseId, state);
    } catch (error) {
        console.error('Error removing student:', error);
        showToast('Failed to remove student: ' + error.message, 'danger');
    }
}

// Manage Assignments functionality
export async function manageCourseAssignments(courseId, state) {
    try {
        // Fetch course details
        const course = await apiFetch(`http://127.0.0.1:8000/api/core/courses/${courseId}/`, {}, state.token);
        
        // Fetch assignments for this course
        const assignments = await apiFetch(`http://127.0.0.1:8000/api/core/assignments/?course=${courseId}`, {}, state.token);
        
        // Update the assignments tab content
        const assignmentsContainer = document.getElementById('teacher-assignments-container');
        
        assignmentsContainer.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4>Assignments for "${course.title}"</h4>
                <button class="btn btn-primary" id="add-assignment-btn">
                    <i class="bi bi-plus-circle"></i> Add Assignment
                </button>
            </div>
            
            ${assignments.length === 0 ? 
                `<div class="alert alert-info">
                    <p>No assignments have been created for this course yet.</p>
                </div>` : 
                `<div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Due Date</th>
                                <th>Points</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${assignments.map(assignment => `
                                <tr>
                                    <td>${assignment.title}</td>
                                    <td>${new Date(assignment.due_date).toLocaleString()}</td>
                                    <td>${assignment.total_points}</td>
                                    <td>
                                        <div class="btn-group" role="group">
                                            <button class="btn btn-sm btn-outline-primary view-submissions-btn" data-id="${assignment.id}">
                                                <i class="bi bi-check-circle"></i> Submissions
                                            </button>
                                            <button class="btn btn-sm btn-outline-secondary edit-assignment-btn" data-id="${assignment.id}">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger delete-assignment-btn" data-id="${assignment.id}">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            }
        `;
        
        // Switch to the assignments tab
        document.getElementById('assignments-tab').click();
        
        // Add event listeners
        document.getElementById('add-assignment-btn').addEventListener('click', () => {
            showAddAssignmentModal(courseId, state);
        });
        
        document.querySelectorAll('.view-submissions-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                viewAssignmentSubmissions(btn.getAttribute('data-id'), state);
            });
        });
        
        document.querySelectorAll('.edit-assignment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                editAssignment(btn.getAttribute('data-id'), state);
            });
        });
        
        document.querySelectorAll('.delete-assignment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteAssignment(btn.getAttribute('data-id'), courseId, state);
            });
        });
    } catch (error) {
        console.error('Error fetching course assignments:', error);
        showToast('Failed to load assignments: ' + error.message, 'danger');
    }
}

export function showAddAssignmentModal(courseId, state) {
    // Get tomorrow's date in YYYY-MM-DDThh:mm format for min attribute
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 16);
    
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="addAssignmentModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New Assignment</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-assignment-form">
                            <div class="mb-3">
                                <label for="assignment-title" class="form-label">Title</label>
                                <input type="text" class="form-control" id="assignment-title" required>
                            </div>
                            <div class="mb-3">
                                <label for="assignment-description" class="form-label">Description</label>
                                <textarea class="form-control" id="assignment-description" rows="4" required></textarea>
                            </div>
                            <div class="row mb-3">
                                <div class="col">
                                    <label for="assignment-due-date" class="form-label">Due Date</label>
                                    <input type="datetime-local" class="form-control" id="assignment-due-date" min="${tomorrowStr}" required>
                                </div>
                                <div class="col">
                                    <label for="assignment-points" class="form-label">Total Points</label>
                                    <input type="number" class="form-control" id="assignment-points" min="1" value="100" required>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="save-assignment-btn">Create Assignment</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('addAssignmentModal'));
    modal.show();
    
    document.getElementById('save-assignment-btn').addEventListener('click', () => {
        createAssignment(courseId, modal, state);
    });
    
    document.getElementById('addAssignmentModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Toggle Course Status functionality
export async function toggleCourseStatus(courseId, currentStatus, state) {
    try {
        // Toggle the status
        const newStatus = !currentStatus;
        
        // Update the course
        await apiFetch(`http://127.0.0.1:8000/api/core/courses/${courseId}/`, {
            method: 'PATCH',
            body: JSON.stringify({
                is_active: newStatus
            })
        }, state.token);
        
        showToast(`Course ${newStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
        fetchTeacherCourses(state);
    } catch (error) {
        console.error('Error toggling course status:', error);
        showToast('Failed to update course status: ' + error.message, 'danger');
    }
}

// Edit a video material
export async function editVideoMaterial(materialId, courseId, state) {
    try {
        // Fetch the material details
        const material = await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`, {}, state.token);
        
        // Try to fetch video details, but don't fail if they don't exist
        let videoDetails = null;
        try {
            const videoResources = await apiFetch(`http://127.0.0.1:8000/api/core/video-resources/?material=${materialId}`, {}, state.token);
            if (videoResources.length > 0) {
                videoDetails = videoResources[0];
            }
        } catch (error) {
            console.log('No video details found, will create new ones if needed');
        }
        
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="editVideoModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Video</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-video-form">
                                <div class="mb-3">
                                    <label for="edit-video-title" class="form-label">Video Title</label>
                                    <input type="text" class="form-control" id="edit-video-title" value="${material.title}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-video-description" class="form-label">Description</label>
                                    <textarea class="form-control" id="edit-video-description" rows="3">${material.description}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-video-file" class="form-label">Video File (Leave empty to keep current)</label>
                                    <input type="file" class="form-control" id="edit-video-file" accept="video/*">
                                    <small class="text-muted">Current file: ${material.file_path.split('/').pop()}</small>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-video-thumbnail" class="form-label">Thumbnail (Leave empty to keep current)</label>
                                    <input type="file" class="form-control" id="edit-video-thumbnail" accept="image/*">
                                    ${videoDetails && videoDetails.thumbnail_path ? 
                                        `<small class="text-muted">Current thumbnail: ${videoDetails.thumbnail_path.split('/').pop()}</small>` : 
                                        '<small class="text-muted">No current thumbnail</small>'
                                    }
                                </div>
                                <div class="mb-3">
                                    <label for="edit-video-duration" class="form-label">Duration (seconds)</label>
                                    <input type="number" class="form-control" id="edit-video-duration" min="1" value="${videoDetails ? videoDetails.duration : ''}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-video-resolution" class="form-label">Resolution (Optional)</label>
                                    <input type="text" class="form-control" id="edit-video-resolution" value="${videoDetails && videoDetails.resolution ? videoDetails.resolution : ''}" placeholder="e.g., 1920x1080">
                                </div>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="edit-video-is-visible" ${material.is_visible ? 'checked' : ''}>
                                    <label class="form-check-label" for="edit-video-is-visible">
                                        Visible to students
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="update-video-btn">Update Video</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Initialize the modal
        const modal = new bootstrap.Modal(document.getElementById('editVideoModal'));
        modal.show();
        
        // Add event listener for the update button
        document.getElementById('update-video-btn').addEventListener('click', async () => {
            const title = document.getElementById('edit-video-title').value;
            const description = document.getElementById('edit-video-description').value;
            const videoFile = document.getElementById('edit-video-file').files[0];
            const thumbnailFile = document.getElementById('edit-video-thumbnail').files[0];
            const duration = document.getElementById('edit-video-duration').value;
            const resolution = document.getElementById('edit-video-resolution').value;
            const isVisible = document.getElementById('edit-video-is-visible').checked;
            
            if (!title || !description || !duration) {
                showToast('Please fill in all required fields', 'warning');
                return;
            }
            
            try {
                // Update the course material
                const materialFormData = new FormData();
                materialFormData.append('title', title);
                materialFormData.append('description', description);
                materialFormData.append('course', courseId);
                materialFormData.append('is_visible', isVisible);
                
                if (videoFile) {
                    materialFormData.append('file_path', videoFile);
                }
                
                await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`, {
                    method: 'PATCH',
                    body: materialFormData,
                    headers: {}
                }, state.token);
                
                // Update or create the video resource
                const videoFormData = new FormData();
                videoFormData.append('duration', duration);
                
                if (thumbnailFile) {
                    videoFormData.append('thumbnail_path', thumbnailFile);
                }
                
                if (resolution) {
                    videoFormData.append('resolution', resolution);
                }
                
                if (videoDetails) {
                    // Update existing video resource
                    console.log('Updating video resource:', videoDetails.id);
                    await apiFetch(`http://127.0.0.1:8000/api/core/video-resources/${videoDetails.id}/`, {
                        method: 'PATCH',
                        body: videoFormData,
                        headers: {}
                    }, state.token);
                } else {
                    // Create new video resource
                    console.log('Creating new video resource for material:', materialId);
                    videoFormData.append('material', materialId);
                    try {
                        await apiFetch('http://127.0.0.1:8000/api/core/video-resources/', {
                            method: 'POST',
                            body: videoFormData,
                            headers: {}
                        }, state.token);
                    } catch (error) {
                        console.error('Error creating video resource:', error);
                        console.log('Request data:', Object.fromEntries(videoFormData.entries()));
                        throw error;
                    }
                }
                
                modal.hide();
                showToast('Video updated successfully!', 'success');
                manageCourseContent(courseId, state);
            } catch (error) {
                console.error('Error updating video:', error);
                showToast('Failed to update video: ' + error.message, 'danger');
            }
        });
        
        // Clean up the modal when it's closed
        document.getElementById('editVideoModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('editVideoModal').remove();
        });
        
    } catch (error) {
        console.error('Error editing video:', error);
        showToast('Failed to edit video: ' + error.message, 'danger');
    }
}

// Edit a general material (document, image, audio, other)
async function editMaterial(materialId, courseId, state) {
    try {
        // Fetch the material details
        const material = await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`, {}, state.token);
        
        // Get the material type label
        const materialTypeLabels = {
            'document': 'Document',
            'image': 'Image',
            'audio': 'Audio',
            'other': 'Material'
        };
        
        const typeLabel = materialTypeLabels[material.file_type] || 'Material';
        
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="editMaterialModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit ${typeLabel}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-material-form">
                                <div class="mb-3">
                                    <label for="edit-material-title" class="form-label">${typeLabel} Title</label>
                                    <input type="text" class="form-control" id="edit-material-title" value="${material.title}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-material-description" class="form-label">Description</label>
                                    <textarea class="form-control" id="edit-material-description" rows="3">${material.description}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-material-file" class="form-label">${typeLabel} File (Leave empty to keep current)</label>
                                    <input type="file" class="form-control" id="edit-material-file" ${material.file_type === 'image' ? 'accept="image/*"' : ''}>
                                    <small class="text-muted">Current file: ${material.file_path.split('/').pop()}</small>
                                </div>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="edit-material-is-visible" ${material.is_visible ? 'checked' : ''}>
                                    <label class="form-check-label" for="edit-material-is-visible">
                                        Visible to students
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="update-material-btn">Update ${typeLabel}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Initialize the modal
        const modal = new bootstrap.Modal(document.getElementById('editMaterialModal'));
        modal.show();
        
        // Add event listener for the update button
        document.getElementById('update-material-btn').addEventListener('click', async () => {
            const title = document.getElementById('edit-material-title').value;
            const description = document.getElementById('edit-material-description').value;
            const file = document.getElementById('edit-material-file').files[0];
            const isVisible = document.getElementById('edit-material-is-visible').checked;
            
            if (!title || !description) {
                showToast('Please fill in all required fields', 'warning');
                return;
            }
            
            try {
                // Update the course material
                const materialFormData = new FormData();
                materialFormData.append('title', title);
                materialFormData.append('description', description);
                materialFormData.append('course', courseId);
                materialFormData.append('is_visible', isVisible);
                
                if (file) {
                    materialFormData.append('file_path', file);
                }
                
                await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`, {
                    method: 'PATCH',
                    body: materialFormData,
                    headers: {}
                }, state.token);
                
                modal.hide();
                showToast(`${typeLabel} updated successfully!`, 'success');
                manageCourseContent(courseId, state);
            } catch (error) {
                console.error(`Error updating ${typeLabel.toLowerCase()}:`, error);
                showToast(`Failed to update ${typeLabel.toLowerCase()}: ` + error.message, 'danger');
            }
        });
        
        // Clean up the modal when it's closed
        document.getElementById('editMaterialModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('editMaterialModal').remove();
        });
        
    } catch (error) {
        console.error('Error editing material:', error);
        showToast('Failed to edit material: ' + error.message, 'danger');
    }
}

// Delete a material
async function deleteMaterial(materialId, courseId, state) {
    try {
        // Fetch the material details to get its type
        const material = await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`, {}, state.token);
        
        // Get the material type label
        const materialTypeLabels = {
            'video': 'Video',
            'document': 'Document',
            'image': 'Image',
            'audio': 'Audio',
            'other': 'Material'
        };
        
        const typeLabel = materialTypeLabels[material.file_type] || 'Material';
        
        // Show confirmation dialog
        if (!confirm(`Are you sure you want to delete this ${typeLabel.toLowerCase()}? This action cannot be undone.`)) {
            return;
        }
        
        // If it's a video, we need to delete the video resource first
        if (material.file_type === 'video') {
            try {
                const videoResources = await apiFetch(`http://127.0.0.1:8000/api/core/video-resources/?material=${materialId}`, {}, state.token);
                if (videoResources.length > 0) {
                    await apiFetch(`http://127.0.0.1:8000/api/core/video-resources/${videoResources[0].id}/`, {
                        method: 'DELETE'
                    }, state.token);
                }
            } catch (error) {
                console.error('Error deleting video resource:', error);
            }
        }
        
        // Delete the material
        await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`, {
            method: 'DELETE'
        }, state.token);
        
        showToast(`${typeLabel} deleted successfully!`, 'success');
        manageCourseContent(courseId, state);
    } catch (error) {
        console.error('Error deleting material:', error);
        showToast('Failed to delete material: ' + error.message, 'danger');
    }
}

// Course Content Management
export async function manageCourseContent(courseId, state) {
    try {
        // Fetch course details
        const course = await apiFetch(`http://127.0.0.1:8000/api/core/courses/${courseId}/`, {}, state.token);
        
        // Fetch course materials
        const materials = await apiFetch(`http://127.0.0.1:8000/api/core/materials/?course=${courseId}`, {}, state.token);
        
        // Separate materials by type
        const videoMaterials = materials.filter(material => material.file_type === 'video');
        const documentMaterials = materials.filter(material => material.file_type === 'document');
        const imageMaterials = materials.filter(material => material.file_type === 'image');
        const audioMaterials = materials.filter(material => material.file_type === 'audio');
        const otherMaterials = materials.filter(material => 
            !['video', 'document', 'image', 'audio'].includes(material.file_type));
        
        // Render the content management view
        renderCourseContentManager(course, {
            videoMaterials,
            documentMaterials,
            imageMaterials,
            audioMaterials,
            otherMaterials
        }, state);
        
    } catch (error) {
        console.error('Error loading course content:', error);
        showToast('Failed to load course content: ' + error.message, 'danger');
    }
}

export function renderCourseContentManager(course, materials, state) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="container-fluid mt-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>Course Content: ${course.title}</h1>
                <button class="btn btn-secondary" id="back-to-dashboard">Back to Dashboard</button>
            </div>
            
            <div class="row">
                <!-- Main content area -->
                <div class="col-md-12">
                    <ul class="nav nav-tabs mb-4" id="contentTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="videos-tab" data-bs-toggle="tab" data-bs-target="#videos" type="button" role="tab">
                                Videos
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="documents-tab" data-bs-toggle="tab" data-bs-target="#documents" type="button" role="tab">
                                Documents
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="images-tab" data-bs-toggle="tab" data-bs-target="#images" type="button" role="tab">
                                Images
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="audio-tab" data-bs-toggle="tab" data-bs-target="#audio" type="button" role="tab">
                                Audio
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="other-tab" data-bs-toggle="tab" data-bs-target="#other" type="button" role="tab">
                                Other
                            </button>
                        </li>
                    </ul>
                    
                    <div class="tab-content" id="contentTabsContent">
                        <!-- Videos Tab -->
                        <div class="tab-pane fade show active" id="videos" role="tabpanel">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h3>Video Content</h3>
                                <button class="btn btn-primary" id="add-video-btn">
                                    <i class="bi bi-plus-circle"></i> Add Video
                                </button>
                            </div>
                            
                            <div class="row" id="video-materials-container">
                                ${materials.videoMaterials.length > 0 ? 
                                    materials.videoMaterials.map(video => `
                                        <div class="col-md-4 mb-4">
                                            <div class="card h-100">
                                                <div class="card-img-top bg-dark d-flex justify-content-center align-items-center" style="height: 160px;">
                                                    ${video.video_details && video.video_details.thumbnail_path ? 
                                                        `<img src="${video.video_details.thumbnail_path}" class="img-fluid" style="max-height: 160px;" alt="${video.title}">` :
                                                        `<i class="bi bi-film text-light" style="font-size: 3rem;"></i>`
                                                    }
                                                </div>
                                                <div class="card-body">
                                                    <h5 class="card-title">${video.title}</h5>
                                                    <p class="card-text small text-truncate">${video.description}</p>
                                                    ${video.video_details ? 
                                                        `<p class="card-text small">
                                                            <i class="bi bi-clock"></i> ${formatDuration(video.video_details.duration)}
                                                            ${video.video_details.resolution ? ` | <i class="bi bi-display"></i> ${video.video_details.resolution}` : ''}
                                                        </p>` : ''
                                                    }
                                                </div>
                                                <div class="card-footer d-flex justify-content-between">
                                                    <button class="btn btn-sm btn-outline-primary preview-video-btn" data-id="${video.id}">
                                                        <i class="bi bi-play-fill"></i> Preview
                                                    </button>
                                                    <div class="btn-group">
                                                        <button class="btn btn-sm btn-outline-secondary edit-video-btn" data-id="${video.id}">
                                                            <i class="bi bi-pencil"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-danger delete-video-btn" data-id="${video.id}">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') : 
                                    `<div class="col-12">
                                        <div class="alert alert-info">
                                            No videos have been added to this course yet. Click the "Add Video" button to get started.
                                        </div>
                                    </div>`
                                }
                            </div>
                        </div>
                        
                        <!-- Documents Tab -->
                        <div class="tab-pane fade" id="documents" role="tabpanel">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h3>Document Content</h3>
                                <button class="btn btn-primary" id="add-document-btn">
                                    <i class="bi bi-plus-circle"></i> Add Document
                                </button>
                            </div>
                            
                            <div class="row" id="document-materials-container">
                                ${materials.documentMaterials.length > 0 ? 
                                    materials.documentMaterials.map(doc => `
                                        <div class="col-md-4 mb-4">
                                            <div class="card h-100">
                                                <div class="card-img-top bg-light d-flex justify-content-center align-items-center" style="height: 160px;">
                                                    <i class="bi bi-file-earmark-text" style="font-size: 3rem;"></i>
                                                </div>
                                                <div class="card-body">
                                                    <h5 class="card-title">${doc.title}</h5>
                                                    <p class="card-text small text-truncate">${doc.description}</p>
                                                </div>
                                                <div class="card-footer d-flex justify-content-between">
                                                    <a href="${doc.file_path}" class="btn btn-sm btn-outline-primary" target="_blank">
                                                        <i class="bi bi-eye"></i> View
                                                    </a>
                                                    <div class="btn-group">
                                                        <button class="btn btn-sm btn-outline-secondary edit-document-btn" data-id="${doc.id}">
                                                            <i class="bi bi-pencil"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-danger delete-document-btn" data-id="${doc.id}">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') : 
                                    `<div class="col-12">
                                        <div class="alert alert-info">
                                            No document materials have been added to this course yet. Click the "Add Document" button to get started.
                                        </div>
                                    </div>`
                                }
                            </div>
                        </div>
                        
                        <!-- Images Tab -->
                        <div class="tab-pane fade" id="images" role="tabpanel">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h3>Image Content</h3>
                                <button class="btn btn-primary" id="add-image-btn">
                                    <i class="bi bi-plus-circle"></i> Add Image
                                </button>
                            </div>
                            
                            <div class="row" id="image-materials-container">
                                ${materials.imageMaterials.length > 0 ? 
                                    materials.imageMaterials.map(img => `
                                        <div class="col-md-4 mb-4">
                                            <div class="card h-100">
                                                <div class="card-img-top bg-light d-flex justify-content-center align-items-center" style="height: 160px;">
                                                    <img src="${img.file_path}" class="img-fluid" style="max-height: 160px; object-fit: cover;" alt="${img.title}">
                                                </div>
                                                <div class="card-body">
                                                    <h5 class="card-title">${img.title}</h5>
                                                    <p class="card-text small text-truncate">${img.description}</p>
                                                </div>
                                                <div class="card-footer d-flex justify-content-between">
                                                    <a href="${img.file_path}" class="btn btn-sm btn-outline-primary" target="_blank">
                                                        <i class="bi bi-eye"></i> View
                                                    </a>
                                                    <div class="btn-group">
                                                        <button class="btn btn-sm btn-outline-secondary edit-image-btn" data-id="${img.id}">
                                                            <i class="bi bi-pencil"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-danger delete-image-btn" data-id="${img.id}">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') : 
                                    `<div class="col-12">
                                        <div class="alert alert-info">
                                            No image materials have been added to this course yet. Click the "Add Image" button to get started.
                                        </div>
                                    </div>`
                                }
                            </div>
                        </div>
                        
                        <!-- Audio Tab -->
                        <div class="tab-pane fade" id="audio" role="tabpanel">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h3>Audio Content</h3>
                                <button class="btn btn-primary" id="add-audio-btn">
                                    <i class="bi bi-plus-circle"></i> Add Audio
                                </button>
                            </div>
                            
                            <div class="row" id="audio-materials-container">
                                ${materials.audioMaterials.length > 0 ? 
                                    materials.audioMaterials.map(audio => `
                                        <div class="col-md-4 mb-4">
                                            <div class="card h-100">
                                                <div class="card-img-top bg-light d-flex justify-content-center align-items-center" style="height: 160px;">
                                                    <i class="bi bi-music-note-beamed" style="font-size: 3rem;"></i>
                                                </div>
                                                <div class="card-body">
                                                    <h5 class="card-title">${audio.title}</h5>
                                                    <p class="card-text small text-truncate">${audio.description}</p>
                                                    <audio controls class="w-100 mt-2">
                                                        <source src="${audio.file_path}" type="audio/mpeg">
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                </div>
                                                <div class="card-footer d-flex justify-content-between">
                                                    <a href="${audio.file_path}" class="btn btn-sm btn-outline-primary" download>
                                                        <i class="bi bi-download"></i> Download
                                                    </a>
                                                    <div class="btn-group">
                                                        <button class="btn btn-sm btn-outline-secondary edit-audio-btn" data-id="${audio.id}">
                                                            <i class="bi bi-pencil"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-danger delete-audio-btn" data-id="${audio.id}">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') : 
                                    `<div class="col-12">
                                        <div class="alert alert-info">
                                            No audio materials have been added to this course yet. Click the "Add Audio" button to get started.
                                        </div>
                                    </div>`
                                }
                            </div>
                        </div>
                        
                        <!-- Other Tab -->
                        <div class="tab-pane fade" id="other" role="tabpanel">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h3>Other Content</h3>
                                <button class="btn btn-primary" id="add-other-btn">
                                    <i class="bi bi-plus-circle"></i> Add Other Material
                                </button>
                            </div>
                            
                            <div class="row" id="other-materials-container">
                                ${materials.otherMaterials.length > 0 ? 
                                    materials.otherMaterials.map(other => `
                                        <div class="col-md-4 mb-4">
                                            <div class="card h-100">
                                                <div class="card-img-top bg-light d-flex justify-content-center align-items-center" style="height: 160px;">
                                                    <i class="bi bi-file-earmark" style="font-size: 3rem;"></i>
                                                </div>
                                                <div class="card-body">
                                                    <h5 class="card-title">${other.title}</h5>
                                                    <p class="card-text small text-truncate">${other.description}</p>
                                                </div>
                                                <div class="card-footer d-flex justify-content-between">
                                                    <a href="${other.file_path}" class="btn btn-sm btn-outline-primary" download>
                                                        <i class="bi bi-download"></i> Download
                                                    </a>
                                                    <div class="btn-group">
                                                        <button class="btn btn-sm btn-outline-secondary edit-other-btn" data-id="${other.id}">
                                                            <i class="bi bi-pencil"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-danger delete-other-btn" data-id="${other.id}">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') : 
                                    `<div class="col-12">
                                        <div class="alert alert-info">
                                            No other materials have been added to this course yet. Click the "Add Other Material" button to get started.
                                        </div>
                                    </div>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('back-to-dashboard').addEventListener('click', () => {
        renderTeacherDashboard(state);
    });
    
    // Add content buttons
    document.getElementById('add-video-btn').addEventListener('click', () => {
        showAddVideoModal(course.id, state);
    });
    
    document.getElementById('add-document-btn').addEventListener('click', () => {
        showAddDocumentModal(course.id, state);
    });
    
    document.getElementById('add-image-btn').addEventListener('click', () => {
        showAddImageModal(course.id, state);
    });
    
    document.getElementById('add-audio-btn').addEventListener('click', () => {
        showAddAudioModal(course.id, state);
    });
    
    document.getElementById('add-other-btn').addEventListener('click', () => {
        showAddOtherMaterialModal(course.id, state);
    });
    
    // Preview video buttons
    document.querySelectorAll('.preview-video-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const materialId = btn.getAttribute('data-id');
            previewVideo(materialId, state);
        });
    });
    
    // Edit buttons
    document.querySelectorAll('.edit-video-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const materialId = btn.getAttribute('data-id');
            editVideoMaterial(materialId, course.id, state);
        });
    });
    
    document.querySelectorAll('.edit-document-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const materialId = btn.getAttribute('data-id');
            editMaterial(materialId, course.id, state);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-video-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteVideo(btn.getAttribute('data-id'), course.id, state);
        });
    });
}

async function deleteVideo(materialId, courseId, state) {
    try {
        // Fetch the material details
        const material = await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`, {}, state.token);
        
        // Show confirmation dialog
        if (!confirm(`Are you sure you want to delete this video? This action cannot be undone.`)) {
            return;
        }
        
        // If it's a video, we need to delete the video resource first
        if (material.video_details) {
            try {
                console.log('Deleting video resource:', material.video_details.id);
                await apiFetch(`http://127.0.0.1:8000/api/core/video-resources/${material.video_details.id}/`, {
                    method: 'DELETE'
                }, state.token);
                console.log('Video resource deleted successfully');
            } catch (error) {
                console.error('Error deleting video resource:', error);
                // Continue with material deletion even if video resource deletion fails
            }
        }
        
        // Delete the material
        console.log('Deleting material:', materialId);
        await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`, {
            method: 'DELETE'
        }, state.token);
        
        showToast('Video deleted successfully!', 'success');
        
        // Refresh the course content view
        await manageCourseContent(courseId, state);
    } catch (error) {
        console.error('Error deleting video:', error);
        showToast('Failed to delete video: ' + error.message, 'danger');
    }
}