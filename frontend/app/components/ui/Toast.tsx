'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
    id: string
    type: ToastType
    title: string
    message?: string
    duration?: number
    onClose: (id: string) => void
}

const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
}

const colors = {
    success: 'from-green-500 to-emerald-500',
    error: 'from-red-500 to-rose-500',
    info: 'from-blue-500 to-cyan-500',
    warning: 'from-orange-500 to-yellow-500',
}

export default function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
    const Icon = icons[type]

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id)
        }, duration)

        return () => clearTimeout(timer)
    }, [id, duration, onClose])

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="glass-card-lg w-full max-w-md p-4 pointer-events-auto"
        >
            <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${colors[type]} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    {message && (
                        <p className="mt-1 text-sm text-gray-600">{message}</p>
                    )}
                </div>

                <button
                    onClick={() => onClose(id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Progress bar */}
            <motion.div
                className={`mt-3 h-1 rounded-full bg-gradient-to-r ${colors[type]} opacity-50`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
            />
        </motion.div>
    )
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastProps[], onClose: (id: string) => void }) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} onClose={onClose} />
                ))}
            </AnimatePresence>
        </div>
    )
}
