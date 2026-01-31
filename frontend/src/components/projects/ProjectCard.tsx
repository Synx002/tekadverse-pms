import { Users, CheckSquare } from 'lucide-react';
import type { Project } from '../../types/project.types';

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



            {/* Client Info */}
            {project.client && (
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{project.client.name}</span>
                </div>
            )}

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Pages</span>
                    </div>
                    <span className="font-medium text-gray-900">
                        {project.pages_count || 0}
                    </span>
                </div>
            </div>
        </div>
    );
};