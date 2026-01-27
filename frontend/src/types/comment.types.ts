import type { User } from "./user.types";

export interface Comment {
    id: number;
    task_id: number;
    user_id: number;
    comment: string;
    created_at: string;
    updated_at: string;
    user?: User;
    user_name?: string;
    user_role?: string;
    profile_picture?: string;
}

export interface CreateCommentData {
    task_id: number;
    comment: string;
}