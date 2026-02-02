import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, Calendar, Clock, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { pagesApi } from '../../api/pages.api';
import { tasksApi } from '../../api/tasks.api';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { PageFormModal } from './PageFormModal';
import type { Page } from '../../types/page.types';
import type { Task } from '../../types/task.types';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

export const PageDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [page, setPage] = useState<Page | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (id) {
            loadPageDetail();
        }
    }, [id]);

    const loadPageDetail = async () => {
        try {
            setLoading(true);
            const data = await pagesApi.getById(Number(id));
            setPage(data.data ?? null);

            // Assuming the backend returns tasks within the page detail
            if (data.data?.tasks) {
                setTasks(data.data.tasks);
            } else {
                // Fallback to fetching tasks separately
                const tasksRes = await tasksApi.getAll({ page_id: Number(id) });
                setTasks(tasksRes.data ?? []);
            }
        } catch (error) {
            toast.error('Failed to load page details');
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!page || !window.confirm('Are you sure you want to delete this page? All tasks will be lost.')) return;

        try {
            await pagesApi.delete(page.id);
            toast.success('Page deleted successfully');
            navigate(`/projects/${page.project_id}`);
        } catch (error) {
            toast.error('Failed to delete page');
        }
    };



    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!page) {
        return null;
    }

    const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'approved').length;
    const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/projects/${page.project_id}`)}
                        className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900">{page.name}</h1>
                        </div>
                        <p className="text-sm text-gray-500">Project: {page.project_name}</p>
                    </div>
                </div>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">


                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
                            {(user?.role === 'admin' || user?.role === 'manager') && (
                                <button
                                    onClick={() => setShowTaskModal(true)}
                                    disabled={!page.steps?.length || tasks.length >= (page.steps?.length ?? 0)}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-sm">Add Task</span>
                                </button>
                            )}
                        </div>
                        <div className="divide-y divide-gray-200">
                            {tasks.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>No tasks assigned to this page yet.</p>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => navigate(`/tasks/${task.id}`)}
                                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium text-gray-900">{task.title}</h3>
                                            {(task.step_number != null || task.step_name) && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                                    Step {task.step_number ?? ''} {task.step_name ? `- ${task.step_name}` : ''}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600 font-medium">
                                                    {task.assigned_to_name || 'Unassigned'}
                                                </div>
                                                {task.deadline && (
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(task.deadline), 'MMM dd')}
                                                    </div>
                                                )}
                                            </div>
                                            {(task.step_price ?? 0) > 0 && (user?.role === 'admin' || user?.role === 'manager') && (
                                                <span className="text-xs font-medium text-green-600">
                                                    Rp {(task.step_price ?? 0).toLocaleString('id-ID')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Progress</h2>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            {completedTasks} of {tasks.length} tasks completed ({Math.round(progress)}%)
                        </p>
                    </div>

                    {/* Steps Section */}
                    {page.steps && page.steps.length > 0 && (
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Steps</h2>
                            <div className="space-y-2">
                                {page.steps.map((step) => (
                                    <div
                                        key={step.id}
                                        className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="flex items-center justify-center w-6 h-6 flex-shrink-0 bg-blue-600 text-white text-xs font-bold rounded-full">
                                                {step.step_number}
                                            </div>
                                            <span className="text-sm text-gray-700 truncate">{step.step_name}</span>
                                        </div>
                                        {(step.price ?? 0) > 0 && (user?.role === 'admin' || user?.role === 'manager') && (
                                            <span className="text-sm font-medium text-green-600 whitespace-nowrap">
                                                Rp {(step.price ?? 0).toLocaleString('id-ID')}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Total Cost - for manager/admin */}
                    {(user?.role === 'admin' || user?.role === 'manager') && page.steps && page.steps.length > 0 && (
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <Banknote className="w-4 h-4" />
                                Budget & Pembayaran
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Total Budget (semua step)</span>
                                    <span className="font-semibold text-gray-900">
                                        Rp {Math.round(
                                            page.steps.reduce((sum, s) => sum + (Number(s.price) || 0), 0)
                                        ).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                    <span className="text-sm text-gray-600">Yang sudah diselesaikan</span>
                                    <span className="font-semibold text-green-600">
                                        Rp {Math.round(
                                            tasks
                                                .filter(t => ['done', 'approved'].includes(t.status) && (Number(t.step_price) || 0) > 0)
                                                .reduce((sum, t) => sum + (Number(t.step_price) || 0), 0)
                                        ).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {showTaskModal && (
                <TaskFormModal
                    pageId={Number(id)}
                    onClose={() => setShowTaskModal(false)}
                    onSuccess={() => {
                        setShowTaskModal(false);
                        loadPageDetail();
                    }}
                />
            )}

            {showEditModal && (
                <PageFormModal
                    projectId={page.project_id}
                    page={page}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false);
                        loadPageDetail();
                    }}
                />
            )}
        </div>
    );
};
