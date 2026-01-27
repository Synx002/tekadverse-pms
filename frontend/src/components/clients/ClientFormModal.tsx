import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { clientsApi } from '../../api/clients.api';
import { BASE_URL } from '../../api/axios';
import type { Client, CreateClientData } from '../../types/client.types';

const clientSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    company: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    description: z.string().optional().or(z.literal('')),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormModalProps {
    client?: Client | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const ClientFormModal = ({ client, onClose, onSuccess }: ClientFormModalProps) => {
    const [loading, setLoading] = useState(false);
    const [logo, setLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const isEdit = !!client;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            company: '',
            address: '',
            description: '',
        },
    });

    useEffect(() => {
        if (client) {
            reset({
                name: client.name,
                email: client.email || '',
                phone: client.phone || '',
                company: client.company || '',
                address: client.address || '',
                description: client.description || '',
            });
            if (client.logo) {
                setLogoPreview(`${BASE_URL}/${client.logo}`);
            }
        }
    }, [client, reset]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: ClientFormData) => {
        try {
            setLoading(true);

            const submitData: CreateClientData = {
                ...data,
                logo: logo || undefined
            };

            if (isEdit && client) {
                await clientsApi.update(client.id, submitData);
                toast.success('Client updated successfully');
            } else {
                await clientsApi.create(submitData);
                toast.success('Client created successfully');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} client`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEdit ? 'Edit Client' : 'New Client'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {/* Logo Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-blue-500 transition-colors">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 className="w-10 h-10 text-gray-400" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-lg text-white cursor-pointer hover:bg-blue-700 shadow-lg transition-transform hover:scale-110">
                                <Upload className="w-4 h-4" />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">Upload client logo (rectangular/square)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Client Name *</label>
                            <input
                                {...register('name')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Garena Indonesia"
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Company Name</label>
                            <input
                                {...register('company')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="PT Garena Indonesia"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                {...register('email')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="contact@client.com"
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Phone Number</label>
                            <input
                                {...register('phone')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="+62 812..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Address</label>
                        <input
                            {...register('address')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Jakarta, Indonesia"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Brief information about the client..."
                        />
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
                            {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Client')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
