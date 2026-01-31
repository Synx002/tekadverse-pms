import type { Project } from "./project.types";
import type { Page } from "./page.types";
import type { User } from "./user.types";

export type TaskStatus = 'todo' | 'working' | 'finished' | 'need_update' | 'under_review' | 'approved' | 'done' | 'dropped';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
    id: number;
    page_id: number;
    step_id: number | null;
    title: string;
    description: string | null;
    assigned_to: number;
    assigned_by: number;
    status: TaskStatus;
    priority: TaskPriority;
    deadline: string | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    project?: Project;
    page?: Page;
    assignee?: User;
    assigner?: User;
    assigned_to_name?: string;
    assigned_to_email?: string;
    artist_profile?: string;
    assigned_by_name?: string;
    project_name?: string;
    page_name?: string;
    client_name?: string;
    comments_count?: number;
    step_number?: number;
    step_name?: string;
}

export interface CreateTaskData {
    page_id: number;
    step_id: number;  // Required: each task must be assigned to a step
    title: string;
    description?: string;
    assigned_to: number;
    priority?: TaskPriority;
    deadline?: string;
}

export interface UpdateTaskData {
    step_id?: number;
    title?: string;
    description?: string;
    assigned_to?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    deadline?: string;
}