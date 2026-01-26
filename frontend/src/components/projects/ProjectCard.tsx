import { Calendar, Users, CheckSquare } from 'lucide-react';
import type { Project } from '../../types/project.types';
import { format } from 'date-fns';

interface ProjectCardProps {
    project: Project;
    onClick: () => void;
    onRefresh?: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            planning: 'bg-gray-100 text-gray-800',
            active: 'bg-blue-100 text-blue-800',
            on_hold: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const tasksCompleted = project.tasks_completed || 0;
    const tasksTotal = project.tasks_count || 0;
    const progress = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group"
        >
            {/* Status Badge */}
            <div className="flex items-start justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ').toUpperCase()}
                </span>
            </div>

            {/* Project Name */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {project.name}
            </h3>

            {/* Description */}
            {project.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                </p>
            )}

            {/* Client Info */}
            {project.client && (
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{project.client.name}</span>
                </div>
            )}

            {/* Dates */}
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                        {project.start_date
                            ? format(new Date(project.start_date), 'MMM dd, yyyy')
                            : 'No start date'
                        }
                    </span>
                </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Tasks</span>
                    </div>
                    <span className="font-medium text-gray-900">
                        {tasksCompleted}/{tasksTotal}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};