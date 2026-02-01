'use client'

import { motion } from 'framer-motion'
import { Home, ShoppingBag } from 'lucide-react'

interface LocationToggleProps {
  value: string
  onChange: (value: string) => void
}

export default function LocationToggle({ value, onChange }: LocationToggleProps) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Looking to...</h3>

      <div className="grid grid-cols-2 gap-3">
        <motion.button
          onClick={() => onChange('rent')}
          className={`
            relative p-4 rounded-xl transition-all duration-300
            ${value === 'rent'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
              : 'bg-white/50 text-gray-700 hover:bg-white/70'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Home className="w-6 h-6 mx-auto mb-2" />
          <span className="block text-sm font-semibold">Rent</span>

          {value === 'rent' && (
            <motion.div
              layoutId="activeToggle"
              className="absolute inset-0 border-2 border-white rounded-xl"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>

        <motion.button
          onClick={() => onChange('buy')}
          className={`
            relative p-4 rounded-xl transition-all duration-300
            ${value === 'buy'
              ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg'
              : 'bg-white/50 text-gray-700 hover:bg-white/70'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ShoppingBag className="w-6 h-6 mx-auto mb-2" />
          <span className="block text-sm font-semibold">Buy</span>

          {value === 'buy' && (
            <motion.div
              layoutId="activeToggle"
              className="absolute inset-0 border-2 border-white rounded-xl"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
      </div>
    </div>
  )
}
