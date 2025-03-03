// modules/ui.js
import { login, logout, signup, checkUserRole, showUserInfoModal, saveUserInfo } from './auth.js';
import { fetchCourses } from './courses.js';

export function renderLogin() {
    const content = document.getElementById('content');
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
        login(window.appState);
    });
}

export function renderSignup() {
    const content = document.getElementById('content');
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

export function renderUserInfoModal(user, state) {
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
    document.getElementById('saveUserInfo').addEventListener('click', () => saveUserInfo(modal, state));
    document.getElementById('userInfoModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('userInfoModal').remove();
    });
}

export function renderStudentProfile(user, statusUpdates) {
    const content = document.getElementById('content');
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
    document.getElementById('backToCourses').addEventListener('click', () => fetchCourses(window.appState));
}

export function updateNav(state) {
    const navLinks = document.getElementById('nav-links');
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
            showUserInfoModal(state);
        });
        document.getElementById('logoutLink').addEventListener('click', (e) => {
            e.preventDefault();
            logout(state);
        });
        checkUserRole(state);
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