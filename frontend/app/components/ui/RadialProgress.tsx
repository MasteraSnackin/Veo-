'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface RadialProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  showValue?: boolean
}

export default function RadialProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color = '#0ea5e9',
  label = '',
  showValue = true,
}: RadialProgressProps) {
  const [mounted, setMounted] = useState(false)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: mounted ? offset : circumference }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <motion.span
            className="text-2xl font-bold text-gray-900"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {value}
          </motion.span>
        )}
        {label && (
          <span className="text-xs text-gray-500 font-medium">{label}</span>
        )}
      </div>
    </div>
  )
}
