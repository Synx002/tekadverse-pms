import axios from "axios";

const RAW = import.meta.env.VITE_API_BASE_URL || "https://api.tekadverse.id";

// kalau orang masukin https://api.xxx/api -> buang /api di belakang
export const BASE_URL = RAW.replace(/\/api\/?$/, "");

export const API_BASE_URL = `${BASE_URL}/api`;

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor untuk handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && window.location.pathname !== '/login') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);