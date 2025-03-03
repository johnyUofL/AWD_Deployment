// modules/teacher.js
import { apiFetch } from './api.js';
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
        const course = await apiFetch(`http://127.0.0.1:8000/api/core/courses/${courseId}/`, {}, state.token);
        const materials = await apiFetch(`http://127.0.0.1:8000/api/core/materials/?course=${courseId}`, {}, state.token);
        const assignments = await apiFetch(`http://127.0.0.1:8000/api/core/assignments/?course=${courseId}`, {}, state.token);
        
        // Group materials by type
        const videoMaterials = materials.filter(m => m.file_type === 'video');
        const documentMaterials = materials.filter(m => m.file_type !== 'video');
        
        renderCourseDetailView(course, videoMaterials, documentMaterials, assignments, state);
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
            editMaterial(btn.getAttribute('data-id'), state);
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
    const modalHtml = `
        <div class="modal fade" id="addVideoModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Video</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-video-form">
                            <div class="mb-3">
                                <label for="video-title" class="form-label">Title</label>
                                <input type="text" class="form-control" id="video-title" required>
                            </div>
                            <div class="mb-3">
                                <label for="video-description" class="form-label">Description</label>
                                <textarea class="form-control" id="video-description" rows="3" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="video-file" class="form-label">Video File</label>
                                <input type="file" class="form-control" id="video-file" accept="video/*" required>
                                <small class="form-text text-muted">Supported formats: MP4, WebM, Ogg</small>
                            </div>
                            <div class="mb-3">
                                <label for="video-thumbnail" class="form-label">Thumbnail (Optional)</label>
                                <input type="file" class="form-control" id="video-thumbnail" accept="image/*">
                            </div>
                            <div class="row mb-3">
                                <div class="col">
                                    <label for="video-duration" class="form-label">Duration (seconds)</label>
                                    <input type="number" class="form-control" id="video-duration" min="1" required>
                                </div>
                                <div class="col">
                                    <label for="video-resolution" class="form-label">Resolution (Optional)</label>
                                    <input type="text" class="form-control" id="video-resolution" placeholder="e.g. 1920x1080">
                                </div>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="video-is-visible" checked>
                                <label class="form-check-label" for="video-is-visible">
                                    Make video visible to students
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
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('addVideoModal'));
    modal.show();
    
    document.getElementById('save-video-btn').addEventListener('click', () => {
        uploadVideo(courseId, modal, state);
    });
    
    document.getElementById('addVideoModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
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
        viewCourseDetails(courseId, state);
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