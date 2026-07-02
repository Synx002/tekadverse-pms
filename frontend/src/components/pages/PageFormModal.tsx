import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { pagesApi } from '../../api/pages.api';
import type { Page } from '../../types/page.types';

interface PageFormModalProps {
    projectId: number;
    page?: Page;
    onClose: () => void;
    onSuccess: () => void;
}

export const PageFormModal: React.FC<PageFormModalProps> = ({ projectId, page, onClose, onSuccess }) => {
    const [name, setName] = useState(page?.name || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            const dataToSubmit = {
                project_id: projectId,
                name: name.trim(),
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
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Home Page Design"
                        />
                    </div>

                    <p className="text-xs text-gray-500">
                        Steps & harga dikelola di level Project. Edit project untuk mengubah step pipeline.
                    </p>

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
