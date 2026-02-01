'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'glass'
  type?: 'button' | 'submit' | 'reset'
  className?: string
  loading?: boolean
}

export default function AnimatedButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  type = 'button',
  className = '',
  loading = false,
}: AnimatedButtonProps) {
  const baseClass = variant === 'primary' ? 'btn-primary' : 'btn-glass'

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClass} ${className} disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden`}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {loading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}
