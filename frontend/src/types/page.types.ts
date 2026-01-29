import type { Task } from "./task.types";

export type PageStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface Page {
    id: number;
    project_id: number;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    status: PageStatus;
    created_by: number;
    created_at: string;
    updated_at: string;
    project_name?: string;
    tasks?: Task[];
    tasks_count?: number;
    tasks_completed?: number;
}

export interface CreatePageData {
    project_id: number;
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status?: PageStatus;
}
