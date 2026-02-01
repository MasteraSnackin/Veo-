'use client'

import { motion } from 'framer-motion'
import { GraduationCap, Users, Building2 } from 'lucide-react'

interface PersonaTileProps {
  persona: string
  selected: boolean
  onClick: () => void
}

const personaConfig = {
  student: {
    icon: GraduationCap,
    title: 'Student',
    description: 'Near campus, affordable, social',
    gradient: 'from-blue-500 to-cyan-500',
  },
  parent: {
    icon: Users,
    title: 'Parent',
    description: 'Family-friendly, safe, schools',
    gradient: 'from-purple-500 to-pink-500',
  },
  developer: {
    icon: Building2,
    title: 'Developer',
    description: 'Investment potential, growth',
    gradient: 'from-orange-500 to-red-500',
  },
}

export default function PersonaTile({ persona, selected, onClick }: PersonaTileProps) {
  const config = personaConfig[persona as keyof typeof personaConfig]
  const Icon = config.icon

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative p-6 rounded-2xl overflow-hidden
        transition-all duration-300
        ${selected
          ? 'glass-card-lg ring-2 ring-white/50 shadow-neon'
          : 'glass-card hover:glass-card-lg'
        }
      `}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-${selected ? '20' : '10'} transition-opacity`}
      />

      {/* Content */}
      <div className="relative z-10">
        <motion.div
          animate={{ rotate: selected ? 360 : 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-3"
        >
          <Icon className={`w-10 h-10 ${selected ? 'text-white' : 'text-gray-700'}`} />
        </motion.div>

        <h3 className={`text-xl font-bold mb-1 ${selected ? 'text-white' : 'text-gray-900'}`}>
          {config.title}
        </h3>
        <p className={`text-sm ${selected ? 'text-white/80' : 'text-gray-600'}`}>
          {config.description}
        </p>
      </div>

      {/* Selection indicator */}
      {selected && (
        <motion.div
          className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        >
          <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
      )}
    </motion.button>
  )
}
