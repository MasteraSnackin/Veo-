'use client'

import { motion } from 'framer-motion'
import { MapPin, TrendingUp, TrendingDown } from 'lucide-react'
import RadialProgress from '../ui/RadialProgress'
import AnimatedNumber from '../ui/AnimatedNumber'

interface Recommendation {
  rank: number
  name: string
  areaCode: string
  score: number
  factors: Record<string, number>
  strengths: string[]
  weaknesses: string[]
}

interface RecommendationCardProps {
  recommendation: Recommendation
  index: number
  isHero?: boolean
}

export default function RecommendationCard({
  recommendation,
  index,
  isHero = false,
}: RecommendationCardProps) {
  const { rank, name, areaCode, score, factors, strengths, weaknesses } = recommendation

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`
        glass-card-lg p-8 interactive-card
        ${isHero ? 'md:col-span-12 bg-gradient-to-br from-primary-500/20 to-accent-purple/20' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Rank Badge */}
          <motion.div
            className={`
              flex items-center justify-center rounded-2xl font-bold
              ${isHero
                ? 'w-16 h-16 text-2xl bg-gradient-to-br from-primary-500 to-accent-purple text-white shadow-neon'
                : 'w-12 h-12 text-lg bg-gradient-to-br from-gray-700 to-gray-900 text-white'
              }
            `}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            #{rank}
          </motion.div>

          {/* Name & Location */}
          <div>
            <h2 className={`font-bold text-gray-900 ${isHero ? 'text-3xl' : 'text-2xl'}`}>
              {name}
            </h2>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{areaCode}</span>
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center">
          <RadialProgress
            value={score}
            size={isHero ? 140 : 100}
            strokeWidth={isHero ? 10 : 8}
            color={score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}
          />
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Factor Scores</h3>
        <div className={`grid gap-3 ${isHero ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
          {Object.entries(factors).map(([factor, factorScore]) => (
            <motion.div
              key={factor}
              className="bg-white/50 backdrop-blur-sm rounded-xl p-3"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {factor}
                </span>
                <AnimatedNumber value={factorScore} className="text-sm font-bold text-gray-900" />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-2 rounded-full ${factorScore >= 70
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : factorScore >= 50
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-r from-red-500 to-pink-500'
                    }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${factorScore}%` }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <motion.div
            className="bg-green-50/50 backdrop-blur-sm rounded-xl p-4 border border-green-200/50"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Strengths</h4>
            </div>
            <ul className="space-y-2">
              {strengths.map((strength, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.5 + i * 0.05 }}
                  className="text-sm text-green-800 capitalize flex items-start gap-2"
                >
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{strength}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {weaknesses.length > 0 && (
          <motion.div
            className="bg-red-50/50 backdrop-blur-sm rounded-xl p-4 border border-red-200/50"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-red-900">Considerations</h4>
            </div>
            <ul className="space-y-2">
              {weaknesses.map((weakness, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.5 + i * 0.05 }}
                  className="text-sm text-red-800 capitalize flex items-start gap-2"
                >
                  <span className="text-red-500 mt-0.5">!</span>
                  <span>{weakness}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
