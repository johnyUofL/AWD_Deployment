document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.getElementById('nav-links');
    const content = document.getElementById('content');
    let token = localStorage.getItem('token');
    let userId = localStorage.getItem('userId');

    // Update navigation
    function updateNav() {
        navLinks.innerHTML = '';
        if (token) {
            navLinks.innerHTML = `
                <li class="nav-item">
                    <button class="nav-link btn btn-link text-light" id="logout-btn">Logout</button>
                </li>
            `;
            document.getElementById('logout-btn').addEventListener('click', logout);
            fetchCourses();  // Default view is courses
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
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        fetch('http://127.0.0.1:8000/api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            token = data.access;
            localStorage.setItem('token', token);
            fetch('http://127.0.0.1:8000/userauths/api/users/', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => response.json())
            .then(users => {
                const user = users.find(u => u.username === username);
                userId = user.id;
                localStorage.setItem('userId', userId);
                updateNav();
            });
        })
        .catch(error => {
            content.innerHTML += '<div class="alert alert-danger">Login failed</div>';
            console.error('Login error:', error);
        });
    }

    // Signup function
    function signup() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        fetch('http://127.0.0.1:8000/userauths/api/users/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, user_type: 'student' })
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
            console.log('Logout status:', response.status);
            if (!response.ok) {
                throw new Error(`Logout failed with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Logout data:', data);
            token = null;
            userId = null;
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            updateNav();
        })
        .catch(error => {
            console.error('Logout error:', error);
            token = null;
            userId = null;
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
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
    updateNav();
});