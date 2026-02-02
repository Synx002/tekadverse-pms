import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { pagesApi } from '../../api/pages.api';
import type { Page, CreatePageData, PageStep } from '../../types/page.types';

interface PageFormModalProps {
    projectId: number;
    page?: Page;
    onClose: () => void;
    onSuccess: () => void;
}

interface StepForm {
    id?: number;
    step_name: string;
    price: number;
}

const MAX_STEPS = 10;

export const PageFormModal: React.FC<PageFormModalProps> = ({
    projectId,
    page,
    onClose,
    onSuccess
}) => {
    const [name, setName] = useState(page?.name || '');
    const [steps, setSteps] = useState<StepForm[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (page?.steps) {
            setSteps(
                page.steps.map(s => ({
                    id: s.id,
                    step_name: s.step_name,
                    price: s.price ?? 0
                }))
            );
        }
    }, [page?.id]);

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

    const handleStepChange = (
        index: number,
        field: 'step_name' | 'price',
        value: string
    ) => {
        const updated = [...steps];

        if (field === 'price') {
            updated[index].price =
                parseInt(value.replace(/\D/g, ''), 10) || 0;
        } else {
            updated[index].step_name = value;
        }

        setSteps(updated);
    };

    const formatPrice = (val: number) =>
        val ? val.toLocaleString('id-ID') : '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (steps.some(s => !s.step_name.trim())) {
            toast.error('Please fill in all step names');
            return;
        }

        try {
            setLoading(true);

            const preparedSteps: PageStep[] = steps.map((step, index) => ({
                ...(step.id && { id: step.id }),
                step_number: index + 1,
                step_name: step.step_name.trim(),
                price: step.price
            }));

            const payload: CreatePageData = {
                project_id: projectId,
                name,
                steps: preparedSteps.length ? preparedSteps : undefined
            };

            if (page) {
                await pagesApi.update(page.id, payload);
                toast.success('Page updated successfully');
            } else {
                await pagesApi.create(payload);
                toast.success('Page created successfully');
            }

            onSuccess();
        } catch {
            toast.error('Failed to save page');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                        {page ? 'Edit Page' : 'New Page'}
                    </h2>
                    <button onClick={onClose}>
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="p-6 space-y-4 overflow-y-auto flex-1"
                >
                    {/* PAGE NAME */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Page Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>

                    {/* STEPS */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium">
                                Steps (Optional)
                            </label>
                            <button
                                type="button"
                                onClick={handleAddStep}
                                disabled={steps.length >= MAX_STEPS}
                                className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                            >
                                + Add Step
                            </button>
                        </div>

                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="p-3 bg-gray-50 rounded-lg space-y-2"
                            >
                                <div className="flex justify-between text-xs">
                                    <span>Step {index + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveStep(index)}
                                        className="text-red-500 hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={step.step_name}
                                        onChange={e =>
                                            handleStepChange(
                                                index,
                                                'step_name',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Step name"
                                        className="px-4 py-2 border rounded-lg"
                                    />

                                    <input
                                        type="text"
                                        value={formatPrice(step.price)}
                                        onChange={e =>
                                            handleStepChange(
                                                index,
                                                'price',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Harga (Rp)"
                                        className="px-4 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border rounded-lg py-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white rounded-lg py-2 disabled:opacity-50"
                        >
                            {loading
                                ? 'Saving...'
                                : page
                                    ? 'Update'
                                    : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
