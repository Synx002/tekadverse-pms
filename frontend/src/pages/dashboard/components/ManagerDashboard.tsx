import { useNavigate } from 'react-router-dom';
import { FolderKanban, ClipboardCheck, AlertCircle, Users, Banknote } from 'lucide-react';
import type { Task } from '../../../types/task.types';
import type { Project } from '../../../types/project.types';

interface PayoutItem {
    artist_id: number;
    artist_name: string;
    artist_email: string;
    total_pending: number;
}

interface ManagerDashboardProps {
    projects: Project[];
    tasks: Task[];
    payouts: { payouts: PayoutItem[]; total_to_pay: number } | null;
    loading: boolean;
}

export const ManagerDashboard = ({ projects, tasks, payouts, loading }: ManagerDashboardProps) => {
    const navigate = useNavigate();

    const activeProjects = projects.filter(p => p.status === 'active');
    const tasksToReview = tasks.filter(t => ['under_review', 'finished'].includes(t.status));
    const urgentTasks = tasks.filter(t => t.priority === 'urgent' && !['done', 'approved', 'dropped'].includes(t.status));

    const stats = [
        {
            title: 'Active Projects',
            value: activeProjects.length,
            icon: FolderKanban,
            color: 'bg-blue-600',
            subtitle: 'Ongoing projects'
        },
        {
            title: 'Pending Review',
            value: tasksToReview.length,
            icon: ClipboardCheck,
            color: 'bg-purple-600',
            subtitle: 'Awaiting manager approval'
        },
        {
            title: 'Urgent Tasks',
            value: urgentTasks.length,
            icon: AlertCircle,
            color: 'bg-red-600',
            subtitle: 'Priority items'
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasks Needing Review */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-purple-50">
                        <h2 className="font-semibold text-purple-900">Review Queue</h2>
                        <span className="text-xs font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                            {tasksToReview.length}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                        {tasksToReview.map(task => (
                            <div
                                key={task.id}
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1">{task.project_name}</p>
                                        <h3 className="font-medium text-gray-900">{task.step_name || task.description}</h3>
                                        <p className="text-xs text-gray-400 mt-1">Artist: {task.assigned_to_name}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(task.status)}`}>
                                        {task.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {tasksToReview.length === 0 && (
                            <div className="p-8 text-center text-gray-500 italic">
                                No tasks currently need review.
                            </div>
                        )}
                    </div>
                </div>

                {/* Pembayaran ke Artist */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-amber-50">
                        <h2 className="font-semibold text-amber-900 flex items-center gap-2">
                            <Banknote size={18} /> Pembayaran ke Artist
                        </h2>
                        {payouts && payouts.total_to_pay > 0 && (
                            <span className="text-sm font-bold text-amber-800">
                                Total: Rp {payouts.total_to_pay.toLocaleString('id-ID')}
                            </span>
                        )}
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        {payouts && payouts.payouts.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
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
                        ) : (
                            <div className="p-8 text-center text-gray-500 italic">
                                Tidak ada pembayaran tertunda. Uang akan muncul saat task status Done/Approved.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Team Overview */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users size={18} /> Team Overview
                </h2>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">You are managing {activeProjects.length} active projects with {tasks.length} total tasks.</p>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Manager Tip</h4>
                        <p className="text-xs text-blue-700">Check the review queue regularly to keep the workflow moving. Approved tasks move closer to "Done". When a task is Done, the artist earns the step price.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
