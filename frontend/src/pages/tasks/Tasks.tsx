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
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-gray-600 mt-1">Manage and track all tasks</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedTask(null);
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                    <Plus className="w-5 h-5" />
                    New Task
                </button>
            </div>

            {/* Filters & View Toggle */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="todo">To Do</option>
                            <option value="working">Working</option>
                            <option value="need_update">Need Update</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="done">Done</option>
                            <option value="dropped">Dropped</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>

                        <div className="flex border border-gray-300 rounded-lg">
                            <button
                                onClick={() => setViewMode('board')}
                                className={`px-3 py-2 ${viewMode === 'board' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 border-l ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tasks View */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : viewMode === 'board' ? (
                <TaskBoard tasks={filteredTasks} onRefresh={loadTasks} />
            ) : (
                <TaskList tasks={filteredTasks} onRefresh={loadTasks} />
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
