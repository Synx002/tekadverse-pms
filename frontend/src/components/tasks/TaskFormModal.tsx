import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { tasksApi } from '../../api/tasks.api';
import { projectsApi } from '../../api/projects.api';
import { usersApi } from '../../api/users.api';
import type { Task, CreateTaskData, UpdateTaskData } from '../../types/task.types';
import type { Project } from '../../types/project.types';
import type { User } from '../../types/user.types';

const taskSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional().or(z.literal('')),
    project_id: z.number().min(1, 'Please select a project'),
    assigned_to: z.number().min(1, 'Please select an artist'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    deadline: z.string().optional().or(z.literal('')),
    status: z.enum(['todo', 'working', 'need_update', 'under_review', 'approved', 'done', 'dropped']).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormModalProps {
    task?: Task | null;
    projectId?: number; // Pre-select project if opened from ProjectDetail
    onClose: () => void;
    onSuccess: () => void;
}

export const TaskFormModal = ({ task, projectId, onClose, onSuccess }: TaskFormModalProps) => {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [artists, setArtists] = useState<User[]>([]);
    const [fetchingData, setFetchingData] = useState(true);

    const isEdit = !!task;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            project_id: projectId || 0,
            assigned_to: 0,
            priority: 'medium',
            deadline: '',
            status: 'todo',
        },
    });

    useEffect(() => {
        loadData();
        if (task) {
            reset({
                title: task.title,
                description: task.description || '',
                project_id: task.project_id,
                assigned_to: task.assigned_to,
                priority: task.priority,
                deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
                status: task.status,
            });
        }
    }, [task, reset]);

    const loadData = async () => {
        try {
            setFetchingData(true);
            const [projectsRes, artistsRes] = await Promise.all([
                projectsApi.getAll(),
                usersApi.getArtists(),
            ]);
            setProjects(projectsRes.data || []);
            setArtists(artistsRes.data || []);
        } catch (error) {
            toast.error('Failed to load projects or artists');
        } finally {
            setFetchingData(false);
        }
    };

    const onSubmit = async (data: TaskFormData) => {
        try {
            setLoading(true);

            // Clean up empty strings
            const formattedData = {
                ...data,
                description: data.description || undefined,
                deadline: data.deadline || undefined,
            };

            if (isEdit && task) {
                await tasksApi.update(task.id, formattedData as UpdateTaskData);
                toast.success('Task updated successfully');
            } else {
                await tasksApi.create(formattedData as CreateTaskData);
                toast.success('Task created successfully');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} task`);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEdit ? 'Edit Task' : 'New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Task Title</label>
                        <input
                            {...register('title')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Design Homepage"
                        />
                        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Task details and requirements..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Project</label>
                            <select
                                {...register('project_id', { valueAsNumber: true })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                disabled={!!projectId && !isEdit}
                            >
                                <option value={0}>Select Project</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {errors.project_id && <p className="text-xs text-red-500">{errors.project_id.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Assign To Artist</label>
                            <select
                                {...register('assigned_to', { valueAsNumber: true })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={0}>Select Artist</option>
                                {artists.map((a) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            {errors.assigned_to && <p className="text-xs text-red-500">{errors.assigned_to.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Priority</label>
                            <select
                                {...register('priority')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                            {errors.priority && <p className="text-xs text-red-500">{errors.priority.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Deadline</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    {...register('deadline')}
                                    type="date"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {isEdit && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <select
                                    {...register('status')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="todo">To Do</option>
                                    <option value="working">Working</option>
                                    <option value="need_update">Need Update</option>
                                    <option value="under_review">Under Review</option>
                                    <option value="approved">Approved</option>
                                    <option value="done">Done</option>
                                    <option value="dropped">Dropped</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Task')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
