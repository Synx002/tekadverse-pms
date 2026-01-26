import { api } from './axios';
import type { Client, CreateClientData } from '../types/client.types';
import type { ApiResponse } from '../types/api.types';

export const clientsApi = {
    getAll: async () => {
        const { data } = await api.get<ApiResponse<Client[]>>('/clients');
        return data;
    },

    getById: async (id: number) => {
        const { data } = await api.get<ApiResponse<Client>>(`/clients/${id}`);
        return data;
    },

    create: async (clientData: CreateClientData) => {
        const formData = new FormData();
        Object.entries(clientData).forEach(([key, value]) => {
            if (value !== undefined) {
                formData.append(key, value);
            }
        });
        const { data } = await api.post<ApiResponse<Client>>('/clients', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    update: async (id: number, clientData: Partial<CreateClientData>) => {
        const formData = new FormData();
        Object.entries(clientData).forEach(([key, value]) => {
            if (value !== undefined) {
                formData.append(key, value);
            }
        });
        const { data } = await api.put<ApiResponse<Client>>(`/clients/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    delete: async (id: number) => {
        const { data } = await api.delete<ApiResponse<null>>(`/clients/${id}`);
        return data;
    },
};