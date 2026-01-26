import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FolderKanban,
    CheckSquare,
    Clock,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { projectsApi } from '../api/projects.api';
import { tasksApi } from '../api/tasks.api';
import type { Task } from '../types/task.types';
import type { Project } from '../types/project.types';
import { format } from 'date-fns';

interface DashboardStats {
    totalProjects: number;
    activeProjects: number;
    totalTasks: number;
    completedTasks: number;
    myTasks: number;
    urgentTasks: number;
}

export const Dashboard = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [stats, setStats] = useState<DashboardStats>({
        totalProjects: 0,
        activeProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        myTasks: 0,
        urgentTasks: 0,
    });
    const [recentTasks, setRecentTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load projects
            const projectsRes = await projectsApi.getAll();
            const projects = projectsRes.data || [];

            // Load tasks
            const tasksRes = await tasksApi.getAll();
            const tasks = tasksRes.data || [];

            // Calculate stats
            setStats({
                totalProjects: projects.length,
                activeProjects: projects.filter(p => p.status === 'active').length,
                totalTasks: tasks.length,
                completedTasks: tasks.filter(t => t.status === 'done').length,
                myTasks: tasks.filter(t => t.assigned_to === user?.id).length,
                urgentTasks: tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
            });

            // Get recent tasks assigned to current user
            const myRecentTasks = tasks
                .filter(t => t.assigned_to === user?.id)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5);

            setRecentTasks(myRecentTasks);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Projects',
            value: stats.totalProjects,
            subtitle: `${stats.activeProjects} active`,
            icon: FolderKanban,
            color: 'bg-blue-500',
        },
        {
            title: 'My Tasks',
            value: stats.myTasks,
            subtitle: `${stats.completedTasks} completed`,
            icon: CheckSquare,
            color: 'bg-green-500',
        },
        {
            title: 'Urgent Tasks',
            value: stats.urgentTasks,
            subtitle: 'Requires attention',
            icon: AlertCircle,
            color: 'bg-red-500',
        },
        {
            title: 'In Progress',
            value: stats.totalTasks - stats.completedTasks,
            subtitle: 'Active tasks',
            icon: Clock,
            color: 'bg-yellow-500',
        },
    ];

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-gray-600 mt-1">Here's what's happening with your projects today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
                            </div>
                            <div className={`${stat.color} p-3 rounded-lg`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">My Recent Tasks</h2>
                        <button
                            onClick={() => navigate('/tasks')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            View all →
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-gray-200">
                    {recentTasks.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No tasks assigned yet</p>
                        </div>
                    ) : (
                        recentTasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                                        {task.description && (
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                                                {task.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                            <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                {task.priority.toUpperCase()}
                                            </span>
                                            {task.deadline && (
                                                <span className="text-xs text-gray-500">
                                                    Due: {format(new Date(task.deadline), 'MMM dd, yyyy')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};