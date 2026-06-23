import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Send cookies
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to attach access token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor to handle 401 and refresh tokens
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const userId = localStorage.getItem('userId');
                const refreshRes = await axios.post(
                    `${API_URL}/auth/refresh`,
                    { userId },
                    { withCredentials: true },
                );

                const newToken = refreshRes.data.data?.accessToken;
                if (newToken) {
                    localStorage.setItem('accessToken', newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            } catch {
                // Refresh failed → redirect to login
                localStorage.clear();
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
