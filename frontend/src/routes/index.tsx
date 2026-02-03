import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from './ProtectedRoute';

// Auth pages
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';

// Main pages
import { Dashboard } from '../pages/dashboard';
import { Projects } from '../components/projects/Projects';
import { ProjectDetail } from '../components/projects/ProjectDetail';
import { PageDetail } from '../components/pages/PageDetail';
import { Tasks } from '../pages/tasks/Tasks';
import { TaskDetail } from '../pages/tasks/TaskDetail';
import { Clients } from '../pages/clients/Clients';
import { Users } from '../pages/users/Users';
import { Profile } from '../pages/users/Profile';
import { Finance } from '../pages/finance/Finance';
import { Notifications } from '../pages/notifications/Notifications';
import { NotFound } from '../pages/NotFound';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/register',
        element: <Register />,
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
            {
                path: 'projects',
                element: <Projects />,
            },
            {
                path: 'projects/:id',
                element: <ProjectDetail />,
            },
            {
                path: 'pages/:id',
                element: <PageDetail />,
            },
            {
                path: 'tasks',
                element: <Tasks />,
            },
            {
                path: 'tasks/:id',
                element: <TaskDetail />,
            },
            {
                path: 'clients',
                element: (
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <Clients />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'users',
                element: (
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Users />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'profile',
                element: <Profile />,
            },
            {
                path: 'finance',
                element: <Finance />,
            },
            {
                path: 'notifications',
                element: <Notifications />,
            },
        ],
    },
    {
        path: '*',
        element: <NotFound />,
    },
]);