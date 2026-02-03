import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { pagesApi } from '../../api/pages.api';
import type { Page, CreatePageData } from '../../types/page.types';

interface PageFormModalProps {
    projectId: number;
    page?: Page;
    onClose: () => void;
    onSuccess: () => void;
}

export const PageFormModal: React.FC<PageFormModalProps> = ({
    projectId,
    page,
    onClose,
    onSuccess
}) => {
    const [name, setName] = useState(page?.name || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Page name is required');
            return;
        }

        try {
            setLoading(true);

            const payload: CreatePageData = {
                project_id: projectId,
                name: name.trim()
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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                        {page ? 'Edit Page' : 'New Page'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="p-6 space-y-4 flex-1"
                >
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Page Name
                        </label>
                        <input
                            type="text"
                            required
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Enter page name"
                        />
                    </div>

                    <p className="text-[10px] text-gray-400">
                        * Page will automatically use steps defined in the project settings.
                    </p>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border rounded-lg py-2 font-medium bg-gray-50 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (page ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
