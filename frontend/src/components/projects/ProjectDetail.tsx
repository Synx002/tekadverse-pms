import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { projectsApi } from '../../api/projects.api';
import { tasksApi } from '../../api/tasks.api';
import { TaskFormModal } from '../tasks/TaskFormModal';
import type { Project } from '../../types/project.types';
import type { Task } from '../../types/task.types';
import { format } from 'date-fns';

export const ProjectDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);

    useEffect(() => {
        if (id) {
            loadProjectDetail();
        }
    }, [id]);

    const loadProjectDetail = async () => {
        try {
            setLoading(true);
            const [projectRes, tasksRes] = await Promise.all([
                projectsApi.getById(Number(id)),
                tasksApi.getAll({ project_id: Number(id) }),
            ]);
            setProject(projectRes.data ?? null);
            setTasks(tasksRes.data ?? []);
        } catch (error) {
            toast.error('Failed to load project details');
            navigate('/projects');
        } finally {
            setLoading(false);
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

    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

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
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                                {project.status.replace('_', ' ')}
                            </span>
                        </div>
                        {project.description && (
                            <p className="text-gray-600">{project.description}</p>
                        )}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <p className="text-sm text-gray-600">Client</p>
                        <p className="font-medium text-gray-900">{project.client?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Start Date</p>
                        <p className="font-medium text-gray-900">
                            {project.start_date ? format(new Date(project.start_date), 'MMM dd, yyyy') : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">End Date</p>
                        <p className="font-medium text-gray-900">
                            {project.end_date ? format(new Date(project.end_date), 'MMM dd, yyyy') : 'N/A'}
                        </p>
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
                        {completedTasks} of {tasks.length} tasks completed
                    </p>
                </div>
            </div>

            {/* Tasks Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                        <Plus className="w-5 h-5" />
                        Add Task
                    </button>
                </div>

                <div className="divide-y divide-gray-200">
                    {tasks.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>No tasks yet</p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                className="p-4 hover:bg-gray-50 cursor-pointer"
                            >
                                <h3 className="font-medium text-gray-900">{task.title}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                        {task.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs text-gray-600">
                                        {task.assignee?.name}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showTaskModal && (
                <TaskFormModal
                    projectId={Number(id)}
                    onClose={() => setShowTaskModal(false)}
                    onSuccess={() => {
                        setShowTaskModal(false);
                        loadProjectDetail();
                    }}
                />
            )}
        </div>
    );
};