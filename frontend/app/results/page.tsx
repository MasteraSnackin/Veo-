'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, Download, Share2 } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import RecommendationCard from '../components/results/RecommendationCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import EmptyState from '../components/ui/EmptyState'
import { ResultsPageSkeleton } from '../components/ui/Skeleton'
import SharePopover from '../components/ui/SharePopover'
import ExportPopover from '../components/ui/ExportPopover'

interface Recommendation {
  rank: number
  name: string
  areaCode: string
  score: number
  factors: Record<string, number>
  strengths: string[]
  weaknesses: string[]
}

interface ResultsData {
  success: boolean
  persona: string
  budget: number
  recommendations: Recommendation[]
}

export default function Results() {
  const router = useRouter()
  const [data, setData] = useState<ResultsData | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const shareButtonRef = useRef<HTMLButtonElement>(null)
  const exportButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('recommendations')
    if (stored) {
      setData(JSON.parse(stored))
    } else {
      router.push('/')
    }
  }, [router])

  if (!data) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0 mesh-background opacity-30 -z-10" />
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 -z-10" />

        {/* Skeleton Loading */}
        <div className="relative z-10 min-h-screen py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <ResultsPageSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Gradient Mesh Background */}
      <div className="fixed inset-0 mesh-background opacity-30 -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 -z-10" />

      {/* Content */}
      <div className="relative z-10 min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <motion.button
                onClick={() => router.push('/')}
                className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-white/30 transition-all"
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">New Search</span>
              </motion.button>

              <div className="flex gap-3 relative">
                <div className="relative">
                  <motion.button
                    ref={shareButtonRef}
                    onClick={() => {
                      setShareOpen(!shareOpen)
                      setExportOpen(false)
                    }}
                    className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-white/30 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Share results via link, email, or message"
                    aria-expanded={shareOpen}
                    aria-haspopup="menu"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="font-medium hidden sm:inline">Share</span>
                  </motion.button>
                  <SharePopover
                    isOpen={shareOpen}
                    onClose={() => setShareOpen(false)}
                    buttonRef={shareButtonRef}
                  />
                </div>

                <div className="relative">
                  <motion.button
                    ref={exportButtonRef}
                    onClick={() => {
                      setExportOpen(!exportOpen)
                      setShareOpen(false)
                    }}
                    className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-white/30 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Export results as JSON, CSV, or PDF"
                    aria-expanded={exportOpen}
                    aria-haspopup="menu"
                  >
                    <Download className="w-4 h-4" />
                    <span className="font-medium hidden sm:inline">Export</span>
                  </motion.button>
                  <ExportPopover
                    isOpen={exportOpen}
                    onClose={() => setExportOpen(false)}
                    buttonRef={exportButtonRef}
                    data={data}
                  />
                </div>
              </div>
            </div>

            {/* Title Section */}
            <div className="text-center">
              <motion.div
                className="inline-flex items-center gap-2 mb-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                <Sparkles className="w-8 h-8 text-primary-500" />
              </motion.div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="gradient-text">Your Perfect Areas</span>
              </h1>

              <GlassCard hover={false} className="inline-flex items-center gap-4 px-6 py-3">
                <div className="text-left">
                  <p className="text-sm text-gray-600">Persona</p>
                  <p className="font-bold text-gray-900 capitalize">{data.persona}</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-left">
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="font-bold text-gray-900">£{data.budget.toLocaleString()}/mo</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-left">
                  <p className="text-sm text-gray-600">Results</p>
                  <p className="font-bold text-gray-900">{data.recommendations.length} areas</p>
                </div>
              </GlassCard>
            </div>
          </motion.div>

          {/* Recommendations Grid */}
          <div className="space-y-6">
            {data.recommendations.length === 0 ? (
              <EmptyState
                variant="no-results"
                onAction={() => router.push('/')}
                actionLabel="Adjust Search Criteria"
              />
            ) : (
              data.recommendations.map((rec, index) => (
                <RecommendationCard
                  key={rec.rank}
                  recommendation={rec}
                  index={index}
                  isHero={index === 0}
                />
              ))
            )}
          </div>

          {/* Footer Actions */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <GlassCard hover={false} className="inline-block p-6">
              <p className="text-sm text-gray-600 mb-4">
                Want to refine your search or try different criteria?
              </p>
              <AnimatedButton
                onClick={() => router.push('/')}
                variant="primary"
              >
                Start New Search
              </AnimatedButton>
            </GlassCard>
          </motion.div>

          {/* Data Attribution */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p className="text-xs text-gray-500">
              Data sources: UK Police • Transport for London • OpenStreetMap • Ofsted
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Powered by AI • Updated in real-time
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
