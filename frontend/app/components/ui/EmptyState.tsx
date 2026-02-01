'use client'

import { motion } from 'framer-motion'
import { SearchX, TrendingDown, AlertCircle } from 'lucide-react'
import GlassCard from './GlassCard'
import AnimatedButton from './AnimatedButton'

interface EmptyStateProps {
    variant?: 'no-results' | 'error' | 'no-data'
    title?: string
    message?: string
    actionLabel?: string
    onAction?: () => void
}

const variants = {
    'no-results': {
        icon: SearchX,
        defaultTitle: 'No Areas Match Your Criteria',
        defaultMessage: 'We couldn\'t find any areas that fit your requirements. Try adjusting your budget or changing your preferences.',
        gradient: 'from-purple-500 to-pink-500',
    },
    'error': {
        icon: AlertCircle,
        defaultTitle: 'Something Went Wrong',
        defaultMessage: 'We encountered an error while fetching recommendations. Please try again.',
        gradient: 'from-red-500 to-orange-500',
    },
    'no-data': {
        icon: TrendingDown,
        defaultTitle: 'No Data Available',
        defaultMessage: 'There\'s no data to display right now.',
        gradient: 'from-blue-500 to-cyan-500',
    },
}

export default function EmptyState({
    variant = 'no-results',
    title,
    message,
    actionLabel = 'Adjust Search',
    onAction,
}: EmptyStateProps) {
    const config = variants[variant]
    const Icon = config.icon

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full"
        >
            <GlassCard className="p-12 text-center">
                <motion.div
                    animate={{
                        y: [0, -10, 0],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: 'easeInOut',
                    }}
                    className="mb-6 inline-block"
                >
                    <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${config.gradient} opacity-20 flex items-center justify-center mx-auto`}>
                        <Icon className={`w-12 h-12 text-gray-600`} />
                    </div>
                </motion.div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {title || config.defaultTitle}
                </h3>

                <p className="text-gray-600 max-w-md mx-auto mb-8 text-balance">
                    {message || config.defaultMessage}
                </p>

                {onAction && (
                    <AnimatedButton onClick={onAction} variant="primary">
                        {actionLabel}
                    </AnimatedButton>
                )}

                {variant === 'no-results' && (
                    <div className="mt-8 pt-8 border-t border-white/20">
                        <p className="text-sm text-gray-500 mb-4">Suggestions:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <span className="px-3 py-1 rounded-lg bg-white/50 text-xs text-gray-700">
                                Try increasing your budget
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-white/50 text-xs text-gray-700">
                                Change location type (rent ↔ buy)
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-white/50 text-xs text-gray-700">
                                Try a different persona
                            </span>
                        </div>
                    </div>
                )}
            </GlassCard>
        </motion.div>
    )
}
