import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../api/users.api';
import { toast } from 'sonner';
import { User, Mail, Shield, Building2, CreditCard, UserCircle, Upload } from 'lucide-react';
import { BASE_URL } from '../../api/axios';

export const Profile = () => {
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        bank_name: '',
        bank_account_number: '',
        bank_account_holder: ''
    });

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || '',
                email: user.email || '',
                bank_name: user.bank_name || '',
                bank_account_number: user.bank_account_number || '',
                bank_account_holder: user.bank_account_holder || ''
            });
        }
        loadFullProfile();
    }, []);

    const loadFullProfile = async () => {
        try {
            const res = await usersApi.getMe();
            if (res.data) {
                setProfile({
                    name: res.data.name,
                    email: res.data.email,
                    bank_name: res.data.bank_name || '',
                    bank_account_number: res.data.bank_account_number || '',
                    bank_account_holder: res.data.bank_account_holder || ''
                });
                updateUser(res.data);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Using a simple object for update if it's just text
            // In this app, updateUser might expect FormData because of profile picture
            const formData = new FormData();
            formData.append('name', profile.name);
            formData.append('email', profile.email);
            formData.append('bank_name', profile.bank_name);
            formData.append('bank_account_number', profile.bank_account_number);
            formData.append('bank_account_holder', profile.bank_account_holder);
            formData.append('role', user?.role || 'artist');
            formData.append('is_active', 'true');

            // The backend update route is /users/:id
            await usersApi.update(user!.id, formData as any);
            toast.success('Profile updated successfully');
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

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-500 mt-2">Manage your account information and payment details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Snapshot */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
                        <div className="relative inline-block">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-blue-500 text-white flex items-center justify-center text-4xl font-bold border-4 border-white shadow-md mx-auto">
                                {user?.profile_picture ? (
                                    <img src={`${BASE_URL}/${user.profile_picture}`} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    user?.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                                <Upload size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureUpload} />
                            </label>
                        </div>
                        <h2 className="mt-4 text-xl font-bold text-gray-900">{user?.name}</h2>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2 capitalize">
                            <Shield size={12} />
                            {user?.role}
                        </span>
                        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3 text-sm text-gray-500 text-left">
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-gray-400" />
                                {user?.email}
                            </div>
                            <div className="flex items-center gap-3">
                                <UserCircle size={16} className="text-gray-400" />
                                ID: {user?.id}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleUpdateProfile} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <User size={20} className="text-blue-600" />
                                Profile Information
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <CreditCard size={20} className="text-emerald-600" />
                                Bank Account Information
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">This information is required for fund withdrawals</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 font-flex items-center gap-2">
                                    <Building2 size={14} />
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. BCA, Mandiri, BNI"
                                    value={profile.bank_name}
                                    onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono placeholder:font-sans"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Account Number</label>
                                    <input
                                        type="text"
                                        placeholder="0000 0000 0000"
                                        value={profile.bank_account_number}
                                        onChange={(e) => setProfile({ ...profile, bank_account_number: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono placeholder:font-sans"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Account Holder Name</label>
                                    <input
                                        type="text"
                                        placeholder="AS ON BANK BOOK"
                                        value={profile.bank_account_holder}
                                        onChange={(e) => setProfile({ ...profile, bank_account_holder: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono placeholder:font-sans uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
