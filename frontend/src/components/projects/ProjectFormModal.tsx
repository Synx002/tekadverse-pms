import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectsApi } from '../../api/projects.api';
import type { Project, CreateProjectData, ProjectStatus } from '../../types/project.types';
import type { Client } from '../../types/client.types';
import type { PageStep } from '../../types/page.types';

const projectSchema = z.object({
    client_id: z.number().min(1, 'Client is required'),
    name: z.string().min(3, 'Name must be at least 3 characters'),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormModalProps {
    project?: Project | null;
    clients: Client[];
    onClose: () => void;
    onSuccess: () => void;
}

interface StepForm {
    id?: number;
    step_name: string;
    price: number;
}

const MAX_STEPS = 10;

export const ProjectFormModal = ({ project, clients, onClose, onSuccess }: ProjectFormModalProps) => {
    const [loading, setLoading] = useState(false);
    const [steps, setSteps] = useState<StepForm[]>([]);
    const isEdit = !!project;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<ProjectFormData>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            client_id: project?.client_id || 0,
            name: project?.name || '',
            status: (project?.status || 'planning') as ProjectStatus,
        },
    });

    useEffect(() => {
        if (project) {
            reset({
                client_id: project.client_id,
                name: project.name,
                status: project.status,
            });
            if (project.steps) {
                setSteps(project.steps.map(s => ({
                    id: s.id,
                    step_name: s.step_name,
                    price: s.price ?? 0
                })));
            }
        }
    }, [project, reset]);

    const handleAddStep = () => {
        if (steps.length >= MAX_STEPS) {
            toast.error(`Maximum ${MAX_STEPS} steps allowed`);
            return;
        }
        setSteps([...steps, { step_name: '', price: 0 }]);
    };

    const handleRemoveStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const handleStepChange = (index: number, field: 'step_name' | 'price', value: string) => {
        const updated = [...steps];
        if (field === 'price') {
            updated[index].price = parseInt(value.replace(/\D/g, ''), 10) || 0;
        } else {
            updated[index].step_name = value;
        }
        setSteps(updated);
    };

    const formatPrice = (val: number) => val ? val.toLocaleString('id-ID') : '';

    const onSubmit = async (data: ProjectFormData) => {
        if (steps.some(s => !s.step_name.trim())) {
            return toast.error('Please fill in all step names');
        }

        try {
            setLoading(true);
            const preparedSteps: PageStep[] = steps.map((step, index) => ({
                ...(step.id && { id: step.id }),
                step_number: index + 1,
                step_name: step.step_name.trim(),
                price: step.price
            }));

            const payload: CreateProjectData = {
                ...data,
                client_id: data.client_id,
                status: data.status || 'planning',
                steps: preparedSteps
            };

            if (isEdit && project) {
                await projectsApi.update(project.id, payload);
                toast.success('Project updated successfully');
            } else {
                await projectsApi.create(payload);
                toast.success('Project created successfully');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} project`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {isEdit ? 'Edit Project' : 'Create New Project'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body - Scrollable */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Client *
                            </label>
                            <select
                                {...register('client_id', { valueAsNumber: true })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            >
                                <option value={0}>Select client</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                            {errors.client_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                {...register('status')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            >
                                <option value="planning">Planning</option>
                                <option value="active">Active</option>
                                <option value="on_hold">On Hold</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Name *
                        </label>
                        <input
                            {...register('name')}
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Project Name"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                        )}
                    </div>

                    <hr className="border-gray-100" />

                    {/* Step Management */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Project Pipeline / Steps</h3>
                                <p className="text-[10px] text-gray-500">These steps will be available for every page in this project</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddStep}
                                disabled={steps.length >= MAX_STEPS}
                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Plus size={14} />
                                Add Step
                            </button>
                        </div>

                        <div className="space-y-2">
                            {steps.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">
                                    <p className="text-xs text-gray-400">No steps defined yet. Tasks will need steps to be categorized.</p>
                                </div>
                            ) : (
                                steps.map((step, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                placeholder="Step Name (e.g. Sketch)"
                                                value={step.step_name}
                                                onChange={(e) => handleStepChange(index, 'step_name', e.target.value)}
                                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                                                <input
                                                    type="text"
                                                    placeholder="Price"
                                                    value={formatPrice(step.price)}
                                                    onChange={(e) => handleStepChange(index, 'price', e.target.value)}
                                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveStep(index)}
                                            className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-100"
                        >
                            {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Project')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};