// modules/utils.js
// This module contains utility functions that can be used across the application

// Helper function to format dates consistently
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Helper function to format date and time
export function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Helper function to truncate text with ellipsis
export function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Helper function to validate email format
export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Helper function to validate password strength
export function isValidPassword(password) {
    // At least 8 characters
    return password.length >= 8;
}

// Helper function to get file extension
export function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

// Helper function to get file type based on extension
export function getFileType(filename) {
    const ext = getFileExtension(filename);
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg'];
    const videoTypes = ['mp4', 'webm', 'ogg', 'mov'];
    const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'];
    
    if (imageTypes.includes(ext)) return 'image';
    if (videoTypes.includes(ext)) return 'video';
    if (documentTypes.includes(ext)) return 'document';
    
    return 'other';
}

// Helper function to convert bytes to readable format
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}