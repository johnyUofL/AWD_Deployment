// app.js - Main entry point for the application
import { fetchUserData } from './modules/auth.js';

// Initialize application state
window.appState = {
    token: localStorage.getItem('token'),
    userId: localStorage.getItem('userId'),
    firstName: localStorage.getItem('firstName'),
    profilePic: localStorage.getItem('profilePic'),
    allCourses: [],
    enrolledCourseIds: [],
    enrollmentMap: {}
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Initialize app components
    console.log('Initializing app with state:', window.appState);
    
    // Setup toast container
    setupToastContainer();
    
    // Fetch user data and initialize UI
    fetchUserData(window.appState);
    
    // Setup routing if needed
    setupRouting();
}

function setupToastContainer() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toastContainer')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
}

function setupRouting() {
    // Simple hash-based routing
    window.addEventListener('hashchange', handleRouteChange);
    
    // Initial route check
    if (window.location.hash) {
        handleRouteChange();
    }
}

function handleRouteChange() {
    // Basic routing based on hash
    const hash = window.location.hash.substring(1);
    
    switch (hash) {
        case 'courses':
            // Load courses page
            if (window.appState.token) {
                import('./modules/courses.js').then(module => {
                    module.fetchCourses(window.appState);
                });
            }
            break;
        case 'profile':
            // Load profile page
            if (window.appState.token) {
                import('./modules/auth.js').then(module => {
                    module.showUserInfoModal(window.appState);
                });
            }
            break;
        case 'teacher':
            // Load teacher dashboard
            if (window.appState.token) {
                import('./modules/teacher.js').then(module => {
                    module.renderTeacherDashboard(window.appState);
                });
            }
            break;
        // Add more routes as needed
    }
}