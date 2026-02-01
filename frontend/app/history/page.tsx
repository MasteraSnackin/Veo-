'use client'

import { motion } from 'framer-motion'
import { History, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'

export default function HistoryPage() {
    const router = useRouter()

    return (
        <main className="min-h-screen relative overflow-hidden">
            {/* Gradient Mesh Background */}
            <div className="fixed inset-0 mesh-background opacity-30 -z-10" />
            <div className="fixed inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 -z-10" />

            {/* Content */}
            <div className="relative z-10 min-h-screen py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <motion.button
                        onClick={() => router.push('/')}
                        className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-white/30 transition-all mb-8"
                        whileHover={{ x: -4 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-medium">Back to Home</span>
                    </motion.button>

                    {/* Coming Soon Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
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
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 flex items-center justify-center mx-auto">
                                    <History className="w-12 h-12 text-gray-600" />
                                </div>
                            </motion.div>

                            <h1 className="text-4xl font-bold gradient-text mb-4">
                                Search History
                            </h1>

                            <p className="text-gray-600 max-w-md mx-auto mb-8 text-balance">
                                Your search history will appear here. We're working on bringing you this feature soon!
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <AnimatedButton
                                    onClick={() => router.push('/')}
                                    variant="primary"
                                >
                                    Start New Search
                                </AnimatedButton>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/20">
                                <p className="text-sm text-gray-500 mb-4">Coming Features:</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    <span className="px-3 py-1 rounded-lg bg-white/50 text-xs text-gray-700">
                                        View past searches
                                    </span>
                                    <span className="px-3 py-1 rounded-lg bg-white/50 text-xs text-gray-700">
                                        Re-run searches
                                    </span>
                                    <span className="px-3 py-1 rounded-lg bg-white/50 text-xs text-gray-700">
                                        Compare results
                                    </span>
                                    <span className="px-3 py-1 rounded-lg bg-white/50 text-xs text-gray-700">
                                        Export history
                                    </span>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>
            </div>
        </main>
    )
}
