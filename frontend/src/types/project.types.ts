import type { Client } from "./client.types";
import type { Page } from "./page.types";

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface Project {
    id: number;
    client_id: number;
    name: string;
    status: ProjectStatus;
    created_by: number;
    created_at: string;
    updated_at: string;
    client?: Client;
    client_name?: string;
    pages?: Page[];
    pages_count?: number;
}

export interface CreateProjectData {
    client_id: number;
    name: string;
    status: ProjectStatus;
}