// components/toast.js
// Toast component for displaying notifications

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, danger, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = 'success', duration = 3000) {
    // Check if toast container exists, if not create it
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = `toast-${Date.now()}`;
    const bgClass = getBgClass(type);
    const iconClass = getIconClass(type);
    
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
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: duration });
    toast.show();
    
    // Remove toast from DOM after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

/**
 * Get the appropriate background class based on the toast type
 * @param {string} type - The type of toast
 * @returns {string} - The Bootstrap background class
 */
function getBgClass(type) {
    switch (type) {
        case 'success': return 'bg-success';
        case 'danger': return 'bg-danger';
        case 'warning': return 'bg-warning';
        case 'info': return 'bg-info';
        default: return 'bg-success';
    }
}

/**
 * Get the appropriate icon class based on the toast type
 * @param {string} type - The type of toast
 * @returns {string} - The Bootstrap icon class
 */
function getIconClass(type) {
    switch (type) {
        case 'success': return 'bi-check-circle-fill';
        case 'danger': return 'bi-exclamation-circle-fill';
        case 'warning': return 'bi-exclamation-triangle-fill';
        case 'info': return 'bi-info-circle-fill';
        default: return 'bi-check-circle-fill';
    }
}