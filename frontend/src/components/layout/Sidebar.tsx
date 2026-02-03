import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Users,
    Building2,
    Banknote,
    X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import logo from '../../assets/logo.svg';

export const Sidebar = () => {
    const user = useAuthStore((state) => state.user);
    const { sidebarOpen, toggleSidebar } = useUIStore();

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'artist'] },
        { name: 'Projects', href: '/projects', icon: FolderKanban, roles: ['admin', 'manager', 'artist'] },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare, roles: ['admin', 'manager', 'artist'] },
        { name: 'Finance', href: '/finance', icon: Banknote, roles: ['admin', 'manager', 'artist'] },
        { name: 'Clients', href: '/clients', icon: Building2, roles: ['admin', 'manager'] },
        { name: 'Users', href: '/users', icon: Users, roles: ['admin'] },
    ];

    const filteredNav = navigation.filter(item =>
        user && item.roles.includes(user.role)
    );

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 z-40 h-screen transition-transform bg-white border-r border-gray-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 w-64
        `}
            >
                <div className="h-full px-3 py-4 overflow-y-auto">
                    {/* Logo */}
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-2">
                            <img src={logo} alt="Logo" className="w-18 items-center" />
                            <div className="w-px bg-gray-300 self-stretch"></div>
                            <h1 className="text-sm font-medium text-gray-800">Project Management System</h1>
                        </div>
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-1 rounded hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2">
                        {filteredNav.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                <span className="font-medium">{item.name}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </aside>
        </>
    );
};