import type { Task } from "./task.types";

export type PageStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface PageStep {
    id?: number;
    page_id?: number;
    step_number: number;
    step_name: string;
    created_at?: string;
}

export interface Page {
    id: number;
    project_id: number;
    name: string;
    created_by: number;
    created_at: string;
    updated_at: string;
    project_name?: string;
    tasks?: Task[];
    tasks_count?: number;
    tasks_completed?: number;
    steps?: PageStep[];
}

export interface CreatePageData {
    project_id: number;
    name: string;
    steps?: PageStep[];
}
