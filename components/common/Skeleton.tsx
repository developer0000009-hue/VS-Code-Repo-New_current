
import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
    <div className={`shimmer bg-white/[0.02] rounded-xl border border-white/[0.02] ${className}`} />
);

export const CardSkeleton: React.FC = () => (
    <div className="bg-card/40 border border-white/5 rounded-[2.5rem] p-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-start">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <Skeleton className="w-24 h-6 rounded-full" />
        </div>
        <div className="space-y-3">
            <Skeleton className="w-32 h-3" />
            <Skeleton className="w-full h-8" />
        </div>
        <div className="pt-6 border-t border-white/5 flex gap-4">
            <Skeleton className="flex-1 h-12 rounded-xl" />
            <Skeleton className="w-12 h-12 rounded-xl" />
        </div>
    </div>
);

export const StatsSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card/60 border border-white/5 p-6 rounded-[2rem] space-y-4">
                <div className="flex justify-between">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <Skeleton className="w-16 h-5 rounded-lg" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-32 h-8" />
                </div>
            </div>
        ))}
    </div>
);

export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
    <div className="bg-card/40 border border-white/5 rounded-[3rem] overflow-hidden">
        <div className="p-8 border-b border-white/5">
            <Skeleton className="w-64 h-12 rounded-2xl" />
        </div>
        <div className="p-8 space-y-6">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-6">
                        <Skeleton className="w-14 h-14 rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="w-48 h-4" />
                            <Skeleton className="w-32 h-3" />
                        </div>
                    </div>
                    <Skeleton className="w-32 h-10 rounded-xl" />
                </div>
            ))}
        </div>
    </div>
);
