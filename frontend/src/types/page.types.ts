import type { Task } from "./task.types";
import type { ProjectStep } from "./project.types";

export type PageStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

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
    /** Project steps (read-only, inherited from parent project) */
    steps?: ProjectStep[];
}

export interface CreatePageData {
    project_id: number;
    name: string;
}
