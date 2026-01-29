import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { projectsApi } from '../api/projects.api';
import { tasksApi } from '../api/tasks.api';
import { usersApi } from '../api/users.api';
import type { Task } from '../types/task.types';
import type { Project } from '../types/project.types';
import type { User } from '../types/user.types';

// Import Dashboard Components
import { AdminDashboard } from './dashboard/components/AdminDashboard';
import { ManagerDashboard } from './dashboard/components/ManagerDashboard';
import { ArtistDashboard } from './dashboard/components/ArtistDashboard';

export const Dashboard = () => {
    const user = useAuthStore((state) => state.user);
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load projects
            const projectsRes = await projectsApi.getAll();
            setProjects(projectsRes.data || []);

            // Load tasks (backend already filters for artists)
            const tasksRes = await tasksApi.getAll();
            setTasks(tasksRes.data || []);

            // Load users if admin
            if (user?.role === 'admin') {
                const usersRes = await usersApi.getAll();
                setUsers(usersRes.data || []);
            }

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const renderDashboard = () => {
        switch (user?.role) {
            case 'admin':
                return <AdminDashboard projects={projects} tasks={tasks} users={users} loading={loading} />;
            case 'manager':
                return <ManagerDashboard projects={projects} tasks={tasks} loading={loading} />;
            case 'artist':
                return <ArtistDashboard user={user} tasks={tasks} loading={loading} />;
            default:
                return (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
                        Invalid role or access denied.
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {user?.name}! 👋
                    </h1>
                    <p className="text-gray-500 mt-1 capitalize">Role: {user?.role}</p>
                </div>
            </div>

            {/* Role-Specific Dashboard */}
            {renderDashboard()}
        </div>
    );
};
