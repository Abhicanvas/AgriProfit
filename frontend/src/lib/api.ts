import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

console.log('[API] Initializing axios with baseURL:', baseURL);

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000, // 60 second timeout (increased for database queries)
});

export const apiWithLongTimeout = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000, // 2 minute timeout for slow endpoints
});

api.interceptors.request.use((config) => {
    console.log('[API] Request:', config.method?.toUpperCase(), config.url);

    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => {
        console.log('[API] Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('[API] Response error:', error.message, error.config?.url);
        if (error.response && error.response.data) {
            console.error('[API] Error details:', error.response.data);
        }

        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;