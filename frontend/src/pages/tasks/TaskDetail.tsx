import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { tasksApi } from '../../api/tasks.api';
import { commentsApi } from '../../api/comments.api';
import type { Task } from '../../types/task.types';
import type { Comment } from '../../types/comment.types';
import { format } from 'date-fns';
import { BASE_URL } from '../../api/axios';
import { TaskFormModal } from '../../components/tasks/TaskFormModal';
import { useAuthStore } from '../../store/authStore';

export const TaskDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [task, setTask] = useState<Task | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
            console.error('Error loading task detail:', error);
            toast.error('Failed to load task details');
            navigate('/tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!task || !window.confirm('Are you sure you want to delete this task?')) return;

        try {
            await tasksApi.delete(task.id);
            toast.success('Task deleted successfully');
            navigate('/tasks');
        } catch (error) {
            toast.error('Failed to delete task');
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
            'work in progress': 'bg-blue-100 text-blue-800',
            finished: 'bg-indigo-100 text-indigo-800',
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
        <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
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
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        {/* Top Banner */}
                        <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                        <div className="p-6">
                            {/* Project Name Badge */}
                            <div className="mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    {task.project?.name || task.project_name}
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                <div className="flex-1">
                                    <h1 className="text-lg font-semibold text-gray-900 mb-4">
                                        Task Details
                                    </h1>

                                    {/* Task Attributes Grid */}
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                        {/* Status */}
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</p>
                                            <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${getStatusColor(task.status)}`}>
                                                {task.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Priority */}
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Priority</p>
                                            <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-white shadow-sm  ${getPriorityColor(task.priority).replace('text-', 'border-')}`}>
                                                <span className={getPriorityColor(task.priority)}>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                            </span>
                                        </div>

                                        {/* Page Name */}
                                        {task.page_name && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Page</p>
                                                <p className="text-sm font-medium text-gray-900">{task.page_name}</p>
                                            </div>
                                        )}

                                        {/* Step Name */}
                                        {task.step_name && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Step</p>
                                                <p className="text-sm font-medium text-gray-900">{task.step_name}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    {user?.role !== 'artist' && (
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="group relative px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-500 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            <span className="font-medium">Edit</span>
                                        </button>
                                    )}

                                    {user?.role !== 'artist' && (
                                        <button
                                            onClick={handleDelete}
                                            className="group relative px-4 py-2 bg-white border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="font-medium">Delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            {task.description && (
                                <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Description</p>
                                    <div className="prose max-w-none">
                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{task.description}</p>
                                    </div>
                                </div>
                            )}
                        </div>
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
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-500 text-white flex items-center justify-center font-medium flex-shrink-0">
                                        {comment.profile_picture ? (
                                            <img src={`${BASE_URL}/${comment.profile_picture}`} alt={comment.user_name} className="w-full h-full object-cover" />
                                        ) : (
                                            (comment.user_name || 'U').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">{comment.user_name}</span>
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
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
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
                            <p className="font-medium text-gray-900">{task.assigned_to_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Assigned By</p>
                            <p className="font-medium text-gray-900">{task.assigned_by_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Project</p>
                            <p className="font-medium text-gray-900">{task.project_name || task.project?.name}</p>
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

            {
                isEditModalOpen && (
                    <TaskFormModal
                        task={task}
                        onClose={() => setIsEditModalOpen(false)}
                        onSuccess={() => {
                            setIsEditModalOpen(false);
                            loadTaskDetail();
                        }}
                    />
                )
            }
        </div >
    );
};