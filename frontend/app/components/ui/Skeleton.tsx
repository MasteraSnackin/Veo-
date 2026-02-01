'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
    className?: string
    variant?: 'text' | 'circle' | 'rectangle'
}

export default function Skeleton({ className = '', variant = 'rectangle' }: SkeletonProps) {
    const baseClass = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer'

    const variantClass = {
        text: 'h-4 rounded',
        circle: 'rounded-full',
        rectangle: 'rounded-2xl',
    }[variant]

    return (
        <motion.div
            className={`${baseClass} ${variantClass} ${className}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        />
    )
}

export function RecommendationCardSkeleton({ isHero = false }: { isHero?: boolean }) {
    return (
        <div className={`glass-card p-8 ${isHero ? 'bg-gradient-to-br from-blue-50/50 to-purple-50/50' : ''}`}>
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Skeleton variant="rectangle" className="w-16 h-16" />
                    <div className="space-y-2">
                        <Skeleton variant="text" className="w-32 h-6" />
                        <Skeleton variant="text" className="w-24 h-4" />
                    </div>
                </div>
                <Skeleton variant="circle" className="w-20 h-20" />
            </div>

            <div className="mb-6">
                <Skeleton variant="text" className="w-20 h-4 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton variant="text" className="w-16 h-4" />
                            <Skeleton variant="rectangle" className="w-full h-2" />
                        </div>
                    ))}
                </div>
            </div>

            {isHero && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton variant="text" className="w-20 h-4" />
                        <Skeleton variant="text" className="w-full h-4" />
                        <Skeleton variant="text" className="w-full h-4" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton variant="text" className="w-24 h-4" />
                        <Skeleton variant="text" className="w-full h-4" />
                        <Skeleton variant="text" className="w-full h-4" />
                    </div>
                </div>
            )}
        </div>
    )
}

export function ResultsPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <Skeleton variant="text" className="w-64 h-8 mx-auto mb-4" />
                <Skeleton variant="rectangle" className="w-96 h-16 mx-auto" />
            </div>

            <RecommendationCardSkeleton isHero />
            <RecommendationCardSkeleton />
            <RecommendationCardSkeleton />
        </div>
    )
}
