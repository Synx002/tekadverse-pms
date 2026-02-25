import { useState, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task, TaskStatus } from '../../types/task.types';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { tasksApi } from '../../api/tasks.api';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { MarkAsDoneModal } from '../../components/tasks/MarkAsDoneModal';

interface TaskBoardProps {
    tasks: Task[];
    onRefresh?: () => void;
}

const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { status: 'work in progress', title: 'Work In Progress', color: 'bg-blue-100' },
    { status: 'finished', title: 'Finished', color: 'bg-indigo-100' },
    { status: 'under_review', title: 'Under Review', color: 'bg-purple-100' },
    { status: 'need_update', title: 'Need Update', color: 'bg-yellow-100' },
    { status: 'approved', title: 'Approved', color: 'bg-green-100' },
    { status: 'done', title: 'Done', color: 'bg-green-100' },
];

export const TaskBoard = ({ tasks, onRefresh }: TaskBoardProps) => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [collapsedStatuses, setCollapsedStatuses] = useState<TaskStatus[]>([]);
    const [doneTask, setDoneTask] = useState<Task | null>(null);

    const scrollRef = useRef<HTMLDivElement | null>(null);

    const handleScroll = () => {
        if (scrollRef.current) {
            sessionStorage.setItem(
                'taskboard-scroll-x',
                scrollRef.current.scrollLeft.toString()
            );
        }
    };

    useLayoutEffect(() => {
        const savedScroll = sessionStorage.getItem('taskboard-scroll-x');
        if (savedScroll && scrollRef.current) {
            scrollRef.current.scrollLeft = parseInt(savedScroll, 10);
        }
    }, []);

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

        if (newStatus === 'done') {
            setDoneTask(task);
            setDraggedTaskId(null);
            return;
        }

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
                                                <div className="mb-2">
                                                    <h4 className="font-bold text-gray-900 leading-tight">{task.project?.name || task.project_name}</h4>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-sm">
                                                        <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{task.page?.name || task.page_name || 'No Page'}</span>
                                                        {task.step_name && (
                                                            <>
                                                                <span className="text-gray-300">/</span>
                                                                <span className="text-blue-600 font-medium">{task.step_name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {task.description && (
                                                    <div className="mb-3">
                                                        <p className="text-sm text-gray-500 line-clamp-2">
                                                            {task.description}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                    {task.deadline ? (
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{format(new Date(task.deadline), 'MMM dd')}</span>
                                                        </div>
                                                    ) : (
                                                        <div />
                                                    )}

                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${task.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-200' :
                                                        task.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                            task.priority === 'medium' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                                'bg-gray-50 text-gray-600 border-gray-200'
                                                        }`}>
                                                        {task.priority}
                                                    </span>
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

            {/* Desktop View - Internal Horizontal Scroll */}
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="hidden lg:block overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            >
                <div className="flex gap-4 min-w-full w-fit">
                    {columns.map((column) => {
                        const columnTasks = getTasksByStatus(column.status);

                        return (
                            <div
                                key={column.status}
                                className="w-80 flex-shrink-0"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column.status)}
                            >
                                <div className={`${column.color} rounded-lg h-full flex flex-col overflow-hidden text-sm border border-gray-200/50`}>
                                    {/* Desktop Header */}
                                    <div className="p-3 flex items-center justify-between font-semibold text-gray-700 bg-opacity-50">
                                        <div className="flex items-center gap-2">
                                            <span>{column.title}</span>
                                        </div>

                                        <span className="bg-white/60 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {columnTasks.length}
                                        </span>
                                    </div>

                                    {/* Desktop Content */}
                                    <div className="flex-1 p-3 overflow-y-auto min-h-[500px] space-y-3">
                                        {columnTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                onClick={() => navigate(`/tasks/${task.id}`)}
                                                draggable={
                                                    task.status !== 'done' && 
                                                    !(user?.role === 'artist' && ['under_review', 'approved'].includes(task.status))
                                                }
                                                onDragStart={(e) => handleDragStart(e, task.id)}
                                                className={`bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(task.priority)} ${draggedTaskId === task.id ? 'opacity-50' : ''
                                                    } ${task.status === 'done' || (user?.role === 'artist' && ['under_review', 'approved'].includes(task.status))
                                                        ? 'cursor-default hover:shadow-none bg-gray-50'
                                                        : ''
                                                    } `}
                                            >
                                                <div className="mb-2">
                                                    <h4 className="font-bold text-gray-900 text-sm leading-tight">{task.project?.name || task.project_name}</h4>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                                                        <span className="font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{task.page?.name || task.page_name || 'No Page'}</span>
                                                        {task.step_name && (
                                                            <>
                                                                <span className="text-gray-300">/</span>
                                                                <span className="text-blue-600 font-medium">{task.step_name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {task.assigned_to_name && (
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1 mb-2 text-xs">
                                                        <span className="font-semibold text-gray-700 bg-green-100 px-1.5 py-0.5 rounded">{task.assigned_to_name}</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                    {task.deadline ? (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{format(new Date(task.deadline), 'MMM dd')}</span>
                                                        </div>
                                                    ) : (
                                                        <div />
                                                    )}

                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${task.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-200' :
                                                        task.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                            task.priority === 'medium' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                                'bg-gray-50 text-gray-600 border-gray-200'
                                                        }`}>
                                                        {task.priority}
                                                    </span>
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
                            </div>
                        );
                    })}
                </div>
            </div>
            {doneTask && (
            <MarkAsDoneModal
                task={doneTask}
                onClose={() => setDoneTask(null)}
                onSuccess={() => {
                setDoneTask(null);
                onRefresh?.();
                }}
            />
            )}
        </div>
    );
};