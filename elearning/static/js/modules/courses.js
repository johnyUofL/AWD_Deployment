// modules/courses.js
import { apiFetch } from './api.js';
import { renderStudentProfile } from './ui.js';
import { showToast } from '../components/toast.js';

export async function fetchCourses(state) {
    try {
        const courses = await apiFetch('http://127.0.0.1:8000/api/core/courses/', {}, state.token);
        const enrollments = await apiFetch('http://127.0.0.1:8000/api/core/enrollments/', {}, state.token);
        console.log('All enrollments:', enrollments);

        const userEnrollments = enrollments.filter(e => 
            e.student_detail.id === parseInt(state.userId) && 
            e.is_active === true
        );
        console.log('User active enrollments:', userEnrollments);

        const enrollmentMap = {};
        userEnrollments.forEach(enrollment => {
            enrollmentMap[enrollment.course_detail.id] = enrollment.id;
        });
        const enrolledCourseIds = userEnrollments.map(e => e.course_detail.id);

        // Store courses in state for filtering
        state.allCourses = courses;
        state.enrolledCourseIds = enrolledCourseIds;
        state.enrollmentMap = enrollmentMap;
        
        // Default view is all courses list
        renderCourseList(courses, enrolledCourseIds, enrollmentMap, false, state);
    } catch (error) {
        console.error('Error fetching courses:', error);
        document.getElementById('content').innerHTML = `<div class="alert alert-danger">Error loading courses: ${error.message}</div>`;
    }
}

export function renderCourseList(courses, enrolledCourseIds, enrollmentMap, enrolledOnly = false, state, searchTerm = '') {
    const content = document.getElementById('content');
    
    // Filter courses based on seach content
    let filteredCourses = courses;
    
    // Filter by enrollment when enrolled only is selected
    if (enrolledOnly) {
        filteredCourses = courses.filter(course => enrolledCourseIds.includes(course.id));
    }
    
    // Create the results counter HTML
    const resultsCounterHtml = `<div id="results-counter" class="filtered-results mb-3" style="display: none;"></div>`;

    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Courses</h1>
            <div class="d-flex">
                <div class="input-group me-2" style="width: 300px;">
                    <input type="text" id="course-search" class="form-control" placeholder="Search courses..." value="${searchTerm}">
                    <button class="btn btn-outline-secondary" type="button" id="search-button">
                        <i class="bi bi-search"></i>
                    </button>
                </div>
                <div class="btn-group" role="group">
                    <button type="button" class="btn ${!enrolledOnly ? 'btn-primary' : 'btn-outline-primary'}" id="all-courses-btn">All Courses</button>
                    <button type="button" class="btn ${enrolledOnly ? 'btn-primary' : 'btn-outline-primary'}" id="enrolled-courses-btn">Enrolled</button>
                </div>
            </div>
        </div>
        
        ${resultsCounterHtml}
        
        ${filteredCourses.length === 0 ? 
            `<div class="alert alert-info">No courses match your search criteria.</div>` : 
            `<div class="row">
                ${filteredCourses.map(course => `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 course-card">
                            ${course.cover_image_path ? `<img src="${course.cover_image_path}" class="card-img-top" alt="${course.title}" style="max-height: 200px; object-fit: cover;">` : `<img src="https://via.placeholder.com/200x200?text=No+Image" class="card-img-top" alt="No Image" style="max-height: 200px; object-fit: cover;">`}
                            <div class="card-body">
                                <h5 class="card-title">${course.title}</h5>
                                <p class="card-text">Taught by ${course.teacher.username}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    ${enrolledCourseIds.includes(course.id) ? 
                                        `<span class="badge bg-success">Enrolled</span>
                                         <div>
                                            <button class="btn btn-primary btn-sm me-1 profile-btn" data-user-id="${course.teacher.id}">View Teacher</button>
                                            <button class="btn btn-primary btn-sm me-1" data-course-id="${course.id}">Open</button>
                                            <button class="btn btn-danger btn-sm unenroll-btn" data-enrollment-id="${enrollmentMap[course.id]}">Unenroll</button>
                                         </div>` : 
                                        `<button class="btn btn-primary btn-sm me-1 profile-btn" data-user-id="${course.teacher.id}">View Teacher</button>
                                        <button class="btn btn-primary btn-sm enroll-btn" data-course-id="${course.id}">Enroll</button>`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`
        }
    `;

    // Add event listeners
    document.getElementById('all-courses-btn').addEventListener('click', () => {
        renderCourseList(state.allCourses, state.enrolledCourseIds, state.enrollmentMap, false, state, document.getElementById('course-search').value);
    });
    
    document.getElementById('enrolled-courses-btn').addEventListener('click', () => {
        renderCourseList(state.allCourses, state.enrolledCourseIds, state.enrollmentMap, true, state, document.getElementById('course-search').value);
    });
    
    document.getElementById('search-button').addEventListener('click', () => {
        const searchTerm = document.getElementById('course-search').value;
        filterCourseCards(searchTerm);
    });
    
    // DOM-based filtering approach for real-time search
    document.getElementById('course-search').addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        filterCourseCards(searchTerm);
    });

    document.querySelectorAll('.enroll-btn').forEach(button => {
        button.addEventListener('click', () => enroll(button.getAttribute('data-course-id'), state));
    });
    
    document.querySelectorAll('.unenroll-btn').forEach(button => {
        button.addEventListener('click', () => unenroll(button.getAttribute('data-enrollment-id'), state));
    });
    
    document.querySelectorAll('.btn-primary:not(.enroll-btn):not(.profile-btn):not(#all-courses-btn):not(#enrolled-courses-btn):not(#search-button)').forEach(button => {
        button.addEventListener('click', () => openCourse(button.getAttribute('data-course-id')));
    });
    
    document.querySelectorAll('.profile-btn').forEach(button => {
        button.addEventListener('click', () => viewProfile(button.getAttribute('data-user-id'), state));
    });

    // filtering if search term is provided
    if (searchTerm) {
        filterCourseCards(searchTerm);
    }
}

// function for DOM-based filtering
export function filterCourseCards(searchTerm) {
    const term = searchTerm.toLowerCase();
    const courseCards = document.querySelectorAll('.course-card');
    let visibleCount = 0;
    
    courseCards.forEach(card => {
        const cardContainer = card.closest('.col-md-4');
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const teacher = card.querySelector('.card-text').textContent.toLowerCase();
        
        if (title.includes(term) || teacher.includes(term)) {
            cardContainer.style.display = '';
            visibleCount++;
        } else {
            cardContainer.style.display = 'none';
        }
    });
    
    // Update the counter
    const resultsCounter = document.getElementById('results-counter');
    if (resultsCounter) {
        if (term) {
            resultsCounter.textContent = `Showing ${visibleCount} of ${courseCards.length} courses`;
            resultsCounter.style.display = 'block';
        } else {
            resultsCounter.style.display = 'none';
        }
    }
}

export async function enroll(courseId, state) {
    const studentId = parseInt(state.userId);
    console.log('Attempting to enroll:', { courseId, studentId });

    try {
        const enrollments = await apiFetch('http://127.0.0.1:8000/api/core/enrollments/', {}, state.token);
        console.log('Existing enrollments:', JSON.stringify(enrollments));
        const existingEnrollment = enrollments.find(e => 
            e.student_detail.id === studentId && 
            e.course_detail.id === parseInt(courseId) &&
            e.is_active === true
        );
        console.log('Already actively enrolled in this course:', existingEnrollment);

        if (existingEnrollment) {
            console.log('Already enrolled in this course');
            fetchCourses(state);
            return;
        }

        const data = await apiFetch('http://127.0.0.1:8000/api/core/enrollments/', {
            method: 'POST',
            body: JSON.stringify({ course: parseInt(courseId), student: studentId })
        }, state.token);
        console.log('Enrollment successful:', data);
        
        // Show success toast
        showToast('Thank you for enrolling in this course!', 'success');
        
        fetchCourses(state);
    } catch (error) {
        console.error('Enroll error:', error);
        showToast('Failed to enroll: ' + error.message, 'danger');
    }
}

export async function unenroll(enrollmentId, state) {
    if (!confirm('Are you sure you want to unenroll from this course?')) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/core/enrollments/${enrollmentId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'X-CSRFToken': getCsrfToken()
            }
        });
        console.log('Unenroll response status:', response.status);
        if (!response.ok && response.status !== 404) {
            throw new Error('Unenrollment failed: ' + response.status);
        }
        console.log(response.status === 404 ? 'Enrollment already deleted' : 'Successfully unenrolled');
        
        // Show danger toast
        showToast('Sorry to see you leave this course.', 'danger');
        
        fetchCourses(state);
    } catch (error) {
        console.error('Unenroll error:', error);
        showToast('Failed to unenroll: ' + error.message, 'danger');
        fetchCourses(state);
    }
}

export function openCourse(courseId) {
    console.log('Opening course:', courseId);
    alert('Course page would open here. Implementation pending.');
}

export async function viewProfile(userId, state) {
    try {
        const user = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${userId}/`, {}, state.token);
        const statusUpdates = await apiFetch(`http://127.0.0.1:8000/userauths/api/status-updates/?user=${userId}`, {}, state.token);
        renderStudentProfile(user, statusUpdates);
    } catch (error) {
        console.error('Error fetching profile or status updates:', error);
        document.getElementById('content').innerHTML = `<div class="alert alert-danger">Error loading profile: ${error.message}</div>`;
    }
}

// Import getCsrfToken for unenroll
import { getCsrfToken } from './api.js';