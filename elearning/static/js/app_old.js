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
            checkUserRole();
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

    async function checkUserRole() {
        if (state.token) {
            try {
                const user = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${state.userId}/`);
                if (user.user_type === 'teacher') {
                    renderTeacherDashboard();
                } else {
                    fetchCourses(); // Default student view
                }
            } catch (error) {
                console.error('Error checking user role:', error);
                logout();
            }
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
            
            // Default view is all courses list
            renderCourseList(courses, enrolledCourseIds, enrollmentMap, false);
        } catch (error) {
            console.error('Error fetching courses:', error);
            content.innerHTML = `<div class="alert alert-danger">Error loading courses: ${error.message}</div>`;
        }
    }

    function renderCourseList(courses, enrolledCourseIds, enrollmentMap, enrolledOnly = false, searchTerm = '') {
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
            renderCourseList(state.allCourses, state.enrolledCourseIds, state.enrollmentMap, false, document.getElementById('course-search').value);
        });
        
        document.getElementById('enrolled-courses-btn').addEventListener('click', () => {
            renderCourseList(state.allCourses, state.enrolledCourseIds, state.enrollmentMap, true, document.getElementById('course-search').value);
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

        // filtering if search term is provided
        if (searchTerm) {
            filterCourseCards(searchTerm);
        }
    }

    // function for DOM-based filtering
    function filterCourseCards(searchTerm) {
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
        
        // fields with default values
        formData.append('first_name', username); // Default first name to username since a value is expected
        formData.append('last_name', username); // Default last name to username since a value is expected 
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

    // function to show toasts
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        const toastId = `toast-${Date.now()}`;
        const bgClass = type === 'success' ? 'bg-success' : 'bg-danger';
        const iconClass = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill';
        
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi ${iconClass} me-2"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
        toast.show();
        
        // Remove toast from DOM after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    // function to show a success toast
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
            
            // Show success toast
            showToast('Thank you for enrolling in this course!', 'success');
            
            fetchCourses();
        } catch (error) {
            console.error('Enroll error:', error);
            showToast('Failed to enroll: ' + error.message, 'danger');
        }
    }

    // function to show a danger toast
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
            
            // Show danger toast
            showToast('Sorry to see you leave this course.', 'danger');
            
            fetchCourses();
        } catch (error) {
            console.error('Unenroll error:', error);
            showToast('Failed to unenroll: ' + error.message, 'danger');
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

    function renderTeacherDashboard() {
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
        document.getElementById('create-course-btn').addEventListener('click', showCreateCourseModal);
        
        // Load teacher's courses
        fetchTeacherCourses();
    }

    async function fetchTeacherCourses() {
        try {
            const courses = await apiFetch('http://127.0.0.1:8000/api/core/courses/');
            const teacherCourses = courses.filter(course => course.teacher.id === parseInt(state.userId));
            
            renderTeacherCourses(teacherCourses);
        } catch (error) {
            console.error('Error fetching teacher courses:', error);
            document.getElementById('teacher-courses-container').innerHTML = 
                `<div class="alert alert-danger">Error loading courses: ${error.message}</div>`;
        }
    }

    function renderTeacherCourses(courses) {
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
                viewCourseDetails(btn.getAttribute('data-course-id'));
            });
        });
        
        document.querySelectorAll('.edit-course').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                editCourse(btn.getAttribute('data-course-id'));
            });
        });
        
        document.querySelectorAll('.view-students').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                viewCourseStudents(btn.getAttribute('data-course-id'));
            });
        });
        
        document.querySelectorAll('.manage-assignments').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                manageCourseAssignments(btn.getAttribute('data-course-id'));
            });
        });
        
        document.querySelectorAll('.toggle-status').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleCourseStatus(
                    btn.getAttribute('data-course-id'),
                    btn.getAttribute('data-status') === 'true'
                );
            });
        });
    }

    function showCreateCourseModal() {
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
        document.getElementById('save-course-btn').addEventListener('click', () => createCourse(modal));
        
        // Add validation for end date to be after start date
        document.getElementById('course-start-date').addEventListener('change', function() {
            document.getElementById('course-end-date').min = this.value;
        });
    }

    async function createCourse(modal) {
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
            });
            
            console.log('Course created:', response);
            modal.hide();
            
            // Remove modal from DOM after hiding
            document.getElementById('createCourseModal').addEventListener('hidden.bs.modal', function() {
                this.remove();
            });
            
            // Show success message
            showToast('Course created successfully!', 'success');
            
            // Refresh courses list
            fetchTeacherCourses();
        } catch (error) {
            console.error('Error creating course:', error);
            showToast('Failed to create course: ' + error.message, 'danger');
        }
    }

    async function viewCourseDetails(courseId) {
        try {
            const course = await apiFetch(`http://127.0.0.1:8000/api/core/courses/${courseId}/`);
            const materials = await apiFetch(`http://127.0.0.1:8000/api/core/materials/?course=${courseId}`);
            const assignments = await apiFetch(`http://127.0.0.1:8000/api/core/assignments/?course=${courseId}`);
            
            // Group materials by type
            const videoMaterials = materials.filter(m => m.file_type === 'video');
            const documentMaterials = materials.filter(m => m.file_type !== 'video');
            
            renderCourseDetailView(course, videoMaterials, documentMaterials, assignments);
        } catch (error) {
            console.error('Error fetching course details:', error);
            showToast('Failed to load course details: ' + error.message, 'danger');
        }
    }

    function renderCourseDetailView(course, videoMaterials, documentMaterials, assignments) {
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
            renderTeacherDashboard();
        });
        
        // Video tab event listeners
        document.getElementById('add-video-btn').addEventListener('click', () => {
            showAddVideoModal(course.id);
        });
        
        document.querySelectorAll('.preview-video-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                previewVideo(btn.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.edit-video-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                editVideo(btn.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.delete-video-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteVideo(btn.getAttribute('data-id'), course.id);
            });
        });
        
        // Materials tab event listeners
        document.getElementById('add-material-btn').addEventListener('click', () => {
            showAddMaterialModal(course.id);
        });
        
        document.querySelectorAll('.download-material-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                downloadMaterial(btn.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.edit-material-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                editMaterial(btn.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.delete-material-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteMaterial(btn.getAttribute('data-id'), course.id);
            });
        });
        
        // Assignments tab event listeners
        document.getElementById('add-assignment-btn').addEventListener('click', () => {
            showAddAssignmentModal(course.id);
        });
        
        document.querySelectorAll('.view-submissions-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                viewAssignmentSubmissions(btn.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.edit-assignment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                editAssignment(btn.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.delete-assignment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteAssignment(btn.getAttribute('data-id'), course.id);
            });
        });
    }

    function showAddVideoModal(courseId) {
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
            uploadVideo(courseId, modal);
        });
        
        document.getElementById('addVideoModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    async function uploadVideo(courseId, modal) {
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
            });
            
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
            });
            
            modal.hide();
            showToast('Video uploaded successfully!', 'success');
            viewCourseDetails(courseId);
        } catch (error) {
            console.error('Error uploading video:', error);
            showToast('Failed to upload video: ' + error.message, 'danger');
        }
    }

    async function previewVideo(materialId) {
        try {
            const material = await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`);
            const videoResource = await apiFetch(`http://127.0.0.1:8000/api/core/video-resources/?material=${materialId}`);
            
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

    function formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function init() {
        fetchUserData();
    }

    return { init };
})();

App.init();