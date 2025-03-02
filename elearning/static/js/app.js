document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.getElementById('nav-links');
    const content = document.getElementById('content');
    let token = localStorage.getItem('token');
    let userId = localStorage.getItem('userId');
    let firstName = localStorage.getItem('firstName');
    let profilePic = localStorage.getItem('profilePic');

    // Update navigation
    function updateNav() {
        navLinks.innerHTML = '';
        if (token) {
            console.log('Token:', token);
            console.log('First name in updateNav:', firstName);
            console.log('Profile pic in updateNav:', profilePic);
            navLinks.innerHTML = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle text-light d-flex align-items-center" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <img src="${profilePic || 'https://via.placeholder.com/30?text=User'}" alt="Profile" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                        Welcome! ${firstName || 'User'}
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
                showLogin();
            });
            document.getElementById('signup-link').addEventListener('click', (e) => {
                e.preventDefault();
                showSignup();
            });
            showLogin();
        }
    }

    // Fetch user data if token exists
    function fetchUserData() {
        if (token) {
            fetch('http://127.0.0.1:8000/userauths/api/users/', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => {
                console.log('Users response status:', response.status);
                if (!response.ok) {
                    throw new Error('Users fetch failed: ' + response.status);
                }
                return response.json();
            })
            .then(users => {
                console.log('Users response data:', JSON.stringify(users, null, 2));
                const user = users.find(u => u.id === parseInt(userId));
                console.log('Found user by ID:', user);
                if (user) {
                    firstName = user.first_name || user.username;
                    profilePic = user.profile_picture_path;
                    localStorage.setItem('firstName', firstName);
                    localStorage.setItem('profilePic', profilePic || '');
                    console.log('Updated user data:', { firstName: firstName, profilePic: profilePic });
                    updateNav();
                } else {
                    console.error('User not found for ID:', userId);
                    logout();
                }
            })
            .catch(error => {
                console.error('Fetch user data error:', error);
                logout();
            });
        } else {
            updateNav();
        }
    }

    // Show user info modal
    function showUserInfoModal() {
        fetch(`http://127.0.0.1:8000/userauths/api/users/${userId}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(user => {
            // Append modal to body instead of overwriting content
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
            document.body.insertAdjacentHTML('beforeend', modalHtml); // Append to body
            const modal = new bootstrap.Modal(document.getElementById('userInfoModal'));
            modal.show();
            document.getElementById('saveUserInfo').addEventListener('click', () => saveUserInfo(modal));
            // Clean up modal on close to avoid duplicates
            document.getElementById('userInfoModal').addEventListener('hidden.bs.modal', () => {
                document.getElementById('userInfoModal').remove();
            });
        })
        .catch(error => console.error('Error fetching user info:', error));
    }

    // Save user info to database
    function saveUserInfo(modal) {
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

        fetch(`http://127.0.0.1:8000/userauths/api/users/${userId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })
        .then(response => {
            console.log('PATCH response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => { throw new Error(`Update failed: ${response.status} - ${text}`); });
            }
            return response.json();
        })
        .then(user => {
            firstName = user.first_name || user.username;
            profilePic = user.profile_picture_path ? `${user.profile_picture_path}?${new Date().getTime()}` : profilePic;
            localStorage.setItem('firstName', firstName);
            localStorage.setItem('profilePic', profilePic || '');
            console.log('User updated:', { firstName: firstName, profilePic: profilePic });
            modal.hide();
            updateNav();
            fetchCourses(); // Ensure courses are refreshed
        })
        .catch(error => console.error('Error updating user info:', error));
    }

    // Fetch and display courses
    function fetchCourses() {
        fetch('http://127.0.0.1:8000/api/core/courses/', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(courses => {
            fetch('http://127.0.0.1:8000/api/core/enrollments/', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => response.json())
            .then(enrollments => {
                const enrolledCourseIds = enrollments
                    .filter(e => e.student === parseInt(userId))
                    .map(e => e.course);
                content.innerHTML = `
                    <h1 class="mb-4">Available Courses</h1>
                    <div class="row">
                        ${courses.map(course => `
                            <div class="col-md-4 mb-3">
                                <div class="card h-100 course-card">
                                    ${course.cover_image_path ? `<img src="${course.cover_image_path}" class="card-img-top" alt="${course.title}" style="max-height: 200px; object-fit: cover;">` : `<img src="https://via.placeholder.com/200x200?text=No+Image" class="card-img-top" alt="No Image" style="max-height: 200px; object-fit: cover;">`}
                                    <div class="card-body">
                                        <h5 class="card-title">${course.title}</h5>
                                        <p class="card-text">Taught by ${course.teacher.username}</p>
                                        ${enrolledCourseIds.includes(course.id) ? '<span class="badge bg-success">Enrolled</span>' : `<button class="btn btn-primary btn-sm" data-course-id="${course.id}">Enroll</button>`}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                document.querySelectorAll('[data-course-id]').forEach(button => {
                    button.addEventListener('click', () => enroll(parseInt(button.dataset.courseId)));
                });
            });
        })
        .catch(error => console.error('Error fetching courses:', error));
    }

    // Login form
    function showLogin() {
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

    // Signup form
    function showSignup() {
        content.innerHTML = `
            <h1 class="mb-4">Signup</h1>
            <form id="signup-form" class="needs-validation" novalidate>
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" id="username" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary">Signup</button>
            </form>
        `;
        document.getElementById('signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            signup();
        });
    }

    // Login function
    function login() {
        const usernameInput = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        console.log('Login attempt with username:', usernameInput);
        fetch('http://127.0.0.1:8000/api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password })
        })
        .then(response => {
            console.log('Token response status:', response.status);
            if (!response.ok) throw new Error('Token fetch failed: ' + response.status);
            return response.json();
        })
        .then(data => {
            token = data.access;
            localStorage.setItem('token', token);
            console.log('Token received:', token);
            return fetch('http://127.0.0.1:8000/userauths/api/users/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        })
        .then(response => {
            console.log('Users response status:', response.status);
            if (!response.ok) throw new Error('Users fetch failed: ' + response.status);
            return response.json();
        })
        .then(users => {
            console.log('Users response data:', JSON.stringify(users, null, 2));
            const user = users.find(u => u.username.toLowerCase() === usernameInput.toLowerCase());
            console.log('Searching for username:', usernameInput.toLowerCase());
            console.log('Found user:', user);
            if (user) {
                userId = user.id;
                firstName = user.first_name || user.username;
                profilePic = user.profile_picture_path;
                localStorage.setItem('userId', userId);
                localStorage.setItem('firstName', firstName);
                localStorage.setItem('profilePic', profilePic || '');
                console.log('Logged in user:', { id: userId, firstName: firstName, profilePic: profilePic });
                updateNav();
            } else {
                console.error('User not found in response for:', usernameInput);
                throw new Error('User not found in API response');
            }
        })
        .catch(error => {
            content.innerHTML += '<div class="alert alert-danger">Login failed</div>';
            console.error('Login error:', error);
        });
    }

    // Signup function
    function signup() {
        const usernameInput = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        fetch('http://127.0.0.1:8000/userauths/api/users/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password, user_type: 'student' })
        })
        .then(response => {
            if (response.ok) showLogin();
            else throw new Error('Signup failed');
        })
        .catch(error => {
            content.innerHTML += '<div class="alert alert-danger">Signup failed</div>';
            console.error('Signup error:', error);
        });
    }

    // Logout function
    function logout() {
        fetch('http://127.0.0.1:8000/accounts/logout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-CSRFToken': getCsrfToken()
            }
        })
        .then(response => {
            if (!response.ok) throw new Error(`Logout failed with status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            token = null;
            userId = null;
            firstName = null;
            profilePic = null;
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('firstName');
            localStorage.removeItem('profilePic');
            updateNav();
        })
        .catch(error => {
            console.error('Logout error:', error);
            token = null;
            userId = null;
            firstName = null;
            profilePic = null;
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('firstName');
            localStorage.removeItem('profilePic');
            updateNav();
        });
    }

    // Enroll function
    function enroll(courseId) {
        fetch('http://127.0.0.1:8000/api/core/enrollments/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ course: courseId, student: userId })
        })
        .then(response => {
            if (response.ok) fetchCourses();
            else throw new Error('Enrollment failed');
        })
        .catch(error => console.error('Enroll error:', error));
    }

    // Helper to get CSRF token
    function getCsrfToken() {
        const name = 'csrftoken';
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Initial load
    fetchUserData();
});