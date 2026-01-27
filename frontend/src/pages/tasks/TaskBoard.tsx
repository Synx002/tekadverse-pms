import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task, TaskStatus } from '../../types/task.types';
import { Calendar, User } from 'lucide-react';
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
        // Set drag ghost effect
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
        <div className="overflow-x-auto">
            <div className="inline-flex gap-4 min-w-full">
                {columns.map((column) => {
                    const columnTasks = getTasksByStatus(column.status);

                    return (
                        <div
                            key={column.status}
                            className="flex-shrink-0 w-80"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.status)}
                        >
                            <div className={`${column.color} rounded-t-lg px-4 py-3`}>
                                <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                                    {column.title}
                                    <span className="text-sm bg-white px-2 py-1 rounded-full">
                                        {columnTasks.length}
                                    </span>
                                </h3>
                            </div>

                            <div className="bg-gray-50 rounded-b-lg p-4 min-h-[500px] space-y-3 transition-colors duration-200">
                                {columnTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => navigate(`/tasks/${task.id}`)}
                                        draggable={!(user?.role === 'artist' && ['need_update', 'under_review', 'approved', 'done'].includes(task.status))}
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(task.priority)} ${draggedTaskId === task.id ? 'opacity-50' : ''} ${user?.role === 'artist' && ['need_update', 'under_review', 'approved', 'done'].includes(task.status) ? 'cursor-default hover:shadow-none bg-gray-50' : ''}`}
                                    >
                                        <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                                        {task.description && (
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                {task.description}
                                            </p>
                                        )}

                                        <div className="space-y-2">
                                            {task.assignee && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <User className="w-4 h-4" />
                                                    <span>{task.assignee.name}</span>
                                                </div>
                                            )}

                                            {task.deadline && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{format(new Date(task.deadline), 'MMM dd')}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-500 uppercase">
                                                    {task.priority}
                                                </span>
                                                {task.comments_count !== undefined && task.comments_count > 0 && (
                                                    <span className="text-xs text-gray-500">
                                                        💬 {task.comments_count}
                                                    </span>
                                                )}
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
                        </div>
                    );
                })}
            </div>
        </div>
    );
};