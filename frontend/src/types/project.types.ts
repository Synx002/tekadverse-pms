import type { Client } from "./client.types";
import type { User } from "./user.types";

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface Project {
    id: number;
    client_id: number;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    status: ProjectStatus;
    created_by: number;
    created_at: string;
    updated_at: string;
    client?: Client;
    client_name?: string;
    client_company?: string;
    creator?: User;
    tasks_count?: number;
    tasks_completed?: number;
}

export interface CreateProjectData {
    client_id: number;
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status?: ProjectStatus;
}