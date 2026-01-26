import { useNavigate } from 'react-router-dom';
import type { Task } from '../../types/task.types';
import { Calendar, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { BASE_URL } from '../../api/axios';

interface TaskListProps {
    tasks: Task[];
    onRefresh?: () => void;
}

export const TaskList = ({ tasks }: TaskListProps) => {
    const navigate = useNavigate();

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            todo: 'bg-gray-100 text-gray-800',
            working: 'bg-blue-100 text-blue-800',
            need_update: 'bg-yellow-100 text-yellow-800',
            under_review: 'bg-purple-100 text-purple-800',
            approved: 'bg-green-100 text-green-800',
            done: 'bg-green-100 text-green-800',
            dropped: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: 'text-gray-600',
            medium: 'text-blue-600',
            high: 'text-orange-600',
            urgent: 'text-red-600',
        };
        return colors[priority] || 'text-gray-600';
    };

    if (tasks.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-600">No tasks found</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Task
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Priority
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Assignee
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Deadline
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Comments
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tasks.map((task) => (
                            <tr
                                key={task.id}
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-medium text-gray-900">{task.title}</p>
                                        {task.description && (
                                            <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                                                {task.description}
                                            </p>
                                        )}
                                        {task.project && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                {task.project.name}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                                        {task.priority.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {task.assignee && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                                                {task.assignee.profile_picture ? (
                                                    <img src={`${BASE_URL}/${task.assignee.profile_picture}`} alt={task.assignee.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    task.assignee.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-900">{task.assignee.name}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {task.deadline ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            {format(new Date(task.deadline), 'MMM dd, yyyy')}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400">No deadline</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {task.comments_count !== undefined && task.comments_count > 0 ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MessageSquare className="w-4 h-4" />
                                            {task.comments_count}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400">0</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};