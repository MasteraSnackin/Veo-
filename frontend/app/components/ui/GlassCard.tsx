'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  variant?: 'default' | 'large' | 'dark'
  hover?: boolean
  className?: string
}

export default function GlassCard({
  children,
  variant = 'default',
  hover = true,
  className = '',
  ...props
}: GlassCardProps) {
  const baseClass = variant === 'large'
    ? 'glass-card-lg'
    : variant === 'dark'
    ? 'glass-dark'
    : 'glass-card'

  const hoverClass = hover ? 'interactive-card' : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`${baseClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
