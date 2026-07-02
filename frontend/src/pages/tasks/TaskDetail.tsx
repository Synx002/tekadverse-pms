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
import { DeleteTaskModal } from '../../components/tasks/DeleteTaskModal';

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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

    // const handleDelete = async () => {
    //     if (!task || !window.confirm('Are you sure you want to delete this task?')) return;

    //     try {
    //         await tasksApi.delete(task.id);
    //         toast.success('Task deleted successfully');
    //         navigate('/tasks');
    //     } catch (error) {
    //         toast.error('Failed to delete task');
    //     }
    // };

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
                    <div className="bg-white rounded-xl border border-gray-200">
                        <div className="p-6">
                            {/* Project Name Badge */}
                            <div className="flex items-center justify-between mb-5">
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                    {task.project?.name || task.project_name}
                                </span>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        Edit
                                    </button>

                                    {user?.role !== 'artist' && (
                                        <button
                                            onClick={() => setIsDeleteModalOpen(true)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>

                            <h1 className="text-xl font-semibold text-gray-900 mb-6">
                                {task.step_name || 'Task'}
                            </h1>

                            {/* Task Attributes Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 pb-6 border-b border-gray-100">
                                {/* Status */}
                                <div>
                                    <p className="text-xs text-gray-500 mb-1.5">Status</p>
                                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(task.status)}`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Priority */}
                                <div>
                                    <p className="text-xs text-gray-500 mb-1.5">Priority</p>
                                    <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                </div>

                                {/* Price */}
                                <div>
                                    <p className="text-xs text-gray-500 mb-1.5">Price</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {task.price != null
                                            ? new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 0,
                                            }).format(task.price)
                                            : '—'}
                                    </p>
                                </div>

                                {/* Page Name */}
                                {task.page_name && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1.5">Page</p>
                                        <p className="text-sm font-medium text-gray-900">{task.page_name}</p>
                                    </div>
                                )}

                                {/* Step Name */}
                                {task.step_name && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1.5">Step</p>
                                        <p className="text-sm font-medium text-gray-900">{task.step_name}</p>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {task.description && (
                                <div className="pt-5">
                                    <p className="text-xs text-gray-500 mb-2">Description</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {task.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            Comments
                            <span className="text-gray-400 font-normal">({comments.length})</span>
                        </h2>

                        <div className="space-y-4 mb-5">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-medium shrink-0">
                                        {comment.profile_picture ? (
                                            <img src={`${BASE_URL}/${comment.profile_picture}`} alt={comment.user_name} className="w-full h-full object-cover" />
                                        ) : (
                                            (comment.user_name || 'U').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-medium text-gray-900">{comment.user_name}</span>
                                            <span className="text-xs text-gray-400">
                                                {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{comment.comment}</p>
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
                                className="flex-1 px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                            />
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="px-3.5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-5 h-4" />
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
            {
                isDeleteModalOpen && (
                    <DeleteTaskModal
                        task={task}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onSuccess={() => {
                            setIsDeleteModalOpen(false);
                            navigate('/tasks');
                        }}
                    />
                )
            }
        </div >
    );
};