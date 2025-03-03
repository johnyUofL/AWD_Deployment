import { fetchTeacherCourses } from './modules/teacher.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Get user info from the page
    const userType = document.body.dataset.userType;
    const userId = document.body.dataset.userId;
    const token = document.body.dataset.token;
    
    // Create application state
    const state = {
        userType,
        userId,
        token
    };
    
    // Initialize based on user type
    if (userType === 'teacher') {
        fetchTeacherCourses(state);
    } else if (userType === 'student') {
        // Initialize student dashboard
    }
}); 