import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { projectsApi } from '../../api/projects.api';
import { pagesApi } from '../../api/pages.api';
import { clientsApi } from '../../api/clients.api';
import { PageFormModal } from '../pages/PageFormModal';
import { ProjectFormModal } from './ProjectFormModal';
import type { Project } from '../../types/project.types';
import type { Page } from '../../types/page.types';
import type { Client } from '../../types/client.types';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

export const ProjectDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [project, setProject] = useState<Project | null>(null);
    const [pages, setPages] = useState<Page[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPageModal, setShowPageModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (id) {
            loadProjectDetail();
            loadClients();
        }
    }, [id]);

    const loadClients = async () => {
        try {
            const response = await clientsApi.getAll();
            setClients(response.data || []);
        } catch (error) {
            console.error('Failed to load clients');
        }
    };

    const loadProjectDetail = async () => {
        try {
            setLoading(true);
            const [projectRes, pagesRes] = await Promise.all([
                projectsApi.getById(Number(id)),
                pagesApi.getAll({ project_id: Number(id) }),
            ]);
            setProject(projectRes.data ?? null);
            setPages(pagesRes.data ?? []);
        } catch (error) {
            toast.error('Failed to load project details');
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!window.confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
            return;
        }

        try {
            await projectsApi.delete(Number(id));
            toast.success('Project deleted successfully');
            navigate('/projects');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete project');
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            planning: 'bg-gray-100 text-gray-800',
            active: 'bg-blue-100 text-blue-800',
            on_hold: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!project) {
        return null;
    }

    const totalTasks = pages.reduce((sum, p) => sum + (p.tasks_count || 0), 0);
    const completedTasksCount = pages.reduce((sum, p) => sum + (p.tasks_completed || 0), 0);
    const progress = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Back button */}
            <button
                onClick={() => navigate('/projects')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Projects
            </button>

            {/* Project Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                                {project.status.replace('_', ' ')}
                            </span>
                        </div>

                    </div>
                    <div className="flex gap-2">
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                            <>
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                {user?.role === 'admin' && (
                                    <button
                                        onClick={handleDeleteProject}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <p className="text-sm text-gray-600">Client</p>
                        <p className="font-medium text-gray-900">{project.client_name || project.client?.name || 'N/A'}</p>
                    </div>
                </div>

                {/* Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        {completedTasksCount} of {totalTasks} tasks completed across all pages
                    </p>
                </div>
            </div>

            {/* Pages Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Pages</h2>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <button
                            onClick={() => setShowPageModal(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            <Plus className="w-5 h-5" />
                            Add Page
                        </button>
                    )}
                </div>

                <div className="divide-y divide-gray-200">
                    {pages.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>No pages yet</p>
                        </div>
                    ) : (
                        pages.map((page) => (
                            <div
                                key={page.id}
                                onClick={() => navigate(`/pages/${page.id}`)}
                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-gray-900">{page.name}</h3>

                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <span className="font-medium">{page.tasks_count || 0} Tasks</span>
                                        <span className="text-gray-400">({page.tasks_completed || 0} done)</span>
                                    </div>

                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showPageModal && (
                <PageFormModal
                    projectId={Number(id)}
                    onClose={() => setShowPageModal(false)}
                    onSuccess={() => {
                        setShowPageModal(false);
                        loadProjectDetail();
                    }}
                />
            )}

            {showEditModal && (
                <ProjectFormModal
                    project={project}
                    clients={clients}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false);
                        loadProjectDetail();
                    }}
                />
            )}
        </div>
    );
};