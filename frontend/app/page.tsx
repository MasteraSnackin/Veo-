'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, MapPin, Zap, Shield } from 'lucide-react'
import BentoGrid, { BentoItem } from './components/ui/BentoGrid'
import GlassCard from './components/ui/GlassCard'
import PersonaTile from './components/forms/PersonaTile'
import BudgetSlider from './components/forms/BudgetSlider'
import LocationToggle from './components/forms/LocationToggle'
import AnimatedButton from './components/ui/AnimatedButton'
import { useToast } from './components/ui/ToastProvider'

export default function Home() {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    persona: 'student',
    budget: 1000,
    locationType: 'rent',
    destination: 'UCL',
    maxAreas: 5
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const data = await response.json()

      sessionStorage.setItem('recommendations', JSON.stringify(data))
      toast.success('Recommendations loaded!', 'Taking you to your perfect areas...')

      setTimeout(() => {
        router.push('/results')
      }, 500)
    } catch (error) {
      console.error('Error:', error)
      toast.error(
        'Unable to load recommendations',
        'Please check your connection and try again. If the problem persists, try adjusting your search criteria.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Gradient Mesh Background */}
      <div className="fixed inset-0 mesh-background opacity-30 -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 -z-10" />

      {/* Content */}
      <div className="relative z-10 min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 mb-6"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <Sparkles className="w-8 h-8 text-primary-500" />
            </motion.div>

            <h1 className="text-6xl md:text-7xl font-bold mb-4">
              <span className="gradient-text">Veo</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 text-balance max-w-2xl mx-auto">
              AI-Powered Housing Recommendations for London
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Discover your perfect neighborhood with intelligent, data-driven insights
            </p>
          </motion.div>

          {/* Main Form - Bento Grid */}
          <form onSubmit={handleSubmit}>
            <BentoGrid className="max-w-5xl mx-auto mb-8">
              {/* Persona Selection - Large Tile */}
              <BentoItem colSpan="md:col-span-12" className="mb-2">
                <GlassCard hover={false} className="p-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    I am a...
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PersonaTile
                      persona="student"
                      selected={formData.persona === 'student'}
                      onClick={() => setFormData({ ...formData, persona: 'student' })}
                    />
                    <PersonaTile
                      persona="parent"
                      selected={formData.persona === 'parent'}
                      onClick={() => setFormData({ ...formData, persona: 'parent' })}
                    />
                    <PersonaTile
                      persona="developer"
                      selected={formData.persona === 'developer'}
                      onClick={() => setFormData({ ...formData, persona: 'developer' })}
                    />
                  </div>
                </GlassCard>
              </BentoItem>

              {/* Budget Slider */}
              <BentoItem colSpan="md:col-span-7">
                <BudgetSlider
                  value={formData.budget}
                  onChange={(budget) => setFormData({ ...formData, budget })}
                />
              </BentoItem>

              {/* Location Type */}
              <BentoItem colSpan="md:col-span-5">
                <LocationToggle
                  value={formData.locationType}
                  onChange={(locationType) => setFormData({ ...formData, locationType })}
                />
              </BentoItem>

              {/* Destination (Conditional) */}
              {formData.persona === 'student' && (
                <BentoItem colSpan="md:col-span-7">
                  <GlassCard hover={false} className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-700">University/Destination</h3>
                    </div>
                    <select
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 focus-ring text-gray-900 font-medium"
                    >
                      <option value="UCL">UCL (University College London)</option>
                      <option value="Imperial">Imperial College London</option>
                      <option value="KCL">King's College London</option>
                      <option value="LSE">London School of Economics</option>
                    </select>
                  </GlassCard>
                </BentoItem>
              )}

              {/* Max Areas Slider */}
              <BentoItem colSpan={formData.persona === 'student' ? 'md:col-span-5' : 'md:col-span-12'}>
                <GlassCard hover={false} className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-700">Number of Recommendations</h3>
                      <p className="text-2xl font-bold text-gray-900">{formData.maxAreas}</p>
                    </div>
                  </div>
                  <input
                    type="range"
                    value={formData.maxAreas}
                    onChange={(e) => setFormData({ ...formData, maxAreas: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    min="3"
                    max="10"
                    style={{
                      background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${((formData.maxAreas - 3) / 7) * 100}%, #e5e7eb ${((formData.maxAreas - 3) / 7) * 100}%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>3</span>
                    <span>10</span>
                  </div>
                </GlassCard>
              </BentoItem>

              {/* Submit Button */}
              <BentoItem colSpan="md:col-span-12">
                <AnimatedButton
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  className="w-full py-5 text-lg"
                >
                  {loading ? 'Finding your perfect areas...' : 'Get AI Recommendations ✨'}
                </AnimatedButton>
              </BentoItem>
            </BentoGrid>
          </form>

          {/* Feature Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <GlassCard className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Real London Data</h3>
              <p className="text-sm text-gray-600">
                Live data from TfL, UK Police, and property APIs
              </p>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-gray-600">
                Intelligent scoring and personalized explanations
              </p>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Transparent Scoring</h3>
              <p className="text-sm text-gray-600">
                See exactly why each area was recommended
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
