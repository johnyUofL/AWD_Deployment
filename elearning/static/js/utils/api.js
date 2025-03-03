/**
 * Utility function for making API requests
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options (method, headers, body)
 * @param {string} token - Authentication token
 * @returns {Promise} - Promise that resolves with the JSON response
 */
export async function apiFetch(url, options = {}, token = null) {
    // Set up default headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // Add authorization header if token is provided
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }
    
    // Prepare fetch options
    const fetchOptions = {
        ...options,
        headers
    };
    
    // Make the request
    const response = await fetch(url, fetchOptions);
    
    // Handle non-2xx responses
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.detail || `API request failed with status ${response.status}`);
        error.status = response.status;
        error.response = response;
        error.data = errorData;
        throw error;
    }
    
    // For DELETE requests or 204 No Content responses
    if (response.status === 204 || options.method === 'DELETE') {
        return null;
    }
    
    // Parse and return JSON response
    return await response.json();
} 