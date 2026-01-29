import { api } from './axios';
import type { Page, CreatePageData } from '../types/page.types';
import type { ApiResponse } from '../types/api.types';

export const pagesApi = {
    getAll: async (params?: any) => {
        const { data } = await api.get<ApiResponse<Page[]>>('/pages', { params });
        return data;
    },

    getById: async (id: number) => {
        const { data } = await api.get<ApiResponse<Page>>(`/pages/${id}`);
        return data;
    },

    create: async (pageData: CreatePageData) => {
        const { data } = await api.post<ApiResponse<Page>>('/pages', pageData);
        return data;
    },

    update: async (id: number, pageData: Partial<CreatePageData>) => {
        const { data } = await api.put<ApiResponse<Page>>(`/pages/${id}`, pageData);
        return data;
    },

    delete: async (id: number) => {
        const { data } = await api.delete<ApiResponse<null>>(`/pages/${id}`);
        return data;
    },
};
