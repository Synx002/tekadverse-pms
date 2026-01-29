import { useNavigate } from 'react-router-dom';
import { CheckSquare, Clock, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { Task } from '../../../types/task.types';
import type { User } from '../../../types/user.types';

interface ArtistDashboardProps {
    user: User | null;
    tasks: Task[];
    loading: boolean;
}

export const ArtistDashboard = ({ user, tasks, loading }: ArtistDashboardProps) => {
    const navigate = useNavigate();

    const myTasks = tasks.filter(t => t.assigned_to === user?.id);
    const activeTasks = myTasks.filter(t => !['done', 'approved', 'dropped'].includes(t.status));
    const completedTasks = myTasks.filter(t => ['done', 'approved'].includes(t.status));
    const urgentTasks = activeTasks.filter(t => t.priority === 'urgent');

    const stats = [
        {
            title: 'My Active Tasks',
            value: activeTasks.length,
            icon: Clock,
            color: 'bg-blue-500',
            subtitle: 'Currently working on'
        },
        {
            title: 'Completed',
            value: completedTasks.length,
            icon: CheckSquare,
            color: 'bg-green-500',
            subtitle: 'Lifetime total'
        },
        {
            title: 'Urgent',
            value: urgentTasks.length,
            icon: AlertCircle,
            color: 'bg-red-500',
            subtitle: 'Needs immediate focus'
        }
    ];

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            todo: 'bg-gray-100 text-gray-800',
            working: 'bg-blue-100 text-blue-800',
            finished: 'bg-indigo-100 text-indigo-800',
            need_update: 'bg-yellow-100 text-yellow-800',
            under_review: 'bg-purple-100 text-purple-800',
            approved: 'bg-green-100 text-green-800',
            done: 'bg-green-100 text-green-800',
            dropped: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) return null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{stat.title}</p>
                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                            </div>
                            <div className={`${stat.color} p-3 rounded-lg text-white`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="font-semibold text-gray-800">My Recent Tasks</h2>
                    <button
                        onClick={() => navigate('/tasks')}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        View All
                    </button>
                </div>
                <div className="divide-y divide-gray-200">
                    {myTasks.slice(0, 5).map(task => (
                        <div
                            key={task.id}
                            onClick={() => navigate(`/tasks/${task.id}`)}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-blue-600 mb-1">{task.project_name}</p>
                                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(task.status)}`}>
                                            {task.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        {task.deadline && (
                                            <span className="text-[10px] flex items-center gap-1 text-gray-500">
                                                <Calendar size={12} />
                                                {format(new Date(task.deadline), 'MMM dd')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {myTasks.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No tasks assigned to you yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
