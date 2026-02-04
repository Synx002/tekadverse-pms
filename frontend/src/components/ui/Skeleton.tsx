import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangular'
}) => {
    const baseClasses = 'animate-pulse bg-gray-200';

    const variantClasses = {
        text: 'h-4 w-full rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
        rounded: 'rounded-xl'
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        />
    );
};

export const ProjectCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <Skeleton variant="rounded" className="h-12 w-12" />
            <Skeleton variant="rounded" className="h-6 w-20" />
        </div>
        <Skeleton variant="text" className="h-6 w-3/4 mb-2" />
        <Skeleton variant="text" className="h-4 w-full mb-6" />
        <div className="space-y-3">
            <div className="flex justify-between">
                <Skeleton variant="text" className="h-4 w-1/4" />
                <Skeleton variant="text" className="h-4 w-1/4" />
            </div>
            <Skeleton variant="rounded" className="h-2 w-full" />
        </div>
    </div>
);

export const TaskRowSkeleton = () => (
    <div className="flex items-center gap-4 p-4 bg-white border-b border-gray-50">
        <Skeleton variant="rounded" className="h-10 w-10 shrink-0" />
        <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-5 w-1/3" />
            <Skeleton variant="text" className="h-4 w-1/4" />
        </div>
        <Skeleton variant="rounded" className="h-8 w-24" />
        <Skeleton variant="circular" className="h-8 w-8" />
    </div>
);

export const FinanceCardSkeleton = () => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
            <Skeleton variant="circular" className="h-10 w-10" />
            <Skeleton variant="text" className="h-4 w-24" />
        </div>
        <Skeleton variant="text" className="h-8 w-3/4 mb-2" />
        <Skeleton variant="text" className="h-4 w-1/2" />
    </div>
);

export const UserRowSkeleton = () => (
    <div className="flex items-center gap-4 p-4 bg-white border-b border-gray-50">
        <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
        <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-5 w-1/4" />
            <Skeleton variant="text" className="h-4 w-1/3" />
        </div>
        <Skeleton variant="rounded" className="h-6 w-20" />
        <Skeleton variant="rounded" className="h-6 w-16" />
        <div className="flex gap-2">
            <Skeleton variant="rounded" className="h-8 w-8" />
            <Skeleton variant="rounded" className="h-8 w-8" />
        </div>
    </div>
);
