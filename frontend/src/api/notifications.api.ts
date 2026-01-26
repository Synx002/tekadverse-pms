import { api } from './axios';
import type { Notification } from '../types/notification.types';
import type { ApiResponse } from '../types/api.types';

export const notificationsApi = {
    getAll: async () => {
        const { data } = await api.get<ApiResponse<Notification[]>>('/notifications');
        return data;
    },

    markAsRead: async (id: number) => {
        const { data } = await api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
        return data;
    },

    markAllAsRead: async () => {
        const { data } = await api.patch<ApiResponse<null>>('/notifications/read-all');
        return data;
    },

    delete: async (id: number) => {
        const { data } = await api.delete<ApiResponse<null>>(`/notifications/${id}`);
        return data;
    },
};