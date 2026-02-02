import { api } from './axios';
import type { User, CreateUserData, UpdateUserData } from '../types/user.types';
import type { ApiResponse } from '../types/api.types';

export const usersApi = {
    getAll: async () => {
        const { data } = await api.get<ApiResponse<User[]>>('/users');
        return data;
    },

    getById: async (id: number) => {
        const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
        return data;
    },

    create: async (userData: CreateUserData) => {
        const formData = new FormData();
        Object.entries(userData).forEach(([key, value]) => {
            if (value !== undefined) {
                formData.append(key, value);
            }
        });
        const { data } = await api.post<ApiResponse<User>>('/users', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    update: async (id: number, userData: UpdateUserData) => {
        const formData = new FormData();
        Object.entries(userData).forEach(([key, value]) => {
            if (value !== undefined) {
                formData.append(key, value);
            }
        });
        const { data } = await api.put<ApiResponse<User>>(`/users/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    delete: async (id: number) => {
        const { data } = await api.delete<ApiResponse<null>>(`/users/${id}`);
        return data;
    },

    getArtists: async () => {
        const { data } = await api.get<ApiResponse<User[]>>('/users/artists');
        return data;
    },
    getMe: async () => {
        const { data } = await api.get<ApiResponse<User>>('/users/me');
        return data;
    },
    uploadProfilePicture: async (formData: FormData) => {
        const { data } = await api.post<ApiResponse<{ filePath: string }>>('/users/upload-profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
};
