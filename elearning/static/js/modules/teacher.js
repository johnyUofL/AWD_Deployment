// modules/teacher.js
import { apiFetch } from '../utils/api.js';
import { showToast } from '../components/toast.js';

export function renderTeacherDashboard(state) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="container mt-4">
            <div class="row mb-4 align-items-center">
                <div class="col">
                    <h1>Teacher Dashboard</h1>
                </div>
                <div class="col-auto">
                    <button id="create-course-btn" class="btn btn-primary me-2">
                        <i class="bi bi-plus-circle"></i> Create New Course
                    </button>
                    <button id="view-users-btn" class="btn btn-outline-primary" title="View Users">
                        <i class="bi bi-person-lines-fill"></i> Users
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
    document.getElementById('view-users-btn').addEventListener('click', () => viewUsers(state));
    
    fetchTeacherCourses(state);
    
    // Initialize the chat notification system
    setTimeout(() => {
        initializeChatNotificationSystem(state);
        console.log("Chat notification system initialized");
    }, 1000);
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
                                        <li><a class="dropdown-item organize-content" href="#" data-course-id="${course.id}">Organize Content</a></li>
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
    
    document.querySelectorAll('.organize-content').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            organizeContentView(btn.getAttribute('data-course-id'), state);
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
        const course = await apiFetch(`http://127.0.0.1:8000/api/core/courses/${courseId}/`, {}, state.token);
        const assignments = await apiFetch(`http://127.0.0.1:8000/api/core/assignments/?course=${courseId}`, {}, state.token);

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
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${assignments.map(assignment => `
                                <tr>
                                    <td>${assignment.title}</td>
                                    <td>${new Date(assignment.due_date).toLocaleDateString()}</td>
                                    <td>${assignment.total_points}</td>
                                    <td>
                                        ${new Date(assignment.due_date) < new Date() ? 
                                            '<span class="badge bg-danger">Past Due</span>' : 
                                            '<span class="badge bg-success">Active</span>'}
                                    </td>
                                    <td>
                                        <div class="btn-group" role="group">
                                            <button class="btn btn-sm btn-outline-primary view-assignment" data-id="${assignment.id}">
                                                <i class="bi bi-eye"></i> View
                                            </button>
                                            <button class="btn btn-sm btn-outline-success view-submissions" data-id="${assignment.id}">
                                                <i class="bi bi-list-check"></i> Submissions
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger delete-assignment" data-id="${assignment.id}">
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

        document.getElementById('assignments-tab').click();

        document.getElementById('add-assignment-btn').addEventListener('click', () => {
            showAddAssignmentModal(courseId, state);
        });

        document.querySelectorAll('.view-submissions').forEach(btn => {
            btn.addEventListener('click', () => {
                const assignmentId = btn.getAttribute('data-id');
                viewAssignmentSubmissions(assignmentId, state);
            });
        });

        document.querySelectorAll('.delete-assignment').forEach(btn => {
            btn.addEventListener('click', () => {
                const assignmentId = btn.getAttribute('data-id');
                deleteAssignment(assignmentId, state);
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

    // Create modal HTML with file upload field
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
                            <div class="mb-3">
                                <label for="assignment-file" class="form-label">Instructions File (Optional)</label>
                                <input type="file" class="form-control" id="assignment-file" accept=".pdf,.doc,.docx,.txt">
                                <small class="text-muted">Supported formats: PDF, Word, Text</small>
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
        createAssignment(courseId, modal, state); // Call createAssignment when button is clicked
    });

    document.getElementById('addAssignmentModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

export async function createAssignment(courseId, modal, state) {
    const title = document.getElementById('assignment-title').value;
    const description = document.getElementById('assignment-description').value;
    const dueDate = document.getElementById('assignment-due-date').value;
    const totalPoints = document.getElementById('assignment-points').value;
    const assignmentFile = document.getElementById('assignment-file').files[0];

    // Validate required fields
    if (!title || !description || !dueDate || !totalPoints) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }

    // Construct FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('due_date', dueDate);
    formData.append('total_points', totalPoints);
    formData.append('course', courseId); // Link to the course
    
    if (assignmentFile) {
        formData.append('file_path', assignmentFile); // Add file if provided
    }

    try {
        const response = await apiFetch('http://127.0.0.1:8000/api/core/assignments/', {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for multipart/form-data
        }, state.token);

        console.log('Assignment created:', response);
        modal.hide();
        showToast('Assignment created successfully!', 'success');

        // Refresh the assignments view
        manageCourseAssignments(courseId, state);
    } catch (error) {
        console.error('Error creating assignment:', error);
        showToast('Failed to create assignment: ' + error.message, 'danger');
    }
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
        
        // Call manageCourseContent instead of viewCourseDetails
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

// Show modal for adding a document
export function showAddDocumentModal(courseId, state) {
    const modalHtml = `
        <div class="modal fade" id="addDocumentModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Document</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-document-form">
                            <div class="mb-3">
                                <label for="document-title" class="form-label">Document Title</label>
                                <input type="text" class="form-control" id="document-title" required>
                            </div>
                            <div class="mb-3">
                                <label for="document-description" class="form-label">Description</label>
                                <textarea class="form-control" id="document-description" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="document-file" class="form-label">Document File</label>
                                <input type="file" class="form-control" id="document-file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" required>
                                <small class="text-muted">Supported formats: PDF, Word, PowerPoint, Excel, Text</small>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="document-is-visible" checked>
                                <label class="form-check-label" for="document-is-visible">
                                    Visible to students
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="upload-document-btn">Upload Document</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to the DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Initialize the modal
    const modal = new bootstrap.Modal(document.getElementById('addDocumentModal'));
    modal.show();
    
    // Handle document upload
    document.getElementById('upload-document-btn').addEventListener('click', () => {
        uploadDocument(courseId, modal, state);
    });
    
    // Clean up the modal when it's closed
    document.getElementById('addDocumentModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('addDocumentModal').remove();
    });
}

// Upload a document
export async function uploadDocument(courseId, modal, state) {
    const title = document.getElementById('document-title').value;
    const description = document.getElementById('document-description').value;
    const documentFile = document.getElementById('document-file').files[0];
    const isVisible = document.getElementById('document-is-visible').checked;
    
    if (!title || !documentFile) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('course', courseId);
        formData.append('file_path', documentFile);
        formData.append('file_type', 'document');
        formData.append('is_visible', isVisible);
        
        await apiFetch('http://127.0.0.1:8000/api/core/materials/', {
            method: 'POST',
            body: formData,
            headers: {}
        }, state.token);
        
        modal.hide();
        showToast('Document uploaded successfully!', 'success');
        
        // Call manageCourseContent instead of viewCourseDetails
        manageCourseContent(courseId, state);
    } catch (error) {
        console.error('Error uploading document:', error);
        showToast('Failed to upload document: ' + error.message, 'danger');
    }
}

// Function to edit a document
export async function editDocumentMaterial(materialId, courseId, state) {
    try {
        // Fetch the material details
        const material = await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`, {}, state.token);
        
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="editDocumentModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Document</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-document-form">
                                <div class="mb-3">
                                    <label for="edit-document-title" class="form-label">Document Title</label>
                                    <input type="text" class="form-control" id="edit-document-title" value="${material.title}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-document-description" class="form-label">Description</label>
                                    <textarea class="form-control" id="edit-document-description" rows="3">${material.description}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-document-file" class="form-label">Document File (leave empty to keep current)</label>
                                    <input type="file" class="form-control" id="edit-document-file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt">
                                    <small class="text-muted">Current file: ${material.file_path.split('/').pop()}</small>
                                </div>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="edit-document-is-visible" ${material.is_visible ? 'checked' : ''}>
                                    <label class="form-check-label" for="edit-document-is-visible">
                                        Visible to students
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-danger me-auto" id="delete-document-btn">Delete Document</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="update-document-btn">Update Document</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Initialize the modal
        const modal = new bootstrap.Modal(document.getElementById('editDocumentModal'));
        modal.show();
        
        // Handle document deletion
        document.getElementById('delete-document-btn').addEventListener('click', () => {
            modal.hide();
            deleteMaterial(materialId, courseId, state);
        });
        
        // Handle document update
        document.getElementById('update-document-btn').addEventListener('click', async () => {
            const title = document.getElementById('edit-document-title').value;
            const description = document.getElementById('edit-document-description').value;
            const documentFile = document.getElementById('edit-document-file').files[0];
            const isVisible = document.getElementById('edit-document-is-visible').checked;
            
            if (!title) {
                showToast('Please fill in all required fields', 'warning');
                return;
            }
            
            try {
                const formData = new FormData();
                formData.append('title', title);
                formData.append('description', description);
                formData.append('is_visible', isVisible);
                
                if (documentFile) {
                    formData.append('file_path', documentFile);
                }
                
                await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`, {
                    method: 'PATCH',
                    body: formData,
                    headers: {}
                }, state.token);
                
                modal.hide();
                showToast('Document updated successfully!', 'success');
                manageCourseContent(courseId, state);
            } catch (error) {
                console.error('Error updating document:', error);
                showToast('Failed to update document: ' + error.message, 'danger');
            }
        });
        
        // Clean up the modal when it's closed
        document.getElementById('editDocumentModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('editDocumentModal').remove();
        });
        
    } catch (error) {
        console.error('Error editing document material:', error);
        showToast('Failed to edit document: ' + error.message, 'danger');
    }
}

// Show modal for adding an image
export function showAddImageModal(courseId, state) {
    const modalHtml = `
        <div class="modal fade" id="addImageModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Image</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-image-form">
                            <div class="mb-3">
                                <label for="image-title" class="form-label">Image Title</label>
                                <input type="text" class="form-control" id="image-title" required>
                            </div>
                            <div class="mb-3">
                                <label for="image-description" class="form-label">Description</label>
                                <textarea class="form-control" id="image-description" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="image-file" class="form-label">Image File</label>
                                <input type="file" class="form-control" id="image-file" accept="image/*" required>
                                <small class="text-muted">Supported formats: JPG, PNG, GIF, etc.</small>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="image-is-visible" checked>
                                <label class="form-check-label" for="image-is-visible">
                                    Visible to students
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="upload-image-btn">Upload Image</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to the DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Initialize the modal
    const modal = new bootstrap.Modal(document.getElementById('addImageModal'));
    modal.show();
    
    // Handle image upload
    document.getElementById('upload-image-btn').addEventListener('click', () => {
        uploadImage(courseId, modal, state);
    });
    
    // Clean up the modal when it's closed
    document.getElementById('addImageModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('addImageModal').remove();
    });
}

// Upload an image
export async function uploadImage(courseId, modal, state) {
    const title = document.getElementById('image-title').value;
    const description = document.getElementById('image-description').value;
    const imageFile = document.getElementById('image-file').files[0];
    const isVisible = document.getElementById('image-is-visible').checked;
    
    if (!title || !imageFile) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('course', courseId);
        formData.append('file_path', imageFile);
        formData.append('file_type', 'image');
        formData.append('is_visible', isVisible);
        
        await apiFetch('http://127.0.0.1:8000/api/core/materials/', {
            method: 'POST',
            body: formData,
            headers: {}
        }, state.token);
        
        modal.hide();
        showToast('Image uploaded successfully!', 'success');
        
        // Call manageCourseContent instead of viewCourseDetails
        manageCourseContent(courseId, state);
    } catch (error) {
        console.error('Error uploading image:', error);
        showToast('Failed to upload image: ' + error.message, 'danger');
    }
}

// Show modal for adding audio
export function showAddAudioModal(courseId, state) {
    const modalHtml = `
        <div class="modal fade" id="addAudioModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Audio</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-audio-form">
                            <div class="mb-3">
                                <label for="audio-title" class="form-label">Audio Title</label>
                                <input type="text" class="form-control" id="audio-title" required>
                            </div>
                            <div class="mb-3">
                                <label for="audio-description" class="form-label">Description</label>
                                <textarea class="form-control" id="audio-description" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="audio-file" class="form-label">Audio File</label>
                                <input type="file" class="form-control" id="audio-file" accept="audio/*" required>
                                <small class="text-muted">Supported formats: MP3, WAV, etc.</small>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="audio-is-visible" checked>
                                <label class="form-check-label" for="audio-is-visible">
                                    Visible to students
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="upload-audio-btn">Upload Audio</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to the DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Initialize the modal
    const modal = new bootstrap.Modal(document.getElementById('addAudioModal'));
    modal.show();
    
    // Handle audio upload
    document.getElementById('upload-audio-btn').addEventListener('click', () => {
        uploadAudio(courseId, modal, state);
    });
    
    // Clean up the modal when it's closed
    document.getElementById('addAudioModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('addAudioModal').remove();
    });
}

// Upload audio
export async function uploadAudio(courseId, modal, state) {
    const title = document.getElementById('audio-title').value;
    const description = document.getElementById('audio-description').value;
    const audioFile = document.getElementById('audio-file').files[0];
    const isVisible = document.getElementById('audio-is-visible').checked;
    
    if (!title || !audioFile) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('course', courseId);
        formData.append('file_path', audioFile);
        formData.append('file_type', 'audio');
        formData.append('is_visible', isVisible);
        
        await apiFetch('http://127.0.0.1:8000/api/core/materials/', {
            method: 'POST',
            body: formData,
            headers: {}
        }, state.token);
        
        modal.hide();
        showToast('Audio uploaded successfully!', 'success');
        
        // Call manageCourseContent instead of viewCourseDetails
        manageCourseContent(courseId, state);
    } catch (error) {
        console.error('Error uploading audio:', error);
        showToast('Failed to upload audio: ' + error.message, 'danger');
    }
}

// Show modal for adding other material
export function showAddOtherMaterialModal(courseId, state) {
    const modalHtml = `
        <div class="modal fade" id="addOtherMaterialModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Other Material</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-other-material-form">
                            <div class="mb-3">
                                <label for="other-title" class="form-label">Material Title</label>
                                <input type="text" class="form-control" id="other-title" required>
                            </div>
                            <div class="mb-3">
                                <label for="other-description" class="form-label">Description</label>
                                <textarea class="form-control" id="other-description" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="other-file" class="form-label">File</label>
                                <input type="file" class="form-control" id="other-file" required>
                                <small class="text-muted">Any file type</small>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="other-is-visible" checked>
                                <label class="form-check-label" for="other-is-visible">
                                    Visible to students
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="upload-other-btn">Upload Material</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to the DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Initialize the modal
    const modal = new bootstrap.Modal(document.getElementById('addOtherMaterialModal'));
    modal.show();
    
    // Handle other material upload
    document.getElementById('upload-other-btn').addEventListener('click', () => {
        uploadOtherMaterial(courseId, modal, state);
    });
    
    // Clean up the modal when it's closed
    document.getElementById('addOtherMaterialModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('addOtherMaterialModal').remove();
    });
}

// Upload other material
export async function uploadOtherMaterial(courseId, modal, state) {
    const title = document.getElementById('other-title').value;
    const description = document.getElementById('other-description').value;
    const otherFile = document.getElementById('other-file').files[0];
    const isVisible = document.getElementById('other-is-visible').checked;
    
    if (!title || !otherFile) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('course', courseId);
        formData.append('file_path', otherFile);
        formData.append('file_type', 'other');
        formData.append('is_visible', isVisible);
        
        await apiFetch('http://127.0.0.1:8000/api/core/materials/', {
            method: 'POST',
            body: formData,
            headers: {}
        }, state.token);
        
        modal.hide();
        showToast('Material uploaded successfully!', 'success');
        
        // Call manageCourseContent instead of viewCourseDetails
        manageCourseContent(courseId, state);
    } catch (error) {
        console.error('Error uploading material:', error);
        showToast('Failed to upload material: ' + error.message, 'danger');
    }
}

export async function organizeContentView(courseId, state) {
    try {
        // Fetch course details
        const course = await apiFetch(`http://127.0.0.1:8000/api/core/courses/${courseId}/`, {}, state.token);
        
        // Fetch all materials for the course
        const materials = await apiFetch(`http://127.0.0.1:8000/api/core/materials/?course=${courseId}`, {}, state.token);
        
        // Fetch all assignments for the course
        const assignments = await apiFetch(`http://127.0.0.1:8000/api/core/assignments/?course=${courseId}`, {}, state.token);
        
        // Fetch course structure if it exists
        let courseStructure = [];
        try {
            // Use the correct endpoint to get a specific course structure
            const structureResponse = await apiFetch(`http://127.0.0.1:8000/api/core/course-structure/?course=${courseId}`, {}, state.token);
            if (structureResponse && structureResponse.length > 0) {
                courseStructure = structureResponse[0].structure_data;
            }
        } catch (error) {
            console.log('No existing course structure found, creating new one');
        }
        
        // Group materials by type for easier organization
        const videoMaterials = materials.filter(m => m.file_type === 'video');
        const documentMaterials = materials.filter(m => m.file_type === 'document');
        const imageMaterials = materials.filter(m => m.file_type === 'image');
        const audioMaterials = materials.filter(m => m.file_type === 'audio');
        const otherMaterials = materials.filter(m => !['video', 'document', 'image', 'audio'].includes(m.file_type));
        
        // Render the organize content view with assignments
        renderOrganizeContentView(course, {
            videos: videoMaterials,
            documents: documentMaterials,
            images: imageMaterials,
            audio: audioMaterials,
            other: otherMaterials,
            assignments: assignments  // Add assignments to available content
        }, courseStructure, state);
        
    } catch (error) {
        console.error('Error loading content organization view:', error);
        showToast('Failed to load content organization view: ' + error.message, 'danger');
    }
}

function renderOrganizeContentView(course, materials, courseStructure, state) {
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="container-fluid mt-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>Organize Content: ${course.title}</h1>
                <button class="btn btn-secondary" id="back-to-dashboard">Back to Dashboard</button>
            </div>
            
            <div class="row">
                <div class="col-md-4">
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Available Content</h5>
                        </div>
                        <div class="card-body">
                            <ul class="nav nav-tabs" id="availableContentTabs" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="videos-tab" data-bs-toggle="tab" data-bs-target="#videos" type="button" role="tab">
                                        Videos (${materials.videos.length})
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="documents-tab" data-bs-toggle="tab" data-bs-target="#documents" type="button" role="tab">
                                        Documents (${materials.documents.length})
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="assignments-tab" data-bs-toggle="tab" data-bs-target="#assignments" type="button" role="tab">
                                        Assignments (${materials.assignments.length})
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="other-tab" data-bs-toggle="tab" data-bs-target="#other" type="button" role="tab">
                                        Other (${materials.images.length + materials.audio.length + materials.other.length})
                                    </button>
                                </li>
                            </ul>
                            
                            <div class="tab-content mt-3" id="availableContentTabContent">
                                <!-- Videos Tab -->
                                <div class="tab-pane fade show active" id="videos" role="tabpanel">
                                    <div class="available-items" id="available-videos">
                                        ${materials.videos.length > 0 ? 
                                            `<div class="list-group available-content-list">
                                                ${materials.videos.map(video => `
                                                    <div class="list-group-item list-group-item-action draggable-item" 
                                                         draggable="true" 
                                                         data-id="${video.id}" 
                                                         data-type="video"
                                                         data-title="${video.title}">
                                                        <div class="d-flex w-100 justify-content-between align-items-center">
                                                            <div>
                                                                <h6 class="mb-1">${video.title}</h6>
                                                                <small class="text-muted">${video.description.substring(0, 50)}${video.description.length > 50 ? '...' : ''}</small>
                                                            </div>
                                                            <i class="bi bi-grip-vertical handle"></i>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>` : 
                                            `<div class="alert alert-info">No video content available</div>`
                                        }
                                    </div>
                                </div>
                                
                                <!-- Documents Tab -->
                                <div class="tab-pane fade" id="documents" role="tabpanel">
                                    <div class="available-items" id="available-documents">
                                        ${materials.documents.length > 0 ? 
                                            `<div class="list-group available-content-list">
                                                ${materials.documents.map(doc => `
                                                    <div class="list-group-item list-group-item-action draggable-item" 
                                                         draggable="true" 
                                                         data-id="${doc.id}" 
                                                         data-type="document"
                                                         data-title="${doc.title}">
                                                        <div class="d-flex w-100 justify-content-between align-items-center">
                                                            <div>
                                                                <h6 class="mb-1">${doc.title}</h6>
                                                                <small class="text-muted">${doc.description.substring(0, 50)}${doc.description.length > 50 ? '...' : ''}</small>
                                                            </div>
                                                            <i class="bi bi-grip-vertical handle"></i>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>` : 
                                            `<div class="alert alert-info">No document content available</div>`
                                        }
                                    </div>
                                </div>
                                
                                <!-- Assignments Tab -->
                                <div class="tab-pane fade" id="assignments" role="tabpanel">
                                    <div class="available-items" id="available-assignments">
                                        ${materials.assignments.length > 0 ? 
                                            `<div class="list-group available-content-list">
                                                ${materials.assignments.map(assignment => `
                                                    <div class="list-group-item list-group-item-action draggable-item" 
                                                         draggable="true" 
                                                         data-id="${assignment.id}" 
                                                         data-type="assignment"
                                                         data-title="${assignment.title}">
                                                        <div class="d-flex w-100 justify-content-between align-items-center">
                                                            <div>
                                                                <h6 class="mb-1">${assignment.title}</h6>
                                                                <small class="text-muted">Due: ${new Date(assignment.due_date).toLocaleDateString()}</small>
                                                            </div>
                                                            <i class="bi bi-grip-vertical handle"></i>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>` : 
                                            `<div class="alert alert-info">No assignments available</div>`
                                        }
                                    </div>
                                </div>
                                
                                <!-- Other Tab -->
                                <div class="tab-pane fade" id="other" role="tabpanel">
                                    <div class="available-items" id="available-other">
                                        ${materials.images.length + materials.audio.length + materials.other.length > 0 ? 
                                            `<div class="list-group available-content-list">
                                                ${[...materials.images, ...materials.audio, ...materials.other].map(item => `
                                                    <div class="list-group-item list-group-item-action draggable-item" 
                                                         draggable="true" 
                                                         data-id="${item.id}" 
                                                         data-type="${item.file_type}"
                                                         data-title="${item.title}">
                                                        <div class="d-flex w-100 justify-content-between align-items-center">
                                                            <div>
                                                                <h6 class="mb-1">${item.title}</h6>
                                                                <small class="text-muted">${item.file_type.toUpperCase()}: ${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}</small>
                                                            </div>
                                                            <i class="bi bi-grip-vertical handle"></i>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>` : 
                                            `<div class="alert alert-info">No other content available</div>`
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Course Structure</h5>
                            <div>
                                <button class="btn btn-sm btn-light" id="add-section-btn">
                                    <i class="bi bi-plus-circle"></i> Add Section
                                </button>
                                <button class="btn btn-sm btn-primary" id="save-structure-btn">
                                    <i class="bi bi-save"></i> Save Structure
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="course-structure-container">
                                ${courseStructure.length > 0 ? 
                                    renderCourseStructure(courseStructure) : 
                                    `<div class="alert alert-info">
                                        <p>No course structure defined yet. Create sections and drag content from the left panel to organize your course.</p>
                                        <button class="btn btn-primary" id="create-default-structure-btn">Create Default Structure</button>
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
    
    document.getElementById('add-section-btn').addEventListener('click', () => {
        addNewSection();
    });
    
    document.getElementById('save-structure-btn').addEventListener('click', () => {
        saveCourseStructure(course.id, state);
    });
    
    if (courseStructure.length === 0) {
        document.getElementById('create-default-structure-btn')?.addEventListener('click', () => {
            createDefaultStructure(course.id, state);
        });
    }
    
    // Initialize drag and drop functionality
    initializeDragAndDrop();
}

function renderCourseStructure(structure) {
    return `
        <div class="course-structure-list" id="course-structure">
            ${structure.map((section, sectionIndex) => `
                <div class="card mb-3 course-section" data-section-id="${section.id || sectionIndex}">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-grip-vertical me-2 section-handle"></i>
                            <input type="text" class="form-control form-control-sm section-title" value="${section.title}" style="width: 300px;">
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-danger delete-section-btn">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="section-items-container" data-section-index="${sectionIndex}">
                            ${section.items && section.items.length > 0 ? 
                                section.items.map(item => `
                                    <div class="list-group-item d-flex justify-content-between align-items-center section-item" 
                                         data-id="${item.id}" 
                                         data-type="${item.type}">
                                        <div class="d-flex align-items-center">
                                            <i class="bi bi-grip-vertical me-2 item-handle"></i>
                                            <div>
                                                <span class="badge bg-${getBadgeColorForType(item.type)} me-2">${item.type}</span>
                                                ${item.title}
                                            </div>
                                        </div>
                                        <button class="btn btn-sm btn-outline-danger remove-item-btn">
                                            <i class="bi bi-x-circle"></i>
                                        </button>
                                    </div>
                                    ${item.type === 'assignment' ? `
                                        <div class="ms-4 mb-2 assignment-submit-container" data-for-item="${item.id}">
                                            <button class="btn btn-sm btn-outline-primary submit-assignment-btn" data-id="${item.id}" disabled>
                                                <i class="bi bi-upload"></i> Submit Assignment (Teacher View)
                                            </button>
                                        </div>
                                    ` : ''}
                                `).join('') : 
                                `<div class="empty-section-placeholder">Drag content items here</div>`
                            }
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getBadgeColorForType(type) {
    switch(type) {
        case 'video': return 'primary';
        case 'document': return 'success';
        case 'image': return 'info';
        case 'audio': return 'warning';
        case 'assignment': return 'danger';  // Distinct color for assignments
        default: return 'secondary';
    }
}

function addNewSection() {
    const structureContainer = document.getElementById('course-structure-container');
    
    // If there's an initial message, clear it
    if (structureContainer.querySelector('.alert')) {
        structureContainer.innerHTML = '<div class="course-structure-list" id="course-structure"></div>';
    }
    
    const courseStructure = document.getElementById('course-structure');
    if (!courseStructure) {
        structureContainer.innerHTML = '<div class="course-structure-list" id="course-structure"></div>';
    }
    
    const newSectionId = 'new-' + Date.now();
    const newSectionHtml = `
        <div class="card mb-3 course-section" data-section-id="${newSectionId}">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <i class="bi bi-grip-vertical me-2 section-handle"></i>
                    <input type="text" class="form-control form-control-sm section-title" value="New Section" style="width: 300px;">
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-danger delete-section-btn">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="section-items-container" data-section-index="${document.querySelectorAll('.course-section').length}">
                    <div class="empty-section-placeholder">Drag content items here</div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('course-structure').insertAdjacentHTML('beforeend', newSectionHtml);
    
    // Add event listener to the new delete button
    const newDeleteBtn = document.querySelector(`[data-section-id="${newSectionId}"] .delete-section-btn`);
    newDeleteBtn.addEventListener('click', function() {
        document.querySelector(`[data-section-id="${newSectionId}"]`).remove();
    });
    
    // Reinitialize drag and drop for the new section
    initializeDragAndDrop();
}

function createDefaultStructure(courseId, state) {
    const structureContainer = document.getElementById('course-structure-container');
    
    const defaultStructure = [
        { title: "Introduction", items: [] },
        { title: "Course Content", items: [] },
        { title: "Assignments", items: [] },
        { title: "Additional Resources", items: [] }
    ];
    
    structureContainer.innerHTML = renderCourseStructure(defaultStructure);
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-section-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.course-section').remove();
        });
    });
    
    // Reinitialize drag and drop
    initializeDragAndDrop();
    
    // Show success message
    showToast('Default structure created. Drag content from the left panel to organize your course.', 'success');
}

function initializeDragAndDrop() {
    // Make items draggable
    document.querySelectorAll('.draggable-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });
    
    // Set up drop zones (section containers)
    document.querySelectorAll('.section-items-container').forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('dragenter', handleDragEnter);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('drop', handleDrop);
    });
    
    // Make sections sortable
    if (typeof Sortable !== 'undefined') {
        // For sections
        new Sortable(document.getElementById('course-structure'), {
            handle: '.section-handle',
            animation: 150
        });
        
        // For items within sections
        document.querySelectorAll('.section-items-container').forEach(container => {
            new Sortable(container, {
                handle: '.item-handle',
                animation: 150,
                group: 'shared'
            });
        });
    } else {
        console.warn('Sortable.js is not loaded. Section reordering will not work.');
    }
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-section-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.course-section').remove();
        });
    });
    
    // Add event listeners to remove item buttons
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.section-item').remove();
            
            // If section is now empty, add placeholder
            const container = this.closest('.section-items-container');
            if (container.querySelectorAll('.section-item').length === 0) {
                container.innerHTML = '<div class="empty-section-placeholder">Drag content items here</div>';
            }
        });
    });
}

// Drag and drop handlers
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
        id: this.dataset.id,
        type: this.dataset.type,
        title: this.dataset.title
    }));
    this.classList.add('dragging');
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    // Get the dragged item data
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    // Remove placeholder if it exists
    const placeholder = this.querySelector('.empty-section-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    // Create a new item in the section
    const newItem = document.createElement('div');
    newItem.className = 'list-group-item d-flex justify-content-between align-items-center section-item';
    newItem.dataset.id = data.id;
    newItem.dataset.type = data.type;
    
    newItem.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-grip-vertical me-2 item-handle"></i>
            <div>
                <span class="badge bg-${getBadgeColorForType(data.type)} me-2">${data.type}</span>
                ${data.title}
            </div>
        </div>
        <button class="btn btn-sm btn-outline-danger remove-item-btn">
            <i class="bi bi-x-circle"></i>
        </button>
    `;
    
    this.appendChild(newItem);
    
    // Add "Submit Assignment" button for assignments
    if (data.type === 'assignment') {
        const submitContainer = document.createElement('div');
        submitContainer.className = 'ms-4 mb-2 assignment-submit-container';
        submitContainer.dataset.forItem = data.id;
        submitContainer.innerHTML = `
            <button class="btn btn-sm btn-outline-primary submit-assignment-btn" data-id="${data.id}" disabled>
                <i class="bi bi-upload"></i> Submit Assignment (Teacher View)
            </button>
        `;
        this.appendChild(submitContainer);
    }
    
    // Add event listener to the new remove button
    newItem.querySelector('.remove-item-btn').addEventListener('click', function() {
        // Also remove the submit button container if this is an assignment
        if (data.type === 'assignment') {
            const submitContainer = document.querySelector(`.assignment-submit-container[data-for-item="${data.id}"]`);
            if (submitContainer) {
                submitContainer.remove();
            }
        }
        
        newItem.remove();
        
        // If section is now empty, add placeholder
        if (e.currentTarget.querySelectorAll('.section-item').length === 0) {
            e.currentTarget.innerHTML = '<div class="empty-section-placeholder">Drag content items here</div>';
        }
    });
}

async function saveCourseStructure(courseId, state) {
    // Collect the structure data
    const sections = [];
    
    document.querySelectorAll('.course-section').forEach(sectionEl => {
        const sectionTitle = sectionEl.querySelector('.section-title').value;
        const sectionId = sectionEl.dataset.sectionId;
        const items = [];
        
        sectionEl.querySelectorAll('.section-item').forEach(itemEl => {
            items.push({
                id: itemEl.dataset.id,
                type: itemEl.dataset.type
            });
        });
        
        sections.push({
            id: sectionId,
            title: sectionTitle,
            items: items
        });
    });
    
    const structureData = {
        course_id: courseId,
        sections: sections
    };
    
    try {
        // Use the custom action endpoint
        await apiFetch('http://127.0.0.1:8000/api/core/course-structure/save_structure/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(structureData)
        }, state.token);
        
        // Log the saved structure to the browser console
        console.log('Saved Course Structure:', JSON.stringify(structureData, null, 2));
        
        showToast('Course structure saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving course structure:', error);
        showToast('Failed to save course structure: ' + error.message, 'danger');
    }
}

// Add this function to view all submissions for an assignment
export async function viewAssignmentSubmissions(assignmentId, state) {
    try {
        const assignment = await apiFetch(`http://127.0.0.1:8000/api/core/assignments/${assignmentId}/`, {}, state.token);
        const submissions = await apiFetch(`http://127.0.0.1:8000/api/core/submissions/?assignment=${assignmentId}`, {}, state.token);
        
        // Create modal for viewing submissions
        const modalHtml = `
            <div class="modal fade" id="submissionsModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Submissions for: ${assignment.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${submissions.length > 0 ? `
                                <div class="table-responsive">
                                    <table class="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Submission Date</th>
                                                <th>Status</th>
                                                <th>File</th>
                                                <th>Grade</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${submissions.map(submission => `
                                                <tr>
                                                    <td>${submission.student_name || 'Student'}</td>
                                                    <td>${new Date(submission.submitted_at).toLocaleString()}</td>
                                                    <td>
                                                        ${new Date(submission.submitted_at) > new Date(assignment.due_date) ? 
                                                            '<span class="badge bg-warning">Late</span>' : 
                                                            '<span class="badge bg-success">On Time</span>'}
                                                    </td>
                                                    <td>
                                                        ${submission.file_path ? 
                                                            `<a href="${submission.file_path}" target="_blank" class="btn btn-sm btn-outline-primary">
                                                                <i class="bi bi-download"></i> Download
                                                            </a>` : 
                                                            'No file'}
                                                    </td>
                                                    <td>
                                                        ${submission.grade ? 
                                                            `<span class="badge bg-${submission.grade >= assignment.total_points * 0.6 ? 'success' : 'warning'}">
                                                                ${submission.grade}/${assignment.total_points}
                                                            </span>` : 
                                                            '<span class="badge bg-secondary">Not Graded</span>'}
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-sm btn-primary grade-submission-btn" 
                                                                data-submission-id="${submission.id}" 
                                                                data-student-name="${submission.student_name || 'Student'}"
                                                                ${submission.grade ? 'disabled' : ''}>
                                                            ${submission.grade ? 'Graded' : 'Grade'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : `
                                <div class="alert alert-info">No submissions yet for this assignment.</div>
                            `}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const submissionsModal = document.getElementById('submissionsModal');
        const modal = new bootstrap.Modal(submissionsModal);
        modal.show();
        
        // Add event listeners for grading buttons
        document.querySelectorAll('.grade-submission-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const submissionId = btn.getAttribute('data-submission-id');
                const studentName = btn.getAttribute('data-student-name');
                showGradingModal(submissionId, studentName, assignment.total_points, state);
            });
        });
        
        // Cleanup when modal is hidden
        submissionsModal.addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        showToast('Failed to load submissions: ' + error.message, 'danger');
    }
}

// Add this function to show the grading modal
function showGradingModal(submissionId, studentName, totalPoints, state) {
    const modalHtml = `
        <div class="modal fade" id="gradingModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Grade Submission - ${studentName}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="grading-form">
                            <div class="mb-3">
                                <label for="grade" class="form-label">Grade (out of ${totalPoints})</label>
                                <input type="number" class="form-control" id="grade" min="0" max="${totalPoints}" required>
                            </div>
                            <div class="mb-3">
                                <label for="feedback" class="form-label">Feedback (optional)</label>
                                <textarea class="form-control" id="feedback" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="submit-grade-btn">Submit Grade</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const gradingModal = document.getElementById('gradingModal');
    const modal = new bootstrap.Modal(gradingModal);
    modal.show();
    
    // Add event listener for submit button
    document.getElementById('submit-grade-btn').addEventListener('click', async () => {
        const grade = document.getElementById('grade').value;
        const feedback = document.getElementById('feedback').value;
        
        if (!grade) {
            showToast('Please enter a grade', 'warning');
            return;
        }
        
        if (parseFloat(grade) < 0 || parseFloat(grade) > totalPoints) {
            showToast(`Grade must be between 0 and ${totalPoints}`, 'warning');
            return;
        }
        
        try {
            // Submit the grade
            await apiFetch(`http://127.0.0.1:8000/api/core/submissions/${submissionId}/grade/`, {
                method: 'POST',
                body: JSON.stringify({
                    grade: parseFloat(grade),
                    feedback: feedback
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }, state.token);
            
            showToast('Grade submitted successfully!', 'success');
            modal.hide();
            
            // Refresh the submissions view
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Error submitting grade:', error);
            showToast('Failed to submit grade: ' + error.message, 'danger');
        }
    });
    
    // Cleanup when modal is hidden
    gradingModal.addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

async function viewUsers(state) {
    try {
        // Use the correct endpoint for users
        const users = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/`, {}, state.token);
        
        const modalHtml = `
            <div class="modal fade" id="usersModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">User Directory</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <div class="input-group">
                                    <input type="text" class="form-control" id="user-search-input" placeholder="Search by name, email, or username...">
                                    <button class="btn btn-outline-primary" id="user-search-btn">
                                        <i class="bi bi-search"></i> Search
                                    </button>
                                </div>
                            </div>
                            <div id="users-list" class="row">
                                ${users.length > 0 ? users.map(user => `
                                    <div class="col-md-4 mb-3">
                                        <div class="card h-100">
                                            <div class="card-body">
                                                <div class="d-flex align-items-center mb-3">
                                                    <img src="${user.profile_picture_path || 'https://via.placeholder.com/50?text=User'}" 
                                                         class="rounded-circle me-3" style="width: 50px; height: 50px; object-fit: cover;">
                                                    <div>
                                                        <h6 class="mb-0">${user.first_name || ''} ${user.last_name || ''}</h6>
                                                        <small class="text-muted">@${user.username}</small>
                                                    </div>
                                                </div>
                                                <div class="d-flex justify-content-between">
                                                    <button class="btn btn-sm btn-outline-primary open-bio-btn" data-id="${user.id}">
                                                        <i class="bi bi-info-circle"></i> View Profile
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-success start-chat-btn" data-id="${user.id}">
                                                        <i class="bi bi-chat"></i> Start Chat
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('') : `
                                    <div class="col-12">
                                        <div class="alert alert-info">No users found</div>
                                    </div>
                                `}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="close-users-modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalElement = document.getElementById('usersModal');
        const modal = new bootstrap.Modal(modalElement);
        
        // Use a custom close button instead of data-bs-dismiss
        document.getElementById('close-users-modal').addEventListener('click', () => {
            // First move focus outside the modal
            document.getElementById('view-users-btn').focus();
            // Small delay to ensure focus has moved
            setTimeout(() => {
                modal.hide();
            }, 10);
        });
        
        // Handle the close button in the header
        document.querySelector('#usersModal .btn-close').addEventListener('click', () => {
            // First move focus outside the modal
            document.getElementById('view-users-btn').focus();
            // Small delay to ensure focus has moved
            setTimeout(() => {
                modal.hide();
            }, 10);
        });
        
        // Clean up modal when hidden
        modalElement.addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
        modal.show();

        // Add search functionality
        document.getElementById('user-search-btn').addEventListener('click', () => {
            const searchTerm = document.getElementById('user-search-input').value.trim();
            searchUsers(searchTerm, state);
        });
        
        document.getElementById('user-search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = document.getElementById('user-search-input').value.trim();
                searchUsers(searchTerm, state);
            }
        });

        // Add event listeners for bio and chat buttons
        document.querySelectorAll('.open-bio-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-id');
                viewUserBio(userId, state);
            });
        });
        
        document.querySelectorAll('.start-chat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-id');
                startChat(userId, state);
            });
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        showToast('Failed to load users: ' + error.message, 'danger');
    }
}

async function searchUsers(searchTerm, state) {
    try {
        // Filter users client-side since the API might not support search parameter
        const allUsers = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/`, {}, state.token);
        
        // Client-side filtering
        const users = allUsers.filter(user => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
                (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
                (user.username && user.username.toLowerCase().includes(searchLower)) ||
                (user.email && user.email.toLowerCase().includes(searchLower))
            );
        });
        
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = users.length > 0 ? users.map(user => `
            <div class="col-md-4 mb-3">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <img src="${user.profile_picture_path || 'https://via.placeholder.com/50?text=User'}" 
                                 class="rounded-circle me-3" style="width: 50px; height: 50px; object-fit: cover;">
                            <div>
                                <h6 class="mb-0">${user.first_name || ''} ${user.last_name || ''}</h6>
                                <small class="text-muted">@${user.username}</small>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-sm btn-outline-primary open-bio-btn" data-id="${user.id}">
                                <i class="bi bi-info-circle"></i> View Profile
                            </button>
                            <button class="btn btn-sm btn-outline-success start-chat-btn" data-id="${user.id}">
                                <i class="bi bi-chat"></i> Start Chat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('') : `
            <div class="col-12">
                <div class="alert alert-info">No users found matching "${searchTerm}"</div>
            </div>
        `;

        // Re-attach event listeners to the new buttons
        document.querySelectorAll('.open-bio-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-id');
                viewUserBio(userId, state);
            });
        });
        
        document.querySelectorAll('.start-chat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-id');
                startChat(userId, state);
            });
        });
    } catch (error) {
        console.error('Error searching users:', error);
        showToast('Failed to search users: ' + error.message, 'danger');
    }
}

async function viewUserBio(userId, state) {
    try {
        const user = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${userId}/`, {}, state.token);
        
        const bioModalHtml = `
            <div class="modal fade" id="userBioModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">User Profile</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <img src="${user.profile_picture_path || 'https://via.placeholder.com/150?text=User'}" 
                                     class="rounded-circle mb-3" style="width: 150px; height: 150px; object-fit: cover;">
                                <h4>${user.first_name || ''} ${user.last_name || ''}</h4>
                                <p class="text-muted">@${user.username}</p>
                            </div>
                            
                            <div class="card mb-3">
                                <div class="card-header">Contact Information</div>
                                <div class="card-body">
                                    <p><strong>Email:</strong> ${user.email || 'Not provided'}</p>
                                    <p><strong>Role:</strong> ${user.user_type === 'teacher' ? 'Teacher' : 'Student'}</p>
                                </div>
                            </div>
                            
                            <div class="card mb-3">
                                <div class="card-header">Bio</div>
                                <div class="card-body">
                                    ${user.bio ? `<p>${user.bio}</p>` : '<p class="text-muted">No bio provided</p>'}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="close-bio-modal">Close</button>
                            <button type="button" class="btn btn-success start-chat-modal-btn" data-id="${user.id}">
                                <i class="bi bi-chat"></i> Start Chat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', bioModalHtml);
        const bioModalElement = document.getElementById('userBioModal');
        const bioModal = new bootstrap.Modal(bioModalElement);
        
        // Use a custom close button instead of data-bs-dismiss
        document.getElementById('close-bio-modal').addEventListener('click', () => {
            // First find the button that opened this modal and focus it
            const openBioBtn = document.querySelector(`.open-bio-btn[data-id="${userId}"]`);
            if (openBioBtn) {
                openBioBtn.focus();
            } else {
                document.getElementById('view-users-btn').focus();
            }
            
            // Small delay to ensure focus has moved
            setTimeout(() => {
                bioModal.hide();
            }, 10);
        });
        
        // Handle the close button in the header
        document.querySelector('#userBioModal .btn-close').addEventListener('click', () => {
            // First find the button that opened this modal and focus it
            const openBioBtn = document.querySelector(`.open-bio-btn[data-id="${userId}"]`);
            if (openBioBtn) {
                openBioBtn.focus();
            } else {
                document.getElementById('view-users-btn').focus();
            }
            
            // Small delay to ensure focus has moved
            setTimeout(() => {
                bioModal.hide();
            }, 10);
        });
        
        // Clean up modal when hidden
        bioModalElement.addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
        bioModal.show();

        // Add event listener for the chat button in the modal
        document.querySelector('.start-chat-modal-btn').addEventListener('click', () => {
            startChat(userId, state);
        });
    } catch (error) {
        console.error('Error fetching user bio:', error);
        showToast('Failed to load user profile: ' + error.message, 'danger');
    }
}

// Function to start a chat with a user
async function startChat(userId, state) {
    try {
        console.log(`Attempting to connect to WebSocket with target user ID: ${userId}`);
        
        // Check if state is defined
        if (!state) {
            console.error('State is undefined');
            throw new Error('Application state is not available');
        }
        
        // Create a user object from the state properties if state.user doesn't exist
        if (!state.user) {
            console.log('Creating user object from state properties');
            
            // Get the current user information using the userId from state
            try {
                const currentUser = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${state.userId}/`, {}, state.token);
                state.user = currentUser;
                console.log('Current user fetched:', currentUser);
            } catch (userError) {
                // If we can't fetch the user, create a minimal user object from state
                console.log('Using minimal user object from state properties');
                state.user = {
                    id: state.userId,
                    username: state.username || 'user_' + state.userId,
                    first_name: state.firstName || '',
                    last_name: state.lastName || ''
                };
                console.log('Created user object:', state.user);
            }
        }
        
        // Get the target user's information
        const targetUser = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${userId}/`, {}, state.token);
        console.log('Target user:', targetUser);
        
        // First, check if a private chat room already exists between these users
        console.log(`Loading chat history between users ${state.user.id} and ${userId}`);
        const existingRooms = await apiFetch(`http://127.0.0.1:8000/api/addon/chat-rooms/`, {}, state.token);
        
        console.log(`Found ${existingRooms.length} chat rooms:`, existingRooms);
        
        // Look for a private chat room with both users
        let chatRoom = null;
        if (existingRooms.length > 0) {
            // Display the first room structure for debugging
            if (existingRooms[0]) {
                console.log("First room structure:", JSON.stringify(existingRooms[0], null, 2));
            }
            
            // Find a room that is private and has both users as participants
            for (const room of existingRooms) {
                if (room.is_private) {
                    // Check if both users are participants
                    const participants = await apiFetch(`http://127.0.0.1:8000/api/addon/participants/?room=${room.id}`, {}, state.token);
                    const participantIds = participants.map(p => p.user.id);
                    
                    if (participantIds.includes(parseInt(state.user.id)) && participantIds.includes(parseInt(userId))) {
                        chatRoom = room;
                        console.log(`Found existing chat room: ${room.id}`);
                        break;
                    }
                }
            }
        }
        
        // If no existing room, create a new one
        if (!chatRoom) {
            console.log("Creating new chat room");
            
            // Create a proper chat room name based on both users
            const currentUserName = state.user.username;
            const targetUserName = targetUser.username;
            const chatRoomName = `Private Chat: ${currentUserName}-${targetUserName}`;
            
            console.log(`Creating chat room with name: ${chatRoomName}`);
            
            // Create a new chat room
            chatRoom = await apiFetch('http://127.0.0.1:8000/api/addon/chat-rooms/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: chatRoomName,
                    description: '',
                    course_id: null,
                    is_private: true
                })
            }, state.token);
            
            console.log("Chat room created successfully:", chatRoom);
            
            // Add current user as participant
            await apiFetch('http://127.0.0.1:8000/api/addon/participants/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    room_id: chatRoom.id,
                    user_id: state.user.id
                })
            }, state.token);
            
            console.log(`Added current user (${state.user.id}) as participant`);
            
            // Add target user as participant
            await apiFetch('http://127.0.0.1:8000/api/addon/participants/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    room_id: chatRoom.id,
                    user_id: userId
                })
            }, state.token);
            
            console.log(`Added target user (${userId}) as participant`);
        } else {
            // If the chat room exists but has the wrong name, update it
            if (chatRoom.name === "Private Chat: johny-johnysdsdfsdf") {
                const currentUserName = state.user.username;
                const targetUserName = targetUser.username;
                const correctChatRoomName = `Private Chat: ${currentUserName}-${targetUserName}`;
                
                console.log(`Updating chat room name from "${chatRoom.name}" to "${correctChatRoomName}"`);
                
                // Update the chat room name
                await apiFetch(`http://127.0.0.1:8000/api/addon/chat-rooms/${chatRoom.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: correctChatRoomName
                    })
                }, state.token);
                
                // Update the local chatRoom object
                chatRoom.name = correctChatRoomName;
                console.log("Chat room name updated successfully");
            }
        }
        
        // Open the chat interface
        openChatInterface(chatRoom.id, targetUser, state);
        
    } catch (error) {
        console.error('Error starting chat:', error);
        showToast('Failed to start chat: ' + error.message, 'danger');
    }
}

// Function to open the chat interface
function openChatInterface(roomId, targetUser, state) {
    try {
        console.log(`Opening chat interface for room: ${roomId} with user:`, targetUser);
        
        // Check if a chat window already exists for this room
        let chatWindow = document.getElementById(`chat-window-${roomId}`);
        
        if (!chatWindow) {
            // Create a floating chat window instead of a modal
            const chatWindowHtml = `
                <div id="chat-window-${roomId}" class="chat-window" style="position: fixed; bottom: 20px; right: 20px; width: 350px; z-index: 1050; background: white; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 500px;">
                    <div class="chat-header draggable-handle" style="padding: 10px; background: #f8f9fa; border-radius: 8px 8px 0 0; cursor: move; display: flex; justify-content: space-between; align-items: center;">
                        <h6 class="m-0">Chat with ${targetUser.first_name} ${targetUser.last_name}</h6>
                        <div>
                            <button class="btn btn-sm btn-link minimize-chat-btn" style="padding: 0 5px;">
                                <i class="bi bi-dash"></i>
                            </button>
                            <button class="btn btn-sm btn-link close-chat-btn" style="padding: 0 5px;">
                                <i class="bi bi-x"></i>
                            </button>
                        </div>
                    </div>
                    <div id="chat-messages-${roomId}" class="chat-messages" style="padding: 10px; overflow-y: auto; flex-grow: 1; height: 300px;">
                        <div id="chat-status-${roomId}" class="text-center text-muted">Loading messages...</div>
                    </div>
                    <div class="chat-input" style="padding: 10px; border-top: 1px solid #dee2e6;">
                        <div class="input-group">
                            <input type="text" id="chat-input-${roomId}" class="form-control" placeholder="Type your message...">
                            <button id="send-button-${roomId}" class="btn btn-primary">Send</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', chatWindowHtml);
            chatWindow = document.getElementById(`chat-window-${roomId}`);
            
            // Make the chat window draggable
            makeChatWindowDraggable(chatWindow);
            
            // Add event listeners for the minimize and close buttons
            chatWindow.querySelector('.minimize-chat-btn').addEventListener('click', () => {
                const messagesContainer = document.getElementById(`chat-messages-${roomId}`);
                const inputContainer = chatWindow.querySelector('.chat-input');
                
                if (messagesContainer.style.display === 'none') {
                    // Expand
                    messagesContainer.style.display = 'block';
                    inputContainer.style.display = 'block';
                    chatWindow.style.height = 'auto';
                    chatWindow.querySelector('.minimize-chat-btn i').className = 'bi bi-dash';
                } else {
                    // Minimize
                    messagesContainer.style.display = 'none';
                    inputContainer.style.display = 'none';
                    chatWindow.style.height = 'auto';
                    chatWindow.querySelector('.minimize-chat-btn i').className = 'bi bi-plus';
                }
            });
            
            chatWindow.querySelector('.close-chat-btn').addEventListener('click', () => {
                chatWindow.remove();
            });
        }
        
        // Store the current room ID in a data attribute
        chatWindow.dataset.roomId = roomId;
        
        // Load existing messages
        loadChatMessages(roomId, state, `chat-messages-${roomId}`, `chat-status-${roomId}`)
            .then(() => {
                // Set up the send button event listener
                const sendButton = document.getElementById(`send-button-${roomId}`);
                if (sendButton) {
                    // Remove any existing event listeners
                    const newSendButton = sendButton.cloneNode(true);
                    sendButton.parentNode.replaceChild(newSendButton, sendButton);
                    
                    newSendButton.addEventListener('click', () => {
                        const chatInput = document.getElementById(`chat-input-${roomId}`);
                        if (chatInput && chatInput.value.trim()) {
                            sendChatMessage(roomId, chatInput.value.trim(), state, `chat-messages-${roomId}`)
                                .then(() => {
                                    chatInput.value = '';
                                })
                                .catch(error => {
                                    console.error('Error sending message:', error);
                                });
                        }
                    });
                }
                
                // Set up the chat input event listener for Enter key
                const chatInput = document.getElementById(`chat-input-${roomId}`);
                if (chatInput) {
                    // Remove any existing event listeners
                    const newChatInput = chatInput.cloneNode(true);
                    chatInput.parentNode.replaceChild(newChatInput, chatInput);
                    
                    newChatInput.addEventListener('keypress', (event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            const sendButton = document.getElementById(`send-button-${roomId}`);
                            if (sendButton) {
                                sendButton.click();
                            }
                        }
                    });
                }
            })
            .catch(error => {
                console.error('Error loading chat messages:', error);
                const chatStatus = document.getElementById(`chat-status-${roomId}`);
                if (chatStatus) {
                    chatStatus.textContent = 'Failed to load messages. Please try again.';
                }
            });
        
    } catch (error) {
        console.error('Error opening chat interface:', error);
        showToast('Failed to open chat interface: ' + error.message, 'danger');
    }
}

// Function to make chat windows draggable
function makeChatWindowDraggable(element) {
    const handle = element.querySelector('.draggable-handle');
    
    let offsetX, offsetY, isDragging = false;
    
    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        // Add a high z-index to ensure it stays on top while dragging
        element.style.zIndex = '1070';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        // Ensure the chat window stays within the viewport
        const maxX = window.innerWidth - element.offsetWidth;
        const maxY = window.innerHeight - element.offsetHeight;
        
        const boundedX = Math.max(0, Math.min(x, maxX));
        const boundedY = Math.max(0, Math.min(y, maxY));
        
        element.style.left = `${boundedX}px`;
        element.style.top = `${boundedY}px`;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        // Reset to the normal z-index
        element.style.zIndex = '1050';
    });
}

// Updated function to load chat messages for a specific room
function loadChatMessages(roomId, state, messagesContainerId = 'chat-messages', statusElementId = 'chat-status') {
    console.log(`Loading messages for room ID: ${roomId}`);
    
    return apiFetch(`http://127.0.0.1:8000/api/addon/messages/?room=${roomId}`, {}, state.token)
        .then(messages => {
            console.log(`Loaded ${messages.length} messages for room ${roomId}`);
            
            // Filter messages to ensure they belong to the current room
            const filteredMessages = messages.filter(message => message.room.id === parseInt(roomId));
            console.log(`After filtering, ${filteredMessages.length} messages belong to room ${roomId}`);
            
            // Display messages in the chat container
            const chatMessagesContainer = document.getElementById(messagesContainerId);
            if (!chatMessagesContainer) {
                console.error(`Chat messages container ${messagesContainerId} not found`);
                return filteredMessages;
            }
            
            chatMessagesContainer.innerHTML = '';
            
            if (filteredMessages.length === 0) {
                chatMessagesContainer.innerHTML = '<div class="text-center text-muted">No messages yet. Start the conversation!</div>';
                console.log('No messages to display for this room');
            } else {
                filteredMessages.forEach(message => {
                    displayMessage(message, state.user.id, messagesContainerId);
                });
            }
            
            // Scroll to the bottom of the chat container
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
            
            return filteredMessages;
        })
        .catch(error => {
            console.error(`Error loading chat messages for room ${roomId}:`, error);
            throw error;
        });
}

// Updated function to display a message
function displayMessage(message, currentUserId, messagesContainerId = 'chat-messages') {
    const chatMessagesContainer = document.getElementById(messagesContainerId);
    if (!chatMessagesContainer) {
        console.error(`Chat messages container ${messagesContainerId} not found`);
        return;
    }
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.style.marginBottom = '10px';
    messageElement.style.padding = '8px';
    messageElement.style.borderRadius = '8px';
    
    // Add sender class if the message is from the current user
    if (message.user.id === parseInt(currentUserId)) {
        messageElement.classList.add('sender');
        messageElement.style.backgroundColor = '#e3f2fd';
        messageElement.style.marginLeft = '20%';
    } else {
        messageElement.classList.add('receiver');
        messageElement.style.backgroundColor = '#f5f5f5';
        messageElement.style.marginRight = '20%';
    }
    
    const timestamp = new Date(message.sent_at).toLocaleTimeString();
    
    messageElement.innerHTML = `
        <div class="message-content" style="word-break: break-word;">${message.content}</div>
        <div class="message-meta" style="font-size: 0.8rem; color: #6c757d; display: flex; justify-content: space-between; margin-top: 5px;">
            <span class="message-sender">${message.user.first_name || message.user.username}</span>
            <span class="message-time">${timestamp}</span>
        </div>
    `;
    
    chatMessagesContainer.appendChild(messageElement);
}

// Updated function to send a chat message
async function sendChatMessage(roomId, content, state, messagesContainerId = 'chat-messages') {
    try {
        console.log(`Sending message to room ${roomId}: ${content}`);
        
        // Create the message
        const message = await apiFetch('http://127.0.0.1:8000/api/addon/messages/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                room_id: roomId,
                content: content
            })
        }, state.token);
        
        console.log('Message sent successfully:', message);
        
        // Display the message in the chat window
        displayMessage(message, state.user.id, messagesContainerId);
        
        // Scroll to the bottom of the chat container
        const chatMessagesContainer = document.getElementById(messagesContainerId);
        if (chatMessagesContainer) {
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
        
        return message;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

// Add a chat notification system to the bottom right corner
function initializeChatNotificationSystem(state) {
    console.log("Initializing chat notification system...");
    
    // Check if the chat icon already exists
    if (document.getElementById('chat-notification-icon')) {
        console.log("Chat notification icon already exists");
        return; // Already initialized
    }
    
    // Create the chat notification icon and panel
    const chatIconHtml = `
        <div id="chat-notification-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 1040;">
            <div id="chat-notification-icon" class="rounded-circle bg-primary d-flex justify-content-center align-items-center" 
                 style="width: 50px; height: 50px; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                <i class="bi bi-chat-dots text-white" style="font-size: 1.5rem;"></i>
                <span id="unread-message-count" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                      style="display: none;">
                    0
                </span>
            </div>
            
            <div id="chat-list-panel" class="card" 
                 style="position: absolute; bottom: 60px; right: 0; width: 300px; max-height: 400px; display: none; overflow-y: auto;">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h6 class="m-0">Your Conversations</h6>
                    <button id="refresh-chats-btn" class="btn btn-sm btn-link text-white p-0">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                </div>
                <div class="card-body p-0">
                    <div id="chat-rooms-list" class="list-group list-group-flush">
                        <div class="text-center p-3">
                            <div class="spinner-border spinner-border-sm text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="text-muted mb-0">Loading your conversations...</p>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <button id="view-all-users-btn" class="btn btn-sm btn-outline-primary w-100">
                        <i class="bi bi-people"></i> Start New Conversation
                    </button>
                </div>
            </div>
        </div>
    `;
    
    console.log("Adding chat icon to DOM");
    // Add the chat icon to the DOM
    document.body.insertAdjacentHTML('beforeend', chatIconHtml);
    
    // Add event listeners
    document.getElementById('chat-notification-icon').addEventListener('click', () => {
        console.log("Chat icon clicked");
        const chatListPanel = document.getElementById('chat-list-panel');
        if (chatListPanel.style.display === 'none') {
            // Show the panel and load chat rooms
            chatListPanel.style.display = 'block';
            loadChatRooms(state);
            
            // Reset the unread count when opening the panel
            document.getElementById('unread-message-count').style.display = 'none';
            document.getElementById('unread-message-count').textContent = '0';
        } else {
            // Hide the panel
            chatListPanel.style.display = 'none';
        }
    });
    
    document.getElementById('refresh-chats-btn').addEventListener('click', () => {
        loadChatRooms(state);
    });
    
    document.getElementById('view-all-users-btn').addEventListener('click', () => {
        // Hide the chat list panel
        document.getElementById('chat-list-panel').style.display = 'none';
        
        // Show the users modal to start a new conversation
        viewUsers(state);
    });
    
    console.log("Setting up periodic message checking");
    // Set up periodic checking for new messages
    setInterval(() => {
        checkForNewMessages(state);
    }, 30000); // Check every 30 seconds
    
    // Initial check for new messages
    checkForNewMessages(state);
    
    console.log("Chat notification system initialization complete");
}

// Function to load chat rooms
async function loadChatRooms(state) {
    try {
        const chatRoomsList = document.getElementById('chat-rooms-list');
        
        // Show loading indicator
        chatRoomsList.innerHTML = `
            <div class="text-center p-3">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-muted mb-0">Loading your conversations...</p>
            </div>
        `;
        
        // Make sure we have a valid user ID
        if (!state.user && state.userId) {
            // Try to fetch the current user information
            try {
                const currentUser = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${state.userId}/`, {}, state.token);
                state.user = currentUser;
                console.log('Current user fetched for chat rooms:', currentUser);
            } catch (userError) {
                console.error('Error fetching user details:', userError);
                // Create a minimal user object from state
                state.user = {
                    id: state.userId,
                    username: state.username || 'user_' + state.userId,
                    first_name: state.firstName || '',
                    last_name: state.lastName || ''
                };
                console.log('Created minimal user object:', state.user);
            }
        }
        
        // If we still don't have a user object, show an error
        if (!state.user || !state.user.id) {
            chatRoomsList.innerHTML = `
                <div class="text-center p-3">
                    <p class="text-danger mb-0">User information not available.</p>
                    <button id="retry-load-chats" class="btn btn-sm btn-outline-primary mt-2">
                        <i class="bi bi-arrow-clockwise"></i> Retry
                    </button>
                </div>
            `;
            
            document.getElementById('retry-load-chats')?.addEventListener('click', () => {
                loadChatRooms(state);
            });
            return;
        }
        
        // Fetch chat rooms where the current user is a participant
        const chatRooms = await apiFetch('http://127.0.0.1:8000/api/addon/chat-rooms/', {}, state.token);
        
        // Filter to only include rooms where the user is a participant
        const userRooms = [];
        
        for (const room of chatRooms) {
            // Fetch participants for this room
            const participants = await apiFetch(`http://127.0.0.1:8000/api/addon/participants/?room=${room.id}`, {}, state.token);
            
            // Check if current user is a participant
            const isParticipant = participants.some(p => p.user && p.user.id === parseInt(state.user.id));
            
            if (isParticipant) {
                // Find the other participant (for private chats)
                let otherParticipant = null;
                if (room.is_private) {
                    otherParticipant = participants.find(p => p.user && p.user.id !== parseInt(state.user.id))?.user;
                }
                
                // Get the last message in this room
                const messages = await apiFetch(`http://127.0.0.1:8000/api/addon/messages/?room=${room.id}&limit=1`, {}, state.token);
                const lastMessage = messages.length > 0 ? messages[0] : null;
                
                // Add room with additional info
                userRooms.push({
                    ...room,
                    otherParticipant,
                    lastMessage
                });
            }
        }
        
        // Sort rooms by last message time (most recent first)
        userRooms.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.sent_at) - new Date(a.lastMessage.sent_at);
        });
        
        // Display the rooms
        if (userRooms.length === 0) {
            chatRoomsList.innerHTML = `
                <div class="text-center p-3">
                    <p class="text-muted mb-0">No conversations yet.</p>
                    <small class="text-muted">Click "Start New Conversation" to begin chatting.</small>
                </div>
            `;
        } else {
            chatRoomsList.innerHTML = userRooms.map(room => {
                // Determine the display name for the room
                let displayName = room.name;
                let avatarUrl = 'https://via.placeholder.com/40?text=?';
                
                if (room.is_private && room.otherParticipant) {
                    displayName = `${room.otherParticipant.first_name || ''} ${room.otherParticipant.last_name || ''}`.trim();
                    if (!displayName) displayName = room.otherParticipant.username || 'User';
                    
                    if (room.otherParticipant.profile_picture_path) {
                        avatarUrl = room.otherParticipant.profile_picture_path;
                    }
                }
                
                // Format the last message preview
                let lastMessagePreview = 'No messages yet';
                let lastMessageTime = '';
                
                if (room.lastMessage) {
                    lastMessagePreview = room.lastMessage.content.length > 30 
                        ? room.lastMessage.content.substring(0, 30) + '...' 
                        : room.lastMessage.content;
                    
                    const messageDate = new Date(room.lastMessage.sent_at);
                    const today = new Date();
                    
                    if (messageDate.toDateString() === today.toDateString()) {
                        // Today, show time
                        lastMessageTime = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    } else {
                        // Not today, show date
                        lastMessageTime = messageDate.toLocaleDateString();
                    }
                }
                
                return `
                    <a href="#" class="list-group-item list-group-item-action open-chat-room" data-room-id="${room.id}" data-room-name="${displayName}">
                        <div class="d-flex align-items-center">
                            <div class="flex-shrink-0">
                                <img src="${avatarUrl}" class="rounded-circle" width="40" height="40" style="object-fit: cover;">
                            </div>
                            <div class="flex-grow-1 ms-3">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0">${displayName}</h6>
                                    <small class="text-muted">${lastMessageTime}</small>
                                </div>
                                <p class="text-muted small mb-0">${lastMessagePreview}</p>
                            </div>
                        </div>
                    </a>
                `;
            }).join('');
            
            // Add event listeners to open chat rooms
            document.querySelectorAll('.open-chat-room').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const roomId = link.getAttribute('data-room-id');
                    const roomName = link.getAttribute('data-room-name');
                    
                    // Find the other participant
                    const room = userRooms.find(r => r.id === parseInt(roomId));
                    
                    if (room && room.otherParticipant) {
                        // Open chat with the other participant
                        openChatInterface(roomId, room.otherParticipant, state);
                    } else {
                        // Fallback if we can't find the other participant
                        const dummyUser = {
                            id: 0,
                            first_name: roomName.split(' ')[0] || 'User',
                            last_name: roomName.split(' ')[1] || '',
                            username: 'user'
                        };
                        openChatInterface(roomId, dummyUser, state);
                    }
                    
                    // Hide the chat list panel
                    document.getElementById('chat-list-panel').style.display = 'none';
                });
            });
        }
    } catch (error) {
        console.error('Error loading chat rooms:', error);
        
        document.getElementById('chat-rooms-list').innerHTML = `
            <div class="text-center p-3">
                <p class="text-danger mb-0">Failed to load conversations.</p>
                <button id="retry-load-chats" class="btn btn-sm btn-outline-primary mt-2">
                    <i class="bi bi-arrow-clockwise"></i> Retry
                </button>
            </div>
        `;
        
        document.getElementById('retry-load-chats')?.addEventListener('click', () => {
            loadChatRooms(state);
        });
    }
}

// Function to check for new messages
async function checkForNewMessages(state) {
    try {
        // Make sure we have a valid user ID
        if (!state.user && state.userId) {
            // Try to fetch the current user information
            try {
                const currentUser = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${state.userId}/`, {}, state.token);
                state.user = currentUser;
            } catch (userError) {
                console.error('Error fetching user details for message check:', userError);
                // Create a minimal user object from state
                state.user = {
                    id: state.userId,
                    username: state.username || 'user_' + state.userId,
                    first_name: state.firstName || '',
                    last_name: state.lastName || ''
                };
            }
        }
        
        // If we still don't have a user object, return
        if (!state.user || !state.user.id) {
            console.error('User information not available for message check');
            return;
        }
        
        // Get the last time we checked for messages
        const lastChecked = localStorage.getItem('lastMessageCheck') || '2000-01-01T00:00:00Z';
        
        // Update the last check time
        localStorage.setItem('lastMessageCheck', new Date().toISOString());
        
        // Fetch all chat rooms where the user is a participant
        const chatRooms = await apiFetch('http://127.0.0.1:8000/api/addon/chat-rooms/', {}, state.token);
        
        let totalNewMessages = 0;
        
        for (const room of chatRooms) {
            // Fetch participants for this room
            const participants = await apiFetch(`http://127.0.0.1:8000/api/addon/participants/?room=${room.id}`, {}, state.token);
            
            // Check if current user is a participant
            const isParticipant = participants.some(p => p.user && p.user.id === parseInt(state.user.id));
            
            if (isParticipant) {
                // Get messages newer than the last check time
                const messages = await apiFetch(
                    `http://127.0.0.1:8000/api/addon/messages/?room=${room.id}&after=${lastChecked}`, 
                    {}, 
                    state.token
                );
                
                // Count messages not from the current user
                const newMessages = messages.filter(msg => msg.user && msg.user.id !== parseInt(state.user.id));
                totalNewMessages += newMessages.length;
                
                // If there are new messages and a chat window is open for this room, update it
                if (newMessages.length > 0) {
                    const chatWindow = document.getElementById(`chat-window-${room.id}`);
                    if (chatWindow) {
                        // Load the new messages into the chat window
                        loadChatMessages(room.id, state, `chat-messages-${room.id}`, `chat-status-${room.id}`);
                    }
                }
            }
        }
        
        // Update the notification badge
        const unreadBadge = document.getElementById('unread-message-count');
        if (unreadBadge) {
            if (totalNewMessages > 0) {
                unreadBadge.textContent = totalNewMessages > 99 ? '99+' : totalNewMessages;
                unreadBadge.style.display = 'block';
                
                // Change the icon color to indicate new messages
                const chatIcon = document.getElementById('chat-notification-icon');
                if (chatIcon) {
                    chatIcon.classList.remove('bg-primary');
                    chatIcon.classList.add('bg-danger');
                }
                
                // Play a notification sound if enabled
                if (localStorage.getItem('chatSoundEnabled') !== 'false') {
                    playNotificationSound();
                }
            }
        }
    } catch (error) {
        console.error('Error checking for new messages:', error);
    }
}

// Function to play a notification sound
function playNotificationSound() {
    // Create an audio element
    const audio = new Audio('/static/sounds/notification.mp3');
    
    // Try to play the sound
    audio.play().catch(error => {
        console.log('Could not play notification sound:', error);
    });
}

// Function to update the unread message count
async function updateUnreadMessageCount(state) {
    try {
        // Get the last time we checked for messages
        const lastChecked = localStorage.getItem('lastMessageCheck') || '2000-01-01T00:00:00Z';
        
        // Fetch all chat rooms where the user is a participant
        const chatRooms = await apiFetch('http://127.0.0.1:8000/api/addon/chat-rooms/', {}, state.token);
        
        let totalNewMessages = 0;
        
        for (const room of chatRooms) {
            // Fetch participants for this room
            const participants = await apiFetch(`http://127.0.0.1:8000/api/addon/participants/?room=${room.id}`, {}, state.token);
            
            // Check if current user is a participant
            const isParticipant = participants.some(p => p.user.id === parseInt(state.user.id));
            
            if (isParticipant) {
                // Skip rooms that have an open chat window
                const chatWindow = document.getElementById(`chat-window-${room.id}`);
                if (chatWindow) {
                    continue;
                }
                
                // Get messages newer than the last check time
                const messages = await apiFetch(
                    `http://127.0.0.1:8000/api/addon/messages/?room=${room.id}&after=${lastChecked}`, 
                    {}, 
                    state.token
                );
                
                // Count messages not from the current user
                const newMessages = messages.filter(msg => msg.user.id !== parseInt(state.user.id));
                totalNewMessages += newMessages.length;
            }
        }
        
        // Update the notification badge
        const unreadBadge = document.getElementById('unread-message-count');
        if (totalNewMessages > 0) {
            unreadBadge.textContent = totalNewMessages > 99 ? '99+' : totalNewMessages;
            unreadBadge.style.display = 'block';
            
            // Change the icon color to indicate new messages
            document.getElementById('chat-notification-icon').classList.remove('bg-primary');
            document.getElementById('chat-notification-icon').classList.add('bg-danger');
        } else {
            unreadBadge.style.display = 'none';
            
            // Reset the icon color
            document.getElementById('chat-notification-icon').classList.remove('bg-danger');
            document.getElementById('chat-notification-icon').classList.add('bg-primary');
        }
    } catch (error) {
        console.error('Error updating unread message count:', error);
    }
}