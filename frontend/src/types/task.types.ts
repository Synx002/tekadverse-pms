import type { Project } from "./project.types";
import type { User } from "./user.types";

export type TaskStatus = 'todo' | 'working' | 'need_update' | 'under_review' | 'approved' | 'done' | 'dropped';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
    id: number;
    project_id: number;
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
    assignee?: User;
    assigner?: User;
    comments_count?: number;
}

export interface CreateTaskData {
    project_id: number;
    title: string;
    description?: string;
    assigned_to: number;
    priority?: TaskPriority;
    deadline?: string;
}

export interface UpdateTaskData {
    title?: string;
    description?: string;
    assigned_to?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    deadline?: string;
}