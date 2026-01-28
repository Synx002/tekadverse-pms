import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task, TaskStatus } from '../../types/task.types';
import { Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { tasksApi } from '../../api/tasks.api';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';

interface TaskBoardProps {
    tasks: Task[];
    onRefresh?: () => void;
}

const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { status: 'working', title: 'Working', color: 'bg-blue-100' },
    { status: 'finished', title: 'Finished', color: 'bg-indigo-100' },
    { status: 'need_update', title: 'Need Update', color: 'bg-yellow-100' },
    { status: 'under_review', title: 'Under Review', color: 'bg-purple-100' },
    { status: 'approved', title: 'Approved', color: 'bg-green-100' },
    { status: 'done', title: 'Done', color: 'bg-green-100' },
];

export const TaskBoard = ({ tasks, onRefresh }: TaskBoardProps) => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [collapsedStatuses, setCollapsedStatuses] = useState<TaskStatus[]>([]);

    const toggleColumn = (status: TaskStatus) => {
        setCollapsedStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const getTasksByStatus = (status: TaskStatus) => {
        return tasks.filter(task => task.status === status);
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: 'border-l-gray-400',
            medium: 'border-l-blue-400',
            high: 'border-l-orange-400',
            urgent: 'border-l-red-400',
        };
        return colors[priority] || 'border-l-gray-400';
    };

    const handleDragStart = (e: React.DragEvent, taskId: number) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
        e.preventDefault();

        if (!draggedTaskId) return;

        const task = tasks.find(t => t.id === draggedTaskId);
        if (!task || task.status === newStatus) return;

        try {
            await tasksApi.updateStatus(draggedTaskId, newStatus);
            toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
            onRefresh?.();
        } catch (error) {
            toast.error('Failed to update task status');
        } finally {
            setDraggedTaskId(null);
        }
    };

    return (
        <div className="w-full">
            {/* Mobile View - Stack Layout */}
            <div className="block lg:hidden space-y-4">
                {columns.map((column) => {
                    const columnTasks = getTasksByStatus(column.status);
                    const isCollapsed = collapsedStatuses.includes(column.status);

                    return (
                        <div
                            key={column.status}
                            className="w-full"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.status)}
                        >
                            <div className={`${column.color} rounded-lg overflow-hidden`}>
                                {/* Mobile Header */}
                                <button
                                    onClick={() => toggleColumn(column.status)}
                                    className="w-full p-4 flex items-center justify-between font-semibold text-gray-700 bg-opacity-50 hover:bg-black/5 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {isCollapsed ? (
                                            <ChevronRight className="w-5 h-5" />
                                        ) : (
                                            <ChevronLeft className="w-5 h-5" />
                                        )}
                                        <span className="text-base">{column.title}</span>
                                    </div>
                                    <span className="bg-white/60 px-3 py-1 rounded-full text-sm font-bold">
                                        {columnTasks.length}
                                    </span>
                                </button>

                                {/* Mobile Content */}
                                {!isCollapsed && (
                                    <div className="p-3 space-y-3">
                                        {columnTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                onClick={() => navigate(`/tasks/${task.id}`)}
                                                className={`bg-white rounded-lg p-4 shadow-sm active:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(task.priority)}`}
                                            >
                                                <h4 className="font-medium text-gray-900 mb-2 border-b border-gray-200 pb-2">{task.project_name}</h4>
                                                <h4 className="font-regular text-gray-900 mb-2 text-base">{task.title}</h4>


                                                {task.description && (
                                                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}

                                                <div className="space-y-2">
                                                    {task.assignee && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <User className="w-4 h-4" />
                                                            <span>{task.assignee.name}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between">
                                                        {task.deadline && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                <Calendar className="w-4 h-4" />
                                                                <span>{format(new Date(task.deadline), 'MMM dd')}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2 ml-auto">
                                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                                {task.priority}
                                                            </span>
                                                            {task.comments_count !== undefined && task.comments_count > 0 && (
                                                                <span className="text-sm text-gray-400 flex items-center gap-1">
                                                                    <span>💬</span> {task.comments_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {columnTasks.length === 0 && (
                                            <div className="text-center text-gray-400 py-8">
                                                <p className="text-sm">No tasks</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop View - Horizontal Scroll */}
            <div className="hidden lg:block overflow-x-auto pb-4">
                <div className="inline-flex gap-4 min-w-full h-full min-h-[600px]">
                    {columns.map((column) => {
                        const columnTasks = getTasksByStatus(column.status);
                        const isCollapsed = collapsedStatuses.includes(column.status);

                        return (
                            <div
                                key={column.status}
                                className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-80'
                                    }`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column.status)}
                            >
                                <div className={`${column.color} rounded-lg h-full flex flex-col overflow-hidden text-sm`}>
                                    {/* Desktop Header */}
                                    <div className={`p-3 flex ${isCollapsed ? 'flex-col justify-center gap-4 py-4' : 'items-center justify-between'
                                        } font-semibold text-gray-700 bg-opacity-50`}>
                                        <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col-reverse' : ''}`}>
                                            <button
                                                onClick={() => toggleColumn(column.status)}
                                                className="p-1 hover:bg-black/5 rounded-md transition-colors focus:outline-none"
                                                title={isCollapsed ? "Expand column" : "Collapse column"}
                                            >
                                                {isCollapsed ? (
                                                    <ChevronRight className="w-4 h-4" />
                                                ) : (
                                                    <ChevronLeft className="w-4 h-4" />
                                                )}
                                            </button>

                                            {isCollapsed ? (
                                                <div className="writing-vertical-rl transform rotate-180 whitespace-nowrap py-2 tracking-wide uppercase text-xs">
                                                    {column.title}
                                                </div>
                                            ) : (
                                                <span>{column.title}</span>
                                            )}
                                        </div>

                                        <span className={`bg-white/60 px-2 py-0.5 rounded-full text-xs font-bold ${isCollapsed ? 'mb-2' : ''
                                            }`}>
                                            {columnTasks.length}
                                        </span>
                                    </div>

                                    {/* Desktop Content */}
                                    {!isCollapsed && (
                                        <div className="flex-1 p-3 overflow-y-auto min-h-[500px] space-y-3">
                                            {columnTasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                                    draggable={!(user?.role === 'artist' && ['need_update', 'under_review', 'approved', 'done'].includes(task.status))}
                                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                                    className={`bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(task.priority)} ${draggedTaskId === task.id ? 'opacity-50' : ''
                                                        } ${user?.role === 'artist' && ['need_update', 'under_review', 'approved', 'done'].includes(task.status)
                                                            ? 'cursor-default hover:shadow-none bg-gray-50'
                                                            : ''
                                                        }`}
                                                >
                                                    <h4 className="font-medium text-gray-900 mb-2 border-b border-gray-200 pb-2">{task.project_name}</h4>
                                                    <h4 className="font-regular text-gray-900 mb-2">{task.title}</h4>
                                                    {task.description && (
                                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                                            {task.description}
                                                        </p>
                                                    )}

                                                    <div className="space-y-2">
                                                        {task.assignee && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <User className="w-3 h-3" />
                                                                <span>{task.assignee.name}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between">
                                                            {task.deadline && (
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <span>{format(new Date(task.deadline), 'MMM dd')}</span>
                                                                </div>
                                                            )}

                                                            <div className="flex items-center gap-2 ml-auto">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                                    {task.priority}
                                                                </span>
                                                                {task.comments_count !== undefined && task.comments_count > 0 && (
                                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                        <span>💬</span> {task.comments_count}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {columnTasks.length === 0 && (
                                                <div className="text-center text-gray-400 py-8">
                                                    <p className="text-sm">No tasks</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isCollapsed && (
                                        <div className="bg-gray-50/50 flex-1 w-full"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};