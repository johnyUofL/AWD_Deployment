// modules/api.js
export function getCsrfToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || '';
}

export async function apiFetch(url, options = {}, token) {
    const defaultHeaders = {
        'Authorization': `Bearer ${token}`
    };
    if (options.method && options.method !== 'GET') {
        defaultHeaders['X-CSRFToken'] = getCsrfToken();
    }
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }
    const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    });
    if (!response.ok) throw new Error(`${options.method || 'GET'} ${url} failed: ${response.status}`);
    return response.json();
}