import axios from 'axios';

/**
 * API base URL
 *
 * - In production (single-origin deploy), prefer relative `/api`
 * - In local dev, Vite proxy can also use `/api`
 * - For Docker/local without proxy, set `VITE_API_BASE_URL=http://localhost:3001/api`
 */
const baseURL: string = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({ baseURL });

// Interceptor to add the JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('greenchainz-token');
    if (token) {
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
