import type { User } from "./user.types";

export interface Comment {
    id: number;
    task_id: number;
    user_id: number;
    comment: string;
    created_at: string;
    updated_at: string;
    user?: User;
}

export interface CreateCommentData {
    task_id: number;
    comment: string;
}