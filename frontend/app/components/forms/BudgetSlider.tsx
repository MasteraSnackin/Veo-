'use client'

import { motion } from 'framer-motion'
import { Banknote } from 'lucide-react'

interface BudgetSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export default function BudgetSlider({
  value,
  onChange,
  min = 500,
  max = 5000,
  step = 50,
}: BudgetSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
          <Banknote className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700">Monthly Budget</h3>
          <motion.p
            key={value}
            initial={{ scale: 1.2, color: '#10b981' }}
            animate={{ scale: 1, color: '#111827' }}
            className="text-2xl font-bold text-gray-900"
          >
            £{value.toLocaleString()}
          </motion.p>
        </div>
      </div>

      {/* Slider */}
      <div className="relative pt-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
          }}
        />

        {/* Min/Max labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>£{min}</span>
          <span>£{max}</span>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
          transition: all 0.2s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border: none;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  )
}
