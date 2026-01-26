import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { tasksApi } from '../../api/tasks.api';
import { commentsApi } from '../../api/comments.api';
import type { Task } from '../../types/task.types';
import type { Comment } from '../../types/comment.types';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

export const TaskDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [task, setTask] = useState<Task | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            loadTaskDetail();
        }
    }, [id]);

    const loadTaskDetail = async () => {
        try {
            setLoading(true);
            const [taskRes, commentsRes] = await Promise.all([
                tasksApi.getById(Number(id)),
                commentsApi.getByTaskId(Number(id)),
            ]);
            setTask(taskRes.data ?? null);
            setComments(commentsRes.data ?? []);
        } catch (error) {
            toast.error('Failed to load task details');
            navigate('/tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !id) return;

        try {
            setSubmitting(true);
            await commentsApi.create({
                task_id: Number(id),
                comment: newComment,
            });
            setNewComment('');
            loadTaskDetail();
            toast.success('Comment added');
        } catch (error) {
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!task) return null;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            todo: 'bg-gray-100 text-gray-800',
            working: 'bg-blue-100 text-blue-800',
            need_update: 'bg-yellow-100 text-yellow-800',
            under_review: 'bg-purple-100 text-purple-800',
            approved: 'bg-green-100 text-green-800',
            done: 'bg-green-100 text-green-800',
            dropped: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: 'text-gray-600',
            medium: 'text-blue-600',
            high: 'text-orange-600',
            urgent: 'text-red-600',
        };
        return colors[priority] || 'text-gray-600';
    };

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Tasks
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Task Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900 mb-3">{task.title}</h1>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gray-100 ${getPriorityColor(task.priority)}`}>
                                        {task.priority.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {task.description && (
                            <div className="prose max-w-none">
                                <p className="text-gray-700">{task.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Comments */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Comments ({comments.length})
                        </h2>

                        <div className="space-y-4 mb-6">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium flex-shrink-0">
                                        {comment.user?.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">{comment.user?.name}</span>
                                            <span className="text-xs text-gray-500">
                                                {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-gray-700">{comment.comment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSubmitComment} className="flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Assigned To</p>
                            <p className="font-medium text-gray-900">{task.assignee?.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Assigned By</p>
                            <p className="font-medium text-gray-900">{task.assigner?.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Project</p>
                            <p className="font-medium text-gray-900">{task.project?.name}</p>
                        </div>
                        {task.deadline && (
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Deadline</p>
                                <p className="font-medium text-gray-900">
                                    {format(new Date(task.deadline), 'MMM dd, yyyy')}
                                </p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Created</p>
                            <p className="font-medium text-gray-900">
                                {format(new Date(task.created_at), 'MMM dd, yyyy')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};