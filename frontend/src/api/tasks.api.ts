import { api } from './axios';
import type { Task, CreateTaskData, UpdateTaskData } from '../types/task.types';
import type { ApiResponse } from '../types/api.types';

export const tasksApi = {
    getAll: async (filters?: { project_id?: number; assigned_to?: number; status?: string }) => {
        const { data } = await api.get<ApiResponse<Task[]>>('/tasks', { params: filters });
        return data;
    },

    getById: async (id: number) => {
        const { data } = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
        return data;
    },

    create: async (taskData: CreateTaskData) => {
        const { data } = await api.post<ApiResponse<Task>>('/tasks', taskData);
        return data;
    },

    update: async (id: number, taskData: UpdateTaskData) => {
        const { data } = await api.put<ApiResponse<Task>>(`/tasks/${id}`, taskData);
        return data;
    },

    updateStatus: async (id: number, status: string) => {
        const { data } = await api.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status });
        return data;
    },

    delete: async (id: number) => {
        const { data } = await api.delete<ApiResponse<null>>(`/tasks/${id}`);
        return data;
    },
};