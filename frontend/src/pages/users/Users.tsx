import { useEffect, useState } from 'react';
import { Plus, Search, Shield, Briefcase, Palette, Users as UsersIcon, User as UserIcon, Mail, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { Edit, Trash2 } from 'lucide-react';
import { usersApi } from '../../api/users.api';
import { BASE_URL } from '../../api/axios';
import type { User, UserRole } from '../../types/user.types';
import { UserFormModal } from '../../components/users/UserFormModal';
import { UserRowSkeleton } from '../../components/ui/Skeleton';

export const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await usersApi.getAll();
            setUsers(response.data || []);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        managers: users.filter(u => u.role === 'manager').length,
        artists: users.filter(u => u.role === 'artist').length,
        active: users.filter(u => u.is_active).length
    };

    const getRoleIcon = (role: UserRole) => {
        const icons = {
            admin: Shield,
            manager: Briefcase,
            artist: Palette,
        };
        const Icon = icons[role];
        return <Icon className="w-5 h-5" />;
    };

    const getRoleColor = (role: UserRole) => {
        const colors = {
            admin: 'bg-red-50 text-red-600 border-red-100',
            manager: 'bg-blue-50 text-blue-600 border-blue-100',
            artist: 'bg-purple-50 text-purple-600 border-purple-100',
        };
        return colors[role];
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleDeleteUser = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await usersApi.delete(id);
            toast.success('User deleted successfully');
            loadUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        Team Management
                    </h1>
                    <p className="text-gray-500 mt-2 font-regular">
                        Manage roles, permissions, and team member accounts.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedUser(null);
                        setShowModal(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Add Member
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total team', value: stats.total, icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Artists', value: stats.artists, icon: Palette, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Managers', value: stats.managers, icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Admins', value: stats.admins, icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Active', value: stats.active, icon: UserIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                ].map((item, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`${item.bg} ${item.color} p-2.5 rounded-xl`}>
                                <item.icon size={20} />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">{item.value}</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{item.label}</p>
                    </div>
                ))}
            </div>

            {/* Filter Area */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                        className="flex-1 md:w-48 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-600 cursor-pointer"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Administrator</option>
                        <option value="manager">Manager</option>
                        <option value="artist">Artist</option>
                    </select>
                </div>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                    {[...Array(5)].map((_, i) => (
                        <UserRowSkeleton key={i} />
                    ))}
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <UsersIcon className="text-gray-300 w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No members found</h3>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Member</th>
                                    <th className="hidden lg:table-cell px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Role</th>
                                    <th className="hidden md:table-cell px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Bank Info</th>
                                    <th className="hidden xl:table-cell px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    {user.profile_picture ? (
                                                        <img
                                                            src={`${BASE_URL}/${user.profile_picture}`}
                                                            alt={user.name}
                                                            className="w-11 h-11 rounded-xl object-cover ring-2 ring-white"
                                                        />
                                                    ) : (
                                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-100 uppercase">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${user.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user.name}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Mail size={12} className="text-gray-400" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-4">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${getRoleColor(user.role)}`}>
                                                {getRoleIcon(user.role)}
                                                <span className="capitalize">{user.role}</span>
                                            </span>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4">
                                            {user.bank_account_number ? (
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <div className="bg-gray-100 p-2 rounded-lg">
                                                        <Banknote size={16} className="text-gray-400" />
                                                    </div>
                                                    <div className="text-xs">
                                                        <div className="font-semibold text-gray-800 uppercase">{user.bank_name}</div>
                                                        <div className="text-gray-500 font-mono tracking-tighter">{user.bank_account_number}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Not set</span>
                                            )}
                                        </td>
                                        <td className="hidden xl:table-cell px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.is_active
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                                                    title="Edit Member"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                                    title="Remove Member"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <UserFormModal
                    user={selectedUser}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        loadUsers();
                    }}
                />
            )}
        </div>
    );
};