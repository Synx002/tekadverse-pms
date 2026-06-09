import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Banknote } from 'lucide-react';
import type { Task } from '../../../types/task.types';
import type { Project } from '../../../types/project.types';
import type { User } from '../../../types/user.types';

interface PayoutItem {
    artist_id: number;
    artist_name: string;
    artist_email: string;
    total_pending: number;
}

interface AdminDashboardProps {
    projects: Project[];
    tasks: Task[];
    users: User[];
    payouts: { payouts: PayoutItem[]; total_to_pay: number } | null;
    loading: boolean;
}

export const AdminDashboard = ({ projects, tasks, users, payouts, loading }: AdminDashboardProps) => {
    const navigate = useNavigate();

    // In a real app, we'd fetch these from separate endpoints, 
    // but here we use the props for simplicity
    const stats = [
        {
            title: 'System Projects',
            value: projects.length,
            icon: Briefcase,
            color: 'bg-indigo-600',
            subtitle: 'Total across all clients'
        },
        {
            title: 'Global Tasks',
            value: tasks.length,
            icon: LayoutDashboard,
            color: 'bg-emerald-600',
            subtitle: 'Managed within system'
        },
        {
            title: 'Active Users',
            value: users.length,
            icon: Users,
            color: 'bg-orange-600',
            subtitle: 'Artists, Managers, Admins'
        }
    ];

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

            {payouts && payouts.payouts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-amber-50">
                        <h2 className="font-semibold text-amber-900 flex items-center gap-2">
                            <Banknote size={18} /> Pembayaran ke Artist
                        </h2>
                        <span className="text-sm font-bold text-amber-800">
                            Total: Rp {payouts.total_to_pay.toLocaleString('id-ID')}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-700">Artist</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-700">Email</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-700">Jumlah (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {payouts.payouts.map((p) => (
                                    <tr key={p.artist_id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{p.artist_name}</td>
                                        <td className="px-4 py-3 text-gray-600">{p.artist_email}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-amber-700">
                                            Rp {p.total_pending.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="font-semibold text-gray-800 mb-4">Latest Projects</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 italic text-sm text-gray-400">
                                <th className="pb-3 font-medium">Project Name</th>
                                <th className="pb-3 font-medium">Client</th>
                                <th className="pb-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {projects.slice(0, 5).map(project => (
                                <tr key={project.id} className="text-sm hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                                    <td className="py-3 font-medium text-gray-900">{project.name}</td>
                                    <td className="py-3 text-gray-600">{project.client_name || 'N/A'}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {project.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
