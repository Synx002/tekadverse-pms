import { useEffect, useState } from 'react';
import { Plus, Search, Filter, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { tasksApi } from '../../api/tasks.api';
import type { Task, TaskStatus, TaskPriority } from '../../types/task.types';
import { TaskBoard } from './TaskBoard';
import { TaskList } from './TaskList';
import { TaskFormModal } from '../../components/tasks/TaskFormModal';

export const Tasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        loadTasks();
    }, []);

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
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        return matchesStatus && matchesPriority;
    });

    return (
        <div className="space-y-4 sm:space-y-6 w-full px-2 sm:px-4 lg:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Tasks</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and track all tasks</p>
                </div>
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
            </div>

            {/* Filters & View Toggle */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Search Bar */}
                    <div className="w-full relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
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
                                <option value="working">Working</option>
                                <option value="finished">Finished</option>
                                <option value="need_update">Need Update</option>
                                <option value="under_review">Under Review</option>
                                <option value="done">Done</option>
                                <option value="approved">Approved</option>
                                <option value="dropped">Dropped</option>
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
                            className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
                        >
                            <option value="all">All Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>

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
                <div className="flex items-center justify-center h-64 sm:h-96">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : viewMode === 'board' ? (
                <div className="w-full -mx-2 sm:mx-0">
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