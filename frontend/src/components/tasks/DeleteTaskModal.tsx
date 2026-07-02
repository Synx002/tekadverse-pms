import { useState } from 'react';
import { X, TriangleAlert } from 'lucide-react';
import { tasksApi } from '../../api/tasks.api';
import { toast } from 'sonner';
import type { Task } from '../../types/task.types';

interface DeleteTaskModalProps {
  task: Task;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteTaskModal = ({
  task,
  onClose,
  onSuccess,
}: DeleteTaskModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await tasksApi.delete(task.id);
      toast.success('Task deleted successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to delete task'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-center">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-red-100">
          <TriangleAlert className="text-red-600" size={26} />
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900">
          Are you sure?
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 mt-2 mb-6">
          Are you sure you want to delete this task?
          <br />
          This action cannot be undone.
        </p>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={loading}
          className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Deleting...' : 'Delete Task'}
        </button>

        {/* Cancel */}
        <button
          onClick={onClose}
          disabled={loading}
          className="w-full mt-3 py-2.5 text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};