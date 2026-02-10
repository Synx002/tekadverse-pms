import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '../../assets/logo.svg';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import type { LoginCredentials } from '../../types/auth.types';

const loginSchema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const Login = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginCredentials>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginCredentials) => {
        try {
            setLoading(true);
            setError(null);
            const response = await authApi.login(data);

            if (response.success && response.data) {
                setAuth(response.data.user, response.data.token);
                toast.success('Login berhasil!');
                navigate('/');
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Login gagal';
            if (msg === 'Invalid credentials') {
                setError('Email atau password salah');
            } else {
                setError(msg);
            }
            // toast.error(msg); // Optional: keep or remove toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-24 h-24">
                            <img src={Logo} alt="Logo" className="w-full h-full" />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Sign in to Tekadverse PMS</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="your@email.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPassword ? "text" : "password"}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                            <div className="flex justify-end mt-1">
                                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Register link */}
                    {/* <p className="mt-6 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                            Register here
                        </Link>
                    </p> */}
                </div>
            </div>
        </div>
    );
};