import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usersApi } from '../../api/users.api';
import { BASE_URL } from '../../api/axios';
import type { User, CreateUserData, UpdateUserData } from '../../types/user.types';

const userSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['admin', 'manager', 'artist']),
    password: z.string().optional(),
    is_active: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormModalProps {
    user?: User | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const UserFormModal = ({ user, onClose, onSuccess }: UserFormModalProps) => {
    const [loading, setLoading] = useState(false);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const isEdit = !!user;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            role: 'artist',
            is_active: true,
            password: '',
        },
    });

    useEffect(() => {
        if (user) {
            reset({
                name: user.name,
                email: user.email,
                role: user.role,
                is_active: user.is_active,
                password: '',
            });
            if (user.profile_picture) {
                setPreviewUrl(`${BASE_URL}/${user.profile_picture}`);
            }
        } else {
            reset({
                name: '',
                email: '',
                role: 'artist',
                is_active: true,
                password: '',
            });
            setPreviewUrl(null);
        }
    }, [user, reset]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const onSubmit = async (data: UserFormData) => {
        try {
            setLoading(true);
            const userData = {
                ...data,
                profile_picture: profilePicture || undefined,
            };

            if (isEdit && user) {
                await usersApi.update(user.id, userData as UpdateUserData);
                toast.success('User updated successfully');
            } else {
                if (!data.password) {
                    toast.error('Password is required for new users');
                    return;
                }
                await usersApi.create(userData as CreateUserData);
                toast.success('User created successfully');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} user`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEdit ? 'Edit User' : 'New User'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                    {/* Profile Picture Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-10 h-10 text-gray-400" />
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                                <Upload className="w-6 h-6 text-white" />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                        <p className="text-sm text-gray-500">Click to upload profile picture</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                {...register('name')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="John Doe"
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                {...register('email')}
                                type="email"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="john@example.com"
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Role</label>
                            <select
                                {...register('role')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="artist">Artist</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                {isEdit ? 'Change Password (optional)' : 'Password'}
                            </label>
                            <input
                                {...register('password')}
                                type="password"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="••••••••"
                            />
                            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            {...register('is_active')}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                            Active User
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create User')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
