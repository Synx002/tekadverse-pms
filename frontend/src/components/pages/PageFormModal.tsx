import React, { useState } from 'react';
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

export const PageFormModal: React.FC<PageFormModalProps> = ({ projectId, page, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<CreatePageData>({
        project_id: projectId,
        name: page?.name || '',
        steps: page?.steps || [],
    });
    const [stepCount, setStepCount] = useState<number>(page?.steps?.length || 0);
    const [stepNames, setStepNames] = useState<string[]>(
        page?.steps?.map(s => s.step_name) || []
    );
    const [loading, setLoading] = useState(false);

    const handleStepCountChange = (count: number) => {
        setStepCount(count);
        // Initialize step names array with empty strings
        const newStepNames = Array(count).fill('').map((_, i) => stepNames[i] || '');
        setStepNames(newStepNames);
    };

    const handleStepNameChange = (index: number, value: string) => {
        const newStepNames = [...stepNames];
        newStepNames[index] = value;
        setStepNames(newStepNames);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate step names if step count > 0
        if (stepCount > 0) {
            const emptySteps = stepNames.some(name => !name.trim());
            if (emptySteps) {
                toast.error('Please fill in all step names');
                return;
            }
        }

        try {
            setLoading(true);

            // Prepare steps data
            const steps: PageStep[] = stepCount > 0
                ? stepNames.map((name, index) => ({
                    step_number: index + 1,
                    step_name: name.trim()
                }))
                : [];

            const dataToSubmit = {
                ...formData,
                steps: steps.length > 0 ? steps : undefined
            };

            if (page) {
                await pagesApi.update(page.id, dataToSubmit);
                toast.success('Page updated successfully');
            } else {
                await pagesApi.create(dataToSubmit);
                toast.success('Page created successfully');
            }
            onSuccess();
        } catch (error) {
            toast.error('Failed to save page');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{page ? 'Edit Page' : 'New Page'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Home Page Design"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Steps (Optional)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            value={stepCount}
                            onChange={(e) => handleStepCountChange(parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 3"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Steps serve as a reference/guide for task creation
                        </p>
                    </div>

                    {stepCount > 0 && (
                        <div className="space-y-3 pt-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Step Names
                            </label>
                            {Array.from({ length: stepCount }).map((_, index) => (
                                <div key={index}>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Step {index + 1}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={stepNames[index] || ''}
                                        onChange={(e) => handleStepNameChange(index, e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder={`e.g. ${index === 0 ? 'Sketch' : index === 1 ? 'Line Art' : 'Base Color'}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? 'Saving...' : (page ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
