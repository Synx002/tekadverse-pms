import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { tasksApi } from '../../api/tasks.api';
import { pagesApi } from '../../api/pages.api';
import { usersApi } from '../../api/users.api';
import type { Task, CreateTaskData, UpdateTaskData } from '../../types/task.types';
import type { Page, PageStep } from '../../types/page.types';
import type { User } from '../../types/user.types';
import { useAuthStore } from '../../store/authStore';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../types/project.types';

const taskSchemaBase = z.object({
    project_id: z.number().optional().or(z.literal(0)),
    description: z.string().optional().or(z.literal('')),
    page_id: z.number().min(1, 'Please select a page'),
    step_id: z.number().optional(),
    assigned_to: z.number().min(1, 'Please select an artist'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    deadline: z.string().optional().or(z.literal('')),
    status: z.enum(['todo', 'working', 'finished', 'need_update', 'under_review', 'approved', 'done', 'dropped']).optional(),
});

type TaskFormData = z.infer<typeof taskSchemaBase>;

interface TaskFormModalProps {
    task?: Task | null;
    pageId?: number; // Pre-select page if opened from PageDetail
    onClose: () => void;
    onSuccess: () => void;
}

export const TaskFormModal = ({ task, pageId, onClose, onSuccess }: TaskFormModalProps) => {
    const [loading, setLoading] = useState(false);
    const [pages, setPages] = useState<Page[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [artists, setArtists] = useState<User[]>([]);
    const [availableSteps, setAvailableSteps] = useState<PageStep[]>([]);
    const [fetchingData, setFetchingData] = useState(true);
    const { user } = useAuthStore();
    const isArtist = user?.role === 'artist';

    // Check if task is locked for artist
    const isLocked = isArtist && task && ['need_update', 'under_review', 'approved', 'done'].includes(task.status);

    const isEdit = !!task;
    const taskSchema = taskSchemaBase.refine(
        (data) => isEdit || (data.step_id != null && data.step_id > 0),
        { message: 'Please select a step', path: ['step_id'] }
    );

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
        setValue,
    } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            project_id: 0,
            description: '',
            page_id: pageId || 0,
            step_id: 0,
            assigned_to: 0,
            priority: 'medium',
            deadline: '',
            status: 'todo',
        },
    });

    const watchedProjectId = watch('project_id');
    const watchedPageId = watch('page_id');
    const currentPageId = pageId || watchedPageId || task?.page_id;

    // Filter pages by selected project
    const filteredPages = pages.filter(p => !watchedProjectId || p.project_id === watchedProjectId);

    const loadData = async () => {
        if (isArtist) {
            setFetchingData(false);
            return;
        }

        try {
            setFetchingData(true);
            const [projectsRes, pagesRes, artistsRes] = await Promise.all([
                projectsApi.getAll(),
                pagesApi.getAll(),
                usersApi.getArtists(),
            ]);
            setProjects(projectsRes.data || []);
            setPages(pagesRes.data || []);
            setArtists(artistsRes.data || []);
        } catch (error) {
            toast.error('Failed to load projects or artists');
        } finally {
            setFetchingData(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []); // Only on mount

    useEffect(() => {
        if (task && pages.length > 0) {
            // Find project_id for the task's page
            const taskPage = pages.find(p => p.id === task.page_id);
            reset({
                project_id: taskPage?.project_id || 0,
                description: task.description || '',
                page_id: task.page_id,
                step_id: task.step_id || 0,
                assigned_to: task.assigned_to,
                priority: task.priority,
                deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
                status: task.status,
            });
        }
    }, [task, reset, pages]); // Sync with task ONLY when task OR pages load

    // Handle initial pageId from props
    useEffect(() => {
        if (pageId && pages.length > 0) {
            const page = pages.find(p => p.id === pageId);
            if (page) {
                setValue('project_id', page.project_id);
                setValue('page_id', page.id);
            }
        }
    }, [pageId, pages, setValue]);

    // Reset page_id if project_id changes and current page doesn't belong to project
    useEffect(() => {
        if (watchedProjectId && watchedPageId && !isEdit) { // Only reset if NOT editing (prevent overwrite on load)
            const page = pages.find(p => p.id === watchedPageId);
            if (page && page.project_id !== watchedProjectId) {
                setValue('page_id', 0);
                setValue('step_id', 0);
            }
        }
    }, [watchedProjectId, pages, setValue, watchedPageId, isEdit]);

    // Fetch available steps when page is selected
    useEffect(() => {
        if (!currentPageId || isArtist) {
            setAvailableSteps([]);
            return;
        }
        const loadSteps = async () => {
            try {
                const res = await pagesApi.getAvailableSteps(currentPageId, task?.id);
                setAvailableSteps(res.data || []);
            } catch {
                setAvailableSteps([]);
            }
        };
        loadSteps();
    }, [currentPageId, task?.id, isArtist]);

    const onSubmit = async (data: TaskFormData) => {
        try {
            setLoading(true);

            // Clean up empty strings
            const formattedData = {
                ...data,
                step_id: data.step_id && data.step_id > 0 ? data.step_id : undefined,
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
                    {!isArtist && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Project</label>
                            <select
                                {...register('project_id', { valueAsNumber: true })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                disabled={(!!pageId && !isEdit) || isArtist || isEdit}
                            >
                                <option value={0}>Select Project</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}


                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            disabled={isArtist}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                            placeholder="Task details and requirements..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Page</label>
                            {isArtist ? (
                                <input
                                    value={task?.page_name || 'Current Page'}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                                />
                            ) : (
                                <select
                                    {...register('page_id', { valueAsNumber: true })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                    disabled={(!!pageId && !isEdit) || isArtist || (!watchedProjectId && !isEdit)}
                                >
                                    <option value={0}>Select Page</option>
                                    {filteredPages.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            )}
                            {errors.page_id && <p className="text-xs text-red-500">{errors.page_id.message}</p>}
                        </div>

                        {!isArtist && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Step</label>
                                <select
                                    {...register('step_id', { valueAsNumber: true })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                    disabled={isArtist || (!watchedPageId && !isEdit)}
                                >
                                    <option value={0}>Select Step</option>
                                    {availableSteps.map((s) => (
                                        <option key={s.id} value={s.id!}>
                                            {s.step_number}. {s.step_name}
                                        </option>
                                    ))}
                                </select>
                                {/* {availableSteps.length === 0 && (
                                    <p className="text-xs text-amber-600">
                                        No steps available. Ensure the page has steps defined, and that not all steps are already assigned.
                                    </p>
                                )} */}
                                {errors.step_id && <p className="text-xs text-red-500">{errors.step_id.message}</p>}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Assign To Artist</label>
                            {isArtist ? (
                                <input
                                    value={task?.assigned_to_name || task?.assignee?.name || 'Me'}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                                />
                            ) : (
                                <select
                                    {...register('assigned_to', { valueAsNumber: true })}
                                    disabled={isArtist}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                >
                                    <option value={0}>Select Artist</option>
                                    {artists.map((a) => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            )}
                            {errors.assigned_to && <p className="text-xs text-red-500">{errors.assigned_to.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Priority</label>
                            <select
                                {...register('priority')}
                                disabled={isArtist}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
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
                                    disabled={isArtist}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>
                        </div>

                        {isEdit && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                {isLocked ? (
                                    <input
                                        value={task?.status.replace('_', ' ').toUpperCase()}
                                        disabled
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                                    />
                                ) : (
                                    <select
                                        {...register('status')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="working">Working</option>
                                        <option value="finished">Finished</option>
                                        <option value="need_update">Need Update</option>
                                        <option value="under_review">Under Review</option>
                                        <option value="approved">Approved</option>
                                        <option value="done">Done</option>
                                        <option value="dropped">Dropped</option>
                                    </select>
                                )}
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
