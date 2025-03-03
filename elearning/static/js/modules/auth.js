// modules/auth.js
import { apiFetch } from './api.js';
import { renderLogin, renderSignup, updateNav, renderUserInfoModal } from './ui.js';
import { fetchCourses } from './courses.js';
import { renderTeacherDashboard } from './teacher.js';
import { showToast } from '../components/toast.js';

export async function login(state) {
    const usernameInput = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const content = document.getElementById('content');
    
    console.log('Login attempt with username:', usernameInput);
    try {
        const data = await apiFetch('http://127.0.0.1:8000/api/token/', {
            method: 'POST',
            body: JSON.stringify({ username: usernameInput, password })
        });
        console.log('Token response status: 200');
        updateState(state, 'token', data.access);
        const users = await apiFetch('http://127.0.0.1:8000/userauths/api/users/', {}, state.token);
        console.log('Users response data:', JSON.stringify(users, null, 2));
        const user = users.find(u => u.username.toLowerCase() === usernameInput.toLowerCase());
        console.log('Searching for username:', usernameInput.toLowerCase());
        console.log('Found user:', user);
        if (user) {
            updateState(state, 'userId', user.id);
            updateState(state, 'firstName', user.first_name || user.username);
            updateState(state, 'profilePic', user.profile_picture_path || '');
            console.log('Logged in user:', { id: state.userId, firstName: state.firstName, profilePic: state.profilePic });
            updateNav(state);
        } else {
            throw new Error('User not found in API response');
        }
    } catch (error) {
        content.innerHTML += '<div class="alert alert-danger">Login failed</div>';
        console.error('Login error:', error);
    }
}

export async function signup() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const errorDiv = document.getElementById('signup-error');
    const content = document.getElementById('content');
    
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

export async function logout(state) {
    try {
        await apiFetch('http://127.0.0.1:8000/accounts/logout/', { method: 'POST' }, state.token);
        console.log('Logout successful');
        clearState(state);
        updateNav(state);
    } catch (error) {
        console.error('Logout error:', error);
        clearState(state);
        updateNav(state);
    }
}

export async function checkUserRole(state) {
    if (state.token) {
        try {
            const user = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${state.userId}/`, {}, state.token);
            if (user.user_type === 'teacher') {
                renderTeacherDashboard(state);
            } else {
                fetchCourses(state); // Default student view
            }
        } catch (error) {
            console.error('Error checking user role:', error);
            logout(state);
        }
    }
}

export async function fetchUserData(state) {
    if (state.token) {
        try {
            const users = await apiFetch('http://127.0.0.1:8000/userauths/api/users/', {}, state.token);
            console.log('Users response data:', JSON.stringify(users, null, 2));
            const user = users.find(u => u.id === parseInt(state.userId));
            console.log('Found user by ID:', user);
            if (user) {
                updateState(state, 'firstName', user.first_name || user.username);
                updateState(state, 'profilePic', user.profile_picture_path || '');
                updateNav(state);
            } else {
                console.error('User not found for ID:', state.userId);
                logout(state);
            }
        } catch (error) {
            console.error('Fetch user data error:', error);
            logout(state);
        }
    } else {
        updateNav(state);
    }
}

export async function showUserInfoModal(state) {
    try {
        const user = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${state.userId}/`, {}, state.token);
        renderUserInfoModal(user, state);
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

export async function saveUserInfo(modal, state) {
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
        }, state.token);
        updateState(state, 'firstName', user.first_name || user.username);
        updateState(state, 'profilePic', user.profile_picture_path ? `${user.profile_picture_path}?${new Date().getTime()}` : state.profilePic);
        console.log('User updated:', { firstName: state.firstName, profilePic: state.profilePic });
        modal.hide();
        updateNav(state);
        fetchCourses(state);
    } catch (error) {
        console.error('Error updating user info:', error);
    }
}

// Helper functions for state management
export function updateState(state, key, value) {
    state[key] = value;
    localStorage.setItem(key, value);
}

export function clearState(state) {
    state.token = null;
    state.userId = null;
    state.firstName = null;
    state.profilePic = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('firstName');
    localStorage.removeItem('profilePic');
}

// Import the getCsrfToken for signup
import { getCsrfToken } from './api.js';