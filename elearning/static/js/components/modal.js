// components/modal.js
// Reusable modal component 

/**
 * Create and show a modal
 * @param {Object} options - Modal options
 * @param {string} options.id - Modal ID
 * @param {string} options.title - Modal title
 * @param {string} options.body - Modal body HTML
 * @param {Array} options.buttons - Array of button objects
 * @param {string} options.size - Modal size (sm, lg, xl)
 * @returns {bootstrap.Modal} - The Bootstrap modal instance
 */
export function showModal(options) {
    const { id, title, body, buttons = [], size = '' } = options;
    
    // Remove modal with same ID if it exists
    const existingModal = document.getElementById(id);
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create footer buttons
    const footerButtons = buttons.map(btn => {
        return `<button type="button" class="btn ${btn.class || 'btn-secondary'}" ${btn.attributes || ''} id="${btn.id || ''}">${btn.text}</button>`;
    }).join('');
    
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="${id}" tabindex="-1" aria-labelledby="${id}Label" aria-hidden="true">
            <div class="modal-dialog ${size ? `modal-${size}` : ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${id}Label">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">${body}</div>
                    <div class="modal-footer">${footerButtons}</div>
                </div>
            </div>
        </div>
    `;
    
    // Append modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Initialize the modal
    const modalElement = document.getElementById(id);
    const modal = new bootstrap.Modal(modalElement);
    
    // Add event listener to remove modal from DOM once hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });
    
    // Add event listeners to buttons
    buttons.forEach(btn => {
        if (btn.id && btn.onClick) {
            document.getElementById(btn.id).addEventListener('click', () => {
                btn.onClick(modal);
            });
        }
    });
    
    // Show the modal
    modal.show();
    
    return modal;
}

/**
 * Show a confirmation modal
 * @param {Object} options - Confirmation options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Confirmation message
 * @param {Function} options.onConfirm - Function to call on confirm
 * @param {Function} options.onCancel - Function to call on cancel
 * @param {string} options.confirmText - Text for confirm button
 * @param {string} options.cancelText - Text for cancel button
 * @param {string} options.confirmButtonClass - Class for confirm button
 * @returns {bootstrap.Modal} - The Bootstrap modal instance
 */
export function showConfirmation({
    title = 'Confirm',
    message = 'Are you sure?',
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonClass = 'btn-primary'
}) {
    return showModal({
        id: 'confirmationModal',
        title,
        body: `<p>${message}</p>`,
        buttons: [
            {
                id: 'cancelButton',
                text: cancelText,
                class: 'btn-secondary',
                onClick: modal => {
                    if (onCancel) onCancel();
                    modal.hide();
                }
            },
            {
                id: 'confirmButton',
                text: confirmText,
                class: confirmButtonClass,
                onClick: modal => {
                    if (onConfirm) onConfirm();
                    modal.hide();
                }
            }
        ]
    });
}

/**
 * Show an alert modal
 * @param {Object} options - Alert options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Alert message
 * @param {string} options.buttonText - Text for OK button
 * @param {Function} options.onClose - Function to call on close
 * @returns {bootstrap.Modal} - The Bootstrap modal instance
 */
export function showAlert({
    title = 'Alert',
    message = '',
    buttonText = 'OK',
    onClose
}) {
    return showModal({
        id: 'alertModal',
        title,
        body: `<p>${message}</p>`,
        buttons: [
            {
                id: 'okButton',
                text: buttonText,
                class: 'btn-primary',
                onClick: modal => {
                    if (onClose) onClose();
                    modal.hide();
                }
            }
        ]
    });
}