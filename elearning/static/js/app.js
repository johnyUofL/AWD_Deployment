const App = (function() {
    const navLinks = document.getElementById('nav-links');
    const content = document.getElementById('content');
    let state = {
        token: localStorage.getItem('token'),
        userId: localStorage.getItem('userId'),
        firstName: localStorage.getItem('firstName'),
        profilePic: localStorage.getItem('profilePic'),
        allCourses: [],
        enrolledCourseIds: [],
        enrollmentMap: {}
    };

    function getCsrfToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
    }

    async function apiFetch(url, options = {}) {
        const defaultHeaders = {
            'Authorization': `Bearer ${state.token}`
        };
        if (options.method && options.method !== 'GET') {
            defaultHeaders['X-CSRFToken'] = getCsrfToken();
        }
        if (!(options.body instanceof FormData)) {
            defaultHeaders['Content-Type'] = 'application/json';
        }
        const response = await fetch(url, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers }
        });
        if (!response.ok) throw new Error(`${options.method || 'GET'} ${url} failed: ${response.status}`);
        return response.json();
    }

    function renderLogin() {
        content.innerHTML = `
            <h1 class="mb-4">Login</h1>
            <form id="login-form" class="needs-validation" novalidate>
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" id="username" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary">Login</button>
            </form>
        `;
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            login();
        });
    }

    function renderSignup() {
        content.innerHTML = `
            <h1 class="mb-4">Signup</h1>
            <form id="signup-form" class="needs-validation" novalidate>
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" id="username" class="form-control" required>
                    <div class="invalid-feedback">Please choose a username.</div>
                </div>
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" id="email" class="form-control" required>
                    <div class="invalid-feedback">Please provide a valid email.</div>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" class="form-control" required>
                    <div class="invalid-feedback">Password must be at least 8 characters.</div>
                </div>
                <div class="mb-3">
                    <label for="confirm_password" class="form-label">Confirm Password</label>
                    <input type="password" id="confirm_password" class="form-control" required>
                    <div class="invalid-feedback">Passwords do not match.</div>
                </div>
                <div id="signup-error" class="alert alert-danger d-none"></div>
                <button type="submit" class="btn btn-primary">Sign Up</button>
            </form>
        `;
        
        document.getElementById('signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            signup();
        });
    }

    function renderUserInfoModal(user) {
        const modalHtml = `
            <div class="modal fade" id="userInfoModal" tabindex="-1" aria-labelledby="userInfoModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="userInfoModalLabel">User Information</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="userInfoForm" enctype="multipart/form-data">
                                <div class="mb-3">
                                    <label for="email" class="form-label">Email (Read-Only)</label>
                                    <input type="email" class="form-control" id="email" value="${user.email || ''}" readonly>
                                </div>
                                <div class="mb-3">
                                    <label for="firstName" class="form-label">First Name</label>
                                    <input type="text" class="form-control" id="firstName" value="${user.first_name || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="lastName" class="form-label">Last Name</label>
                                    <input type="text" class="form-control" id="lastName" value="${user.last_name || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="bio" class="form-label">Bio</label>
                                    <textarea class="form-control" id="bio">${user.bio || ''}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="profilePicture" class="form-label">Profile Picture</label>
                                    <input type="file" class="form-control" id="profilePicture" name="profile_picture_path" accept="image/*">
                                    <img src="${user.profile_picture_path || 'https://via.placeholder.com/100?text=No+Image'}" alt="Current Profile" class="mt-2 rounded-circle" style="max-width: 100px; height: auto;">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="saveUserInfo">Save changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('userInfoModal'));
        modal.show();
        document.getElementById('saveUserInfo').addEventListener('click', () => saveUserInfo(modal));
        document.getElementById('userInfoModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('userInfoModal').remove();
        });
    }

    function renderStudentProfile(user, statusUpdates) {
        content.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <img src="${user.profile_picture_path || 'https://via.placeholder.com/150?text=No+Image'}" class="card-img-top" alt="${user.username}" style="max-height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${user.first_name} ${user.last_name}</h5>
                            <p class="card-text"><strong>Username:</strong> ${user.username}</p>
                            <p class="card-text"><strong>Email:</strong> ${user.email || 'N/A'}</p>
                            <p class="card-text"><strong>Bio:</strong> ${user.bio || 'No bio available'}</p>
                            <p class="card-text"><strong>Type:</strong> ${user.user_type}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">Status Updates</div>
                        <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                            ${statusUpdates.length > 0 ? statusUpdates.map(update => `
                                <div class="border-bottom pb-2 mb-2">
                                    <p>${update.content}</p>
                                    <small class="text-muted">${new Date(update.posted_at).toLocaleString()}</small>
                                </div>
                            `).join('') : '<p>No status updates yet.</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
        content.insertAdjacentHTML('beforeend', '<button class="btn btn-secondary mt-3" id="backToCourses">Back to Courses</button>');
        document.getElementById('backToCourses').addEventListener('click', () => fetchCourses());
    }

    function updateState(key, value) {
        state[key] = value;
        localStorage.setItem(key, value);
    }

    function clearState() {
        state.token = null;
        state.userId = null;
        state.firstName = null;
        state.profilePic = null;
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('firstName');
        localStorage.removeItem('profilePic');
    }

    function updateNav() {
        navLinks.innerHTML = '';
        if (state.token) {
            console.log('Token:', state.token);
            console.log('First name in updateNav:', state.firstName);
            console.log('Profile pic in updateNav:', state.profilePic);
            navLinks.innerHTML = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle text-light d-flex align-items-center" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <img src="${state.profilePic || 'https://via.placeholder.com/30?text=User'}" alt="Profile" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                        Welcome! ${state.firstName || 'User'}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                        <li><a class="dropdown-item" href="#" id="userInfoLink">User Info</a></li>
                        <li><a class="dropdown-item" href="#" id="logoutLink">Logout</a></li>
                    </ul>
                </li>
            `;
            document.getElementById('userInfoLink').addEventListener('click', (e) => {
                e.preventDefault();
                showUserInfoModal();
            });
            document.getElementById('logoutLink').addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
            fetchCourses();
        } else {
            navLinks.innerHTML = `
                <li class="nav-item"><a class="nav-link" href="#" id="login-link">Login</a></li>
                <li class="nav-item"><a class="nav-link" href="#" id="signup-link">Signup</a></li>
            `;
            document.getElementById('login-link').addEventListener('click', (e) => {
                e.preventDefault();
                renderLogin();
            });
            document.getElementById('signup-link').addEventListener('click', (e) => {
                e.preventDefault();
                renderSignup();
            });
            renderLogin();
        }
    }

    async function fetchUserData() {
        if (state.token) {
            try {
                const users = await apiFetch('http://127.0.0.1:8000/userauths/api/users/');
                console.log('Users response data:', JSON.stringify(users, null, 2));
                const user = users.find(u => u.id === parseInt(state.userId));
                console.log('Found user by ID:', user);
                if (user) {
                    updateState('firstName', user.first_name || user.username);
                    updateState('profilePic', user.profile_picture_path || '');
                    updateNav();
                } else {
                    console.error('User not found for ID:', state.userId);
                    logout();
                }
            } catch (error) {
                console.error('Fetch user data error:', error);
                logout();
            }
        } else {
            updateNav();
        }
    }

    async function showUserInfoModal() {
        try {
            const user = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${state.userId}/`);
            renderUserInfoModal(user);
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    }

    async function saveUserInfo(modal) {
        const formData = new FormData();
        formData.append('first_name', document.getElementById('firstName').value);
        formData.append('last_name', document.getElementById('lastName').value);
        formData.append('bio', document.getElementById('bio').value);
        const profilePictureFile = document.getElementById('profilePicture').files[0];
        if (profilePictureFile) {
            formData.append('profile_picture_path', profilePictureFile);
            console.log('Uploading file:', profilePictureFile.name);
        } else {
            console.log('No new profile picture selected');
        }

        try {
            const user = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${state.userId}/`, {
                method: 'PATCH',
                body: formData,
                headers: {}
            });
            updateState('firstName', user.first_name || user.username);
            updateState('profilePic', user.profile_picture_path ? `${user.profile_picture_path}?${new Date().getTime()}` : state.profilePic);
            console.log('User updated:', { firstName: state.firstName, profilePic: state.profilePic });
            modal.hide();
            updateNav();
            fetchCourses();
        } catch (error) {
            console.error('Error updating user info:', error);
        }
    }

    async function fetchCourses() {
        try {
            const courses = await apiFetch('http://127.0.0.1:8000/api/core/courses/');
            const enrollments = await apiFetch('http://127.0.0.1:8000/api/core/enrollments/');
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
            
            // Default view is all courses
            renderCourseList(courses, enrolledCourseIds, enrollmentMap, false);
        } catch (error) {
            console.error('Error fetching courses:', error);
            content.innerHTML = `<div class="alert alert-danger">Error loading courses: ${error.message}</div>`;
        }
    }

    function renderCourseList(courses, enrolledCourseIds, enrollmentMap, enrolledOnly = false, searchTerm = '') {
        // Filter courses based on parameters
        let filteredCourses = courses;
        
        // Filter by enrollment if needed
        if (enrolledOnly) {
            filteredCourses = courses.filter(course => enrolledCourseIds.includes(course.id));
        }
        
        // Filter by search term if provided
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredCourses = filteredCourses.filter(course => 
                course.title.toLowerCase().includes(term) || 
                course.teacher.username.toLowerCase().includes(term) ||
                (course.description && course.description.toLowerCase().includes(term))
            );
        }

        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>Available Courses</h1>
                <div class="d-flex">
                    <div class="input-group me-2" style="width: 300px;">
                        <input type="text" id="course-search" class="form-control" placeholder="Search courses..." value="${searchTerm}">
                        <button class="btn btn-outline-secondary" type="button" id="search-button">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                    <div class="btn-group" role="group">
                        <button type="button" class="btn ${!enrolledOnly ? 'btn-primary' : 'btn-outline-primary'}" id="all-courses-btn">All Courses</button>
                        <button type="button" class="btn ${enrolledOnly ? 'btn-primary' : 'btn-outline-primary'}" id="enrolled-courses-btn">My Enrolled</button>
                    </div>
                </div>
            </div>
            
            ${filteredCourses.length === 0 ? 
                `<div class="alert alert-info">No courses found matching your criteria.</div>` : 
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
                                             </div>` 
                                            : 
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
            renderCourseList(state.allCourses, state.enrolledCourseIds, state.enrollmentMap, false, document.getElementById('course-search').value);
        });
        
        document.getElementById('enrolled-courses-btn').addEventListener('click', () => {
            renderCourseList(state.allCourses, state.enrolledCourseIds, state.enrollmentMap, true, document.getElementById('course-search').value);
        });
        
        document.getElementById('search-button').addEventListener('click', () => {
            const searchTerm = document.getElementById('course-search').value;
            renderCourseList(state.allCourses, state.enrolledCourseIds, state.enrollmentMap, enrolledOnly, searchTerm);
        });
        
        document.getElementById('course-search').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = e.target.value;
                renderCourseList(state.allCourses, state.enrolledCourseIds, state.enrollmentMap, enrolledOnly, searchTerm);
            }
        });

        document.querySelectorAll('.enroll-btn').forEach(button => {
            button.addEventListener('click', () => enroll(button.getAttribute('data-course-id')));
        });
        
        document.querySelectorAll('.unenroll-btn').forEach(button => {
            button.addEventListener('click', () => unenroll(button.getAttribute('data-enrollment-id')));
        });
        
        document.querySelectorAll('.btn-primary:not(.enroll-btn):not(.profile-btn):not(#all-courses-btn):not(#enrolled-courses-btn):not(#search-button)').forEach(button => {
            button.addEventListener('click', () => openCourse(button.getAttribute('data-course-id')));
        });
        
        document.querySelectorAll('.profile-btn').forEach(button => {
            button.addEventListener('click', () => viewProfile(button.getAttribute('data-user-id')));
        });
    }

    async function login() {
        const usernameInput = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        console.log('Login attempt with username:', usernameInput);
        try {
            const data = await apiFetch('http://127.0.0.1:8000/api/token/', {
                method: 'POST',
                body: JSON.stringify({ username: usernameInput, password })
            });
            console.log('Token response status: 200');
            updateState('token', data.access);
            const users = await apiFetch('http://127.0.0.1:8000/userauths/api/users/');
            console.log('Users response data:', JSON.stringify(users, null, 2));
            const user = users.find(u => u.username.toLowerCase() === usernameInput.toLowerCase());
            console.log('Searching for username:', usernameInput.toLowerCase());
            console.log('Found user:', user);
            if (user) {
                updateState('userId', user.id);
                updateState('firstName', user.first_name || user.username);
                updateState('profilePic', user.profile_picture_path || '');
                console.log('Logged in user:', { id: state.userId, firstName: state.firstName, profilePic: state.profilePic });
                updateNav();
            } else {
                throw new Error('User not found in API response');
            }
        } catch (error) {
            content.innerHTML += '<div class="alert alert-danger">Login failed</div>';
            console.error('Login error:', error);
        }
    }

    async function signup() {
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        const errorDiv = document.getElementById('signup-error');
        
        // Reset error message
        errorDiv.classList.add('d-none');
        
        // Basic validation
        if (password.length < 8) {
            errorDiv.textContent = 'Password must be at least 8 characters long.';
            errorDiv.classList.remove('d-none');
            return;
        }
        
        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match.';
            errorDiv.classList.remove('d-none');
            return;
        }
        
        // Create FormData for submission
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        
        // Add required fields with default values
        formData.append('first_name', username); // Default first name to username
        formData.append('last_name', username); // Default last name to username too
        formData.append('user_type', 'student'); // Default to student
        formData.append('bio', ''); // Empty bio
        
        try {
            const response = await fetch('/userauths/api/users/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = 'Signup failed. ';
                
                // Format error messages from the API - handle different response formats
                if (errorData) {
                    for (const field in errorData) {
                        if (Array.isArray(errorData[field])) {
                            errorMessage += `${field}: ${errorData[field].join(' ')} `;
                        } else if (typeof errorData[field] === 'string') {
                            errorMessage += `${field}: ${errorData[field]} `;
                        } else {
                            errorMessage += `${field}: Invalid input `;
                        }
                    }
                }
                
                throw new Error(errorMessage);
            }
            
            // Show success message
            content.innerHTML = `
                <div class="alert alert-success">
                    Your account has been created successfully! You can now log in.
                </div>
            `;
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                renderLogin();
            }, 2000);
            
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');
            console.error('Signup error:', error);
        }
    }

    async function logout() {
        try {
            await apiFetch('http://127.0.0.1:8000/accounts/logout/', { method: 'POST' });
            console.log('Logout successful');
            clearState();
            updateNav();
        } catch (error) {
            console.error('Logout error:', error);
            clearState();
            updateNav();
        }
    }

    async function enroll(courseId) {
        const studentId = parseInt(state.userId);
        console.log('Attempting to enroll:', { courseId, studentId });

        try {
            const enrollments = await apiFetch('http://127.0.0.1:8000/api/core/enrollments/');
            console.log('Existing enrollments:', JSON.stringify(enrollments));
            const existingEnrollment = enrollments.find(e => 
                e.student_detail.id === studentId && 
                e.course_detail.id === parseInt(courseId) &&
                e.is_active === true
            );
            console.log('Already actively enrolled in this course:', existingEnrollment);

            if (existingEnrollment) {
                console.log('Already enrolled in this course');
                fetchCourses();
                return;
            }

            const data = await apiFetch('http://127.0.0.1:8000/api/core/enrollments/', {
                method: 'POST',
                body: JSON.stringify({ course: parseInt(courseId), student: studentId })
            });
            console.log('Enrollment successful:', data);
            fetchCourses();
        } catch (error) {
            console.error('Enroll error:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.textContent = 'Failed to enroll: ' + error.message;
            content.prepend(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        }
    }

    async function unenroll(enrollmentId) {
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
            fetchCourses();
        } catch (error) {
            console.error('Unenroll error:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.textContent = 'Failed to unenroll: ' + error.message;
            content.prepend(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
            fetchCourses();
        }
    }

    function openCourse(courseId) {
        console.log('Opening course:', courseId);
        alert('Course page would open here. Implementation pending.');
    }

    async function viewProfile(userId) {
        try {
            const user = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${userId}/`);
            const statusUpdates = await apiFetch(`http://127.0.0.1:8000/userauths/api/status-updates/?user=${userId}`);
            renderStudentProfile(user, statusUpdates);
        } catch (error) {
            console.error('Error fetching profile or status updates:', error);
            content.innerHTML = `<div class="alert alert-danger">Error loading profile: ${error.message}</div>`;
        }
    }

    function init() {
        fetchUserData();
    }

    return { init };
})();

App.init();