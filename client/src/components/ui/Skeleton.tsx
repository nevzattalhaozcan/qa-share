import { cn } from '../../lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-xl bg-white/10",
                className
            )}
        />
    );
}

// Pre-built skeleton patterns for common use cases
export function CardSkeleton() {
    return (
        <div className="glass-card p-4 rounded-xl space-y-3">
            <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-3/4" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-4 w-20" />
            </div>
        </div>
    );
}

export function TestCaseCardSkeleton() {
    return <CardSkeleton />;
}

export function BugCardSkeleton() {
    return (
        <div className="glass-card p-4 rounded-xl space-y-3">
            <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-3/4" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-4 w-20" />
            </div>
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="glass-card p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-8" />
                </div>
            </div>
        </div>
    );
}

export function ProjectCardSkeleton() {
    return (
        <div className="glass-card p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
            </div>
        </div>
    );
}

// Loading screen with multiple skeletons
export function PageLoadingSkeleton({ type = 'cards', count = 3 }: { type?: 'cards' | 'bugs' | 'stats' | 'home'; count?: number }) {
    if (type === 'home') {
        return (
            <div className="space-y-6">
                {/* Stats row */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>

                {/* Project cards */}
                <div className="space-y-3 mt-6">
                    <Skeleton className="h-6 w-32" />
                    <ProjectCardSkeleton />
                    <ProjectCardSkeleton />
                </div>
            </div>
        );
    }

    if (type === 'stats') {
        return (
            <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: count }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (type === 'bugs') {
        return (
            <div className="space-y-4">
                {Array.from({ length: count }).map((_, i) => (
                    <BugCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}
