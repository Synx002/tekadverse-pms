import { useEffect, useState } from 'react';
import { Plus, Filter, LayoutGrid, List, FolderOpen, FileText, Layers, UserSearch } from 'lucide-react';
import { toast } from 'sonner';
import { tasksApi } from '../../api/tasks.api';
import { projectsApi } from '../../api/projects.api';
import { pagesApi } from '../../api/pages.api';
import { usersApi } from '../../api/users.api';
import type { Task, TaskStatus } from '../../types/task.types';
import type { Project } from '../../types/project.types';
import type { Page, PageStep } from '../../types/page.types';
import type { User } from '../../types/user.types';
import { TaskBoard } from './TaskBoard';
import { TaskList } from './TaskList';
import { TaskFormModal } from '../../components/tasks/TaskFormModal';
import { TaskRowSkeleton } from '../../components/ui/Skeleton';
import { useAuthStore } from '../../store/authStore';


export const Tasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [pages, setPages] = useState<Page[]>([]);
    const [availableSteps, setAvailableSteps] = useState<PageStep[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [selectedArtistId, setSelectedArtistId] = useState<string>('all');
    const [selectedPageId, setSelectedPageId] = useState<string>('all');
    const [selectedStepId, setSelectedStepId] = useState<string>('all');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        loadTasks();
        loadFilters();
    }, []);

    useEffect(() => {
        if (selectedProjectId !== 'all') {
            loadProjectSteps(Number(selectedProjectId));
        } else {
            setAvailableSteps([]);
        }
    }, [selectedProjectId]);

    const loadProjectSteps = async (projectId: number) => {
        try {
            const response = await projectsApi.getById(projectId);
            setAvailableSteps(response.data?.steps || []);
        } catch (error) {
            console.error('Failed to load project steps', error);
        }
    };

    const loadFilters = async () => {
        try {
            const [projectsRes, pagesRes, usersRes] = await Promise.all([
                projectsApi.getAll(),
                pagesApi.getAll(),
                usersApi.getArtists()
            ]);
            setUsers(usersRes.data || []);
            setProjects(projectsRes.data || []);
            setPages(pagesRes.data || []);
        } catch (error) {
            console.error('Failed to load filters', error);
        }
    };

    const loadTasks = async () => {
        try {
            setLoading(true);
            const response = await tasksApi.getAll();
            setTasks(response.data || []);
        } catch (error) {
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = tasks.filter((task) => {
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

        // Resolve project_id from multiple sources
        const page = pages.find(p => p.id === task.page_id);
        const taskProjectId = task.project?.id || task.page?.project_id || page?.project_id;

        const matchesProject = selectedProjectId === 'all' ||
            taskProjectId === Number(selectedProjectId);

        const matchesPage = selectedPageId === 'all' || task.page_id === Number(selectedPageId);

        const matchesStep = selectedStepId === 'all' ||
            task.step_id === Number(selectedStepId);

        let matchesDate = true;

        if (startDateFilter || endDateFilter) {
            if (!task.created_at) {
                matchesDate = false;
            } else {
                const taskDate = new Date(task.created_at).toISOString().split('T')[0];
                const start = startDateFilter ? startDateFilter : null;
                const end = endDateFilter ? endDateFilter : null;

                if (start && end) {
                    matchesDate = taskDate >= start && taskDate <= end;
                } else if (start) {
                    matchesDate = taskDate >= start;
                } else if (end) {
                    matchesDate = taskDate <= end;
                }
            }
        }

        return matchesStatus && matchesDate && matchesProject && matchesPage && matchesStep;
    });

    const filteredPages = selectedProjectId === 'all'
        ? pages
        : pages.filter(p => p.project_id === Number(selectedProjectId));

    return (
        <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Tasks</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and track all tasks</p>
                </div>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                    <button
                        onClick={() => {
                            setSelectedTask(null);
                            setShowModal(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer w-full sm:w-auto flex-shrink-0 text-sm sm:text-base"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>New Task</span>
                    </button>
                )}
            </div>

            {/* Filters & View Toggle */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Search/Filters Replacement */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {/* Artist Filter */}
                        <div className="relative">
                            <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedArtistId}
                                onChange={(e) => {
                                    setSelectedArtistId(e.target.value);
                                    setSelectedProjectId('all');
                                    setSelectedPageId('all');
                                    setSelectedStepId('all');
                                }}
                                className="w-full pl-9 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white appearance-none cursor-pointer"
                            >
                                <option value="all">All Artists</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Filter className="w-3 h-3 text-gray-400" />
                            </div>
                        </div>

                        {/* Project Filter */}
                        <div className="relative">
                            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedProjectId}
                                onChange={(e) => {
                                    setSelectedProjectId(e.target.value);
                                    setSelectedPageId('all');
                                    setSelectedStepId('all');
                                }}
                                className="w-full pl-9 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white appearance-none cursor-pointer"
                            >
                                <option value="all">All Projects</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Filter className="w-3 h-3 text-gray-400" />
                            </div>
                        </div>

                        {/* Page Filter */}
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedPageId}
                                onChange={(e) => {
                                    setSelectedPageId(e.target.value);
                                    setSelectedStepId('all');
                                }}
                                className="w-full pl-9 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white appearance-none cursor-pointer"
                            >
                                <option value="all">All Pages</option>
                                {filteredPages.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Filter className="w-3 h-3 text-gray-400" />
                            </div>
                        </div>

                        {/* Step Filter */}
                        <div className="relative">
                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedStepId}
                                onChange={(e) => setSelectedStepId(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white appearance-none cursor-pointer"
                                disabled={selectedProjectId === 'all'}
                            >
                                <option value="all">{selectedProjectId === 'all' ? 'Select project first' : 'All Steps'}</option>
                                {availableSteps.map(s => (
                                    <option key={s.id} value={s.id}>{s.step_name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Filter className="w-3 h-3 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        
                        {/* Status Filter */}
                        <div className="flex items-center gap-2 w-full sm:flex-1">
                            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="todo">To Do</option>
                                <option value="work in progress">Work In Progress</option>
                                <option value="finished">Finished</option>
                                <option value="need_update">Need Update</option>
                                <option value="under_review">Under Review</option>
                                <option value="done">Done</option>
                                <option value="approved">Approved</option>
                                <option value="dropped">Dropped</option>
                            </select>
                        </div>

                        {/* Date Filter Range */}
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:flex-[2]">
                            <div className="flex items-center gap-2 w-full">
                                <span className="text-gray-500 text-sm whitespace-nowrap">From:</span>
                                <input
                                    type="date"
                                    value={startDateFilter}
                                    onChange={(e) => setStartDateFilter(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white min-w-0"
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full">
                                <span className="text-gray-500 text-sm whitespace-nowrap">To:</span>
                                <input
                                    type="date"
                                    value={endDateFilter}
                                    onChange={(e) => setEndDateFilter(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white min-w-0"
                                />
                            </div>
                        </div>

                        {/* View Toggle */}
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('board')}
                                className={`flex-1 sm:flex-none px-4 py-2 transition-colors ${viewMode === 'board'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                title="Board View"
                            >
                                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex-1 sm:flex-none px-4 py-2 border-l transition-colors ${viewMode === 'list'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                title="List View"
                            >
                                <List className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tasks View */}
            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-50">
                    {[...Array(8)].map((_, i) => (
                        <TaskRowSkeleton key={i} />
                    ))}
                </div>
            ) : viewMode === 'board' ? (
                <div className="w-full overflow-hidden">
                    <TaskBoard tasks={filteredTasks} onRefresh={loadTasks} />
                </div>
            ) : (
                <div className="w-full">
                    <TaskList tasks={filteredTasks} onRefresh={loadTasks} />
                </div>
            )}

            {showModal && (
                <TaskFormModal
                    task={selectedTask}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        loadTasks();
                    }}
                />
            )}
        </div>
    );
};