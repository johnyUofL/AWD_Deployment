document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.getElementById('nav-links');
    const content = document.getElementById('content');
    let token = localStorage.getItem('token');
    let userId = localStorage.getItem('userId');
    let firstName = localStorage.getItem('firstName');
    let profilePic = localStorage.getItem('profilePic'); // Store profile picture path

    // Update navigation
    function updateNav() {
        navLinks.innerHTML = '';
        if (token) {
            console.log('Token:', token); // Debug
            console.log('First name in updateNav:', firstName); // Debug
            console.log('Profile pic in updateNav:', profilePic); // Debug
            navLinks.innerHTML = `
                <li class="nav-item d-flex align-items-center">
                    <img src="${profilePic || 'https://via.placeholder.com/30?text=User'}" alt="Profile" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span class="nav-link text-light me-2">Welcome! ${firstName || 'User'}</span>
                    <button class="nav-link btn btn-link text-light" id="logout-btn" title="Logout">
                        <i class="bi bi-box-arrow-right"></i>
                    </button>
                </li>
            `;
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
                console.log('Logout button added'); // Debug
            } else {
                console.error('Logout button not found');
            }
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
                console.log('Users response status:', response.status); // Debug
                if (!response.ok) {
                    throw new Error('Users fetch failed: ' + response.status);
                }
                return response.json();
            })
            .then(users => {
                console.log('Users response data:', JSON.stringify(users, null, 2)); // Debug
                const user = users.find(u => u.id === parseInt(userId));
                console.log('Found user by ID:', user); // Debug
                if (user) {
                    firstName = user.first_name || user.username;
                    profilePic = user.profile_picture_path; // Fetch profile picture path
                    localStorage.setItem('firstName', firstName);
                    localStorage.setItem('profilePic', profilePic || ''); // Store even if null
                    console.log('Updated user data:', { firstName: firstName, profilePic: profilePic }); // Debug
                    updateNav();
                } else {
                    console.error('User not found for ID:', userId);
                    logout(); // Clear invalid token
                }
            })
            .catch(error => {
                console.error('Fetch user data error:', error);
                logout(); // Clear invalid token and force login
            });
        } else {
            updateNav(); // No token, show login/signup
        }
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
        console.log('Login attempt with username:', usernameInput); // Debug
        fetch('http://127.0.0.1:8000/api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password })
        })
        .then(response => {
            console.log('Token response status:', response.status); // Debug
            if (!response.ok) throw new Error('Token fetch failed: ' + response.status);
            return response.json();
        })
        .then(data => {
            token = data.access;
            localStorage.setItem('token', token);
            console.log('Token received:', token); // Debug
            return fetch('http://127.0.0.1:8000/userauths/api/users/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        })
        .then(response => {
            console.log('Users response status:', response.status); // Debug
            if (!response.ok) throw new Error('Users fetch failed: ' + response.status);
            return response.json();
        })
        .then(users => {
            console.log('Users response data:', JSON.stringify(users, null, 2)); // Debug
            const user = users.find(u => u.username.toLowerCase() === usernameInput.toLowerCase());
            console.log('Searching for username:', usernameInput.toLowerCase()); // Debug
            console.log('Found user:', user); // Debug
            if (user) {
                userId = user.id;
                firstName = user.first_name || user.username;
                profilePic = user.profile_picture_path; // Set profile picture
                localStorage.setItem('userId', userId);
                localStorage.setItem('firstName', firstName);
                localStorage.setItem('profilePic', profilePic || ''); // Store even if null
                console.log('Logged in user:', { id: userId, firstName: firstName, profilePic: profilePic }); // Debug
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
    fetchUserData(); // Fetch user data on load
});