import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../api/users.api';
import { toast } from 'sonner';
import {
    User as UserIcon,
    Mail,
    Shield,
    Building2,
    CreditCard,
    Lock,
    CheckCircle2,
    Camera,
    ChevronRight,
    Settings,
    Eye,
    EyeOff
} from 'lucide-react';
import { BASE_URL } from '../../api/axios';
import { Skeleton } from '../../components/ui/Skeleton';

export const Profile = () => {
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'bank' | 'security'>('details');
    const [showPassword, setShowPassword] = useState(false);

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        bank_name: '',
        bank_account_number: '',
        bank_account_holder: '',
        password: ''
    });

    useEffect(() => {
        if (user) {
            setProfile(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                bank_name: user.bank_name || '',
                bank_account_number: user.bank_account_number || '',
                bank_account_holder: user.bank_account_holder || ''
            }));
        }
        loadFullProfile();
    }, []);

    const loadFullProfile = async () => {
        try {
            setPageLoading(true);
            const response = await usersApi.getMe();
            const userData = response.data;
            if (userData) {
                setProfile(prev => ({
                    ...prev,
                    name: userData.name,
                    email: userData.email,
                    bank_name: userData.bank_name || '',
                    bank_account_number: userData.bank_account_number || '',
                    bank_account_holder: userData.bank_account_holder || ''
                }));
                updateUser(userData);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setPageLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updateData: any = {
                name: profile.name,
                email: profile.email,
            };

            if (activeTab === 'bank') {
                updateData.bank_name = profile.bank_name;
                updateData.bank_account_number = profile.bank_account_number;
                updateData.bank_account_holder = profile.bank_account_holder;
            }

            if (activeTab === 'security' && profile.password) {
                updateData.password = profile.password;
            }

            await usersApi.update(user!.id, updateData);
            toast.success('Profile updated successfully');

            if (profile.password) {
                setProfile(prev => ({ ...prev, password: '' }));
                setShowPassword(false);
            }

            loadFullProfile();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const formData = new FormData();
        formData.append('profile_picture', e.target.files[0]);

        try {
            setLoading(true);
            await usersApi.uploadProfilePicture(formData);
            toast.success('Profile picture updated');
            loadFullProfile();
        } catch (error) {
            toast.error('Failed to upload profile picture');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
                <div className="h-64 bg-gray-200 rounded-3xl w-full" />
                <div className="flex gap-8 -mt-16 px-8">
                    <div className="w-32 h-32 rounded-3xl bg-gray-300 border-4 border-white shadow-xl" />
                    <div className="mt-20 space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                    <div className="md:col-span-2">
                        <Skeleton className="h-[400px] w-full rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Profile Header */}
            <div className="relative">
                {/* Banner */}
                <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
                    </div>
                </div>

                {/* Profile Info Overlay */}
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20 md:-mt-16 px-8 relative z-10">
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white p-1.5 shadow-2xl transition-transform duration-300">
                            <div className="w-full h-full rounded-2xl overflow-hidden bg-blue-500 text-white flex items-center justify-center text-5xl font-bold">
                                {user?.profile_picture ? (
                                    <img
                                        src={`${BASE_URL}/${user.profile_picture}`}
                                        alt={user.name}
                                        className="w-full h-full object-cover transition-transform duration-500"
                                    />
                                ) : (
                                    user?.name.charAt(0).toUpperCase()
                                )}
                            </div>
                        </div>
                        <label className="absolute bottom-2 right-2 p-3 bg-white text-blue-600 rounded-2xl shadow-xl cursor-pointer hover:bg-blue-600 hover:text-white transition-all transform active:scale-95 border border-gray-100">
                            <Camera size={20} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureUpload} />
                        </label>
                    </div>

                    <div className="text-center md:text-left pb-4 flex-1">
                        <h1 className="text-3xl font-bold text-white md:text-gray-900 drop-shadow-sm md:drop-shadow-none flex items-center justify-center md:justify-start gap-3">
                            {user?.name}
                            <div className="bg-emerald-500 w-3 h-3 rounded-full border-2 border-white animate-pulse" />
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                            <span className="flex items-center gap-1.5 text-blue-100 md:text-gray-500 text-sm font-medium">
                                <Mail size={14} />
                                {user?.email}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 md:bg-blue-50 text-white md:text-blue-700 backdrop-blur-md md:backdrop-blur-none border border-white/30 md:border-blue-100">
                                <Shield size={12} />
                                {user?.role}
                            </span>
                        </div>
                    </div>

                    <div className="pb-4 hidden lg:block">
                        <div className="flex items-center gap-8 px-8 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">User ID</p>
                                <p className="text-xl font-bold text-white">#{user?.id}</p>
                            </div>
                            <div className="w-px h-8 bg-white/20" />
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Status</p>
                                <p className="text-xl font-bold text-white">Active</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="md:col-span-1 space-y-2">
                    {[
                        { id: 'details', label: 'Personal Info', icon: UserIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { id: 'bank', label: 'Payment Details', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { id: 'security', label: 'Security & Access', icon: Lock, color: 'text-purple-600', bg: 'bg-purple-50' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${activeTab === item.id
                                ? `${item.bg} ${item.color} shadow-sm border border-transparent`
                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={20} />
                                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                            </div>
                            {activeTab === item.id && <ChevronRight size={16} />}
                        </button>
                    ))}

                    <div className="mt-8 p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl text-white overflow-hidden relative shadow-xl">
                        <Settings className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12" />
                        <h4 className="font-bold text-sm mb-2 relative z-10">Account Status</h4>
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold mb-4 relative z-10">
                            <CheckCircle2 size={14} />
                            Fully Verified
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-tighter relative z-10">
                            Join Date: {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    <div className="bg-white rounded-[32px] shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                        <form onSubmit={handleUpdateProfile} className="divide-y divide-gray-50">
                            {activeTab === 'details' && (
                                <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Personal Information</h3>
                                        <p className="text-sm text-gray-500 mt-1">Update your personal details and how others see you.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Full Display Name</label>
                                            <div className="relative group">
                                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={profile.name}
                                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={profile.email}
                                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bank' && (
                                <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Financial Information</h3>
                                        <p className="text-sm text-gray-500 mt-1">Manage your withdrawal methods and bank details.</p>
                                    </div>

                                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex gap-4">
                                        <div className="bg-white p-3 rounded-xl shadow-sm h-12 w-12 flex items-center justify-center">
                                            <CreditCard className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-emerald-900 text-sm">Security Notice</h4>
                                            <p className="text-xs text-emerald-700 mt-0.5">Please ensure your bank details match your identity document to avoid payment delays.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-2">
                                                Bank Provider Name
                                            </label>
                                            <div className="relative group">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-600 transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="e.g. BCA, Mandiri, BNI"
                                                    value={profile.bank_name}
                                                    onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold tracking-tight"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Account Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="000 000 000"
                                                    value={profile.bank_account_number}
                                                    onChange={(e) => setProfile({ ...profile, bank_account_number: e.target.value })}
                                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:bg-white focus:border-emerald-500 outline-none transition-all font-mono text-lg"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Account Holder Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="FULL NAME AS IN BANK BOOK"
                                                    value={profile.bank_account_holder}
                                                    onChange={(e) => setProfile({ ...profile, bank_account_holder: e.target.value })}
                                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold uppercase"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Security & Access</h3>
                                        <p className="text-sm text-gray-500 mt-1">Manage your account password and security settings.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Update New Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-600 transition-colors" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter new strong password"
                                                value={profile.password}
                                                onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                                                className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:bg-white focus:border-purple-500 outline-none transition-all font-medium"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-400 ml-1 uppercase">Leave blank if you don't want to change the password.</p>
                                    </div>

                                    <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                                        <div className="flex gap-4">
                                            <div className="bg-white p-3 rounded-xl shadow-sm h-12 w-12 flex items-center justify-center shrink-0">
                                                <Lock className="text-purple-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-purple-900 text-sm tracking-tight">Two-Factor Authentication</h4>
                                                <p className="text-xs text-purple-700 leading-relaxed">2FA is currently managed by your organization's administrator. Contact IT support to enable extra security.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-8 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <p className="text-xs text-gray-500 italic max-w-sm">
                                    Last profile synchronize: {new Date().toLocaleTimeString()}
                                </p>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`relative group bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 overflow-hidden flex items-center justify-center gap-3`}
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Save Profile
                                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
