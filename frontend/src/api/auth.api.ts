import { api } from './axios';
import type { LoginCredentials, RegisterData, AuthResponse } from '../types/auth.types';
import type { ApiResponse } from '../types/api.types';

export const authApi = {
    login: async (credentials: LoginCredentials) => {
        const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
        return data;
    },

    register: async (userData: RegisterData) => {
        const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', userData);
        return data;
    },

    logout: async () => {
        const { data } = await api.post<ApiResponse<null>>('/auth/logout');
        return data;
    },

    getCurrentUser: async () => {
        const { data } = await api.get<ApiResponse<any>>('/auth/me');
        return data;
    },

    forgotPassword: async (email: string) => {
        const { data } = await api.post<ApiResponse<null>>('/auth/forgot-password', { email });
        return data;
    },

    resetPassword: async (token: string, password: string) => {
        const { data } = await api.post<ApiResponse<null>>(`/auth/reset-password/${token}`, { password });
        return data;
    },
};