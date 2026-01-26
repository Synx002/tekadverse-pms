export type NotificationType = 'task_assigned' | 'task_updated' | 'comment_added' | 'deadline_reminder' | 'general';
export type RelatedType = 'task' | 'project' | 'comment' | 'client';

export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: NotificationType;
    related_id: number | null;
    related_type: RelatedType | null;
    is_read: boolean;
    created_at: string;
}