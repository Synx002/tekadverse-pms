import { api } from './axios';
import type { Project, CreateProjectData } from '../types/project.types';
import type { ApiResponse } from '../types/api.types';

export const projectsApi = {
    getAll: async () => {
        const { data } = await api.get<ApiResponse<Project[]>>('/projects');
        return data;
    },

    getById: async (id: number) => {
        const { data } = await api.get<ApiResponse<Project>>(`/projects/${id}`);
        return data;
    },

    create: async (projectData: CreateProjectData) => {
        const { data } = await api.post<ApiResponse<Project>>('/projects', projectData);
        return data;
    },

    update: async (id: number, projectData: Partial<CreateProjectData>) => {
        const { data } = await api.put<ApiResponse<Project>>(`/projects/${id}`, projectData);
        return data;
    },

    delete: async (id: number) => {
        const { data } = await api.delete<ApiResponse<null>>(`/projects/${id}`);
        return data;
    },
};