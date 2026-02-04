import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Lock, CheckCircle2 } from 'lucide-react';
import Logo from '../../assets/logo.svg';
import { authApi } from '../../api/auth.api';

const resetSchema = z.object({
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetForm = z.infer<typeof resetSchema>;

export const ResetPassword = () => {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(false);
    const [completed, setCompleted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetForm>({
        resolver: zodResolver(resetSchema),
    });

    const onSubmit = async (data: ResetForm) => {
        if (!token) return;

        try {
            setLoading(true);
            const response = await authApi.resetPassword(token, data.password);
            if (response.success) {
                setCompleted(true);
                toast.success('Password reset successfully');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (completed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={32} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password reset!</h2>
                        <p className="text-gray-600 mb-8">
                            Your password has been successfully updated. You can now login with your new password.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
                            <img src={Logo} alt="Logo" className="w-full h-full" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            Please enter your new password below.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    {...register('password')}
                                    type="password"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    {...register('confirmPassword')}
                                    type="password"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Reset password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
