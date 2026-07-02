import { useState } from 'react';
import { X, CircleCheck } from 'lucide-react';
import { tasksApi } from '../../api/tasks.api';
import { toast } from 'sonner';
import type { Task } from '../../types/task.types';

interface MarkAsDoneModalProps {
  task: Task;
  onClose: () => void;
  onSuccess: () => void;
}

export const MarkAsDoneModal = ({
  task,
  onClose,
  onSuccess,
}: MarkAsDoneModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleMarkAsDone = async () => {
    try {
      setLoading(true);
      await tasksApi.updateStatus(task.id, 'done');
      toast.success('Task successfully marked as Done 🎉');
      onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to update task status'
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
          disabled={loading}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
          <CircleCheck className="text-green-600" size={26} />
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900">
          Mark task as Done?
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 mt-2 mb-6">
          Are you sure you want to mark this task as <span className="font-semibold text-green-600">Done</span>?
          <br />
          This action may not be reversible.
        </p>

        {/* Confirm Button */}
        <button
          onClick={handleMarkAsDone}
          disabled={loading}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Yes, Mark as Done'}
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