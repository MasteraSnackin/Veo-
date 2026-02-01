'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Share2, Link2, Mail, MessageCircle, X, Check } from 'lucide-react'
import { useToast } from './ToastProvider'

interface SharePopoverProps {
    isOpen: boolean
    onClose: () => void
    buttonRef: React.RefObject<HTMLButtonElement>
}

export default function SharePopover({ isOpen, onClose, buttonRef }: SharePopoverProps) {
    const [copied, setCopied] = useState(false)
    const toast = useToast()
    const popoverRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose, buttonRef])

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
            setCopied(true)
            toast.success('Link copied!', 'Share this URL with others')
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            toast.error('Failed to copy', 'Please try again')
        }
    }

    const handleShareEmail = () => {
        const subject = encodeURIComponent('Check out these housing recommendations')
        const body = encodeURIComponent(`I found some great areas on Veo:\n\n${window.location.href}`)
        window.location.href = `mailto:?subject=${subject}&body=${body}`
        onClose()
    }

    const handleShareSMS = () => {
        const body = encodeURIComponent(`Check out these housing recommendations: ${window.location.href}`)
        window.location.href = `sms:?body=${body}`
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-64 glass-card-lg rounded-2xl p-4 shadow-2xl z-50"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-primary-600" />
                            <h3 className="font-semibold text-gray-900">Share Results</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <motion.button
                            onClick={handleCopyLink}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors text-left"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {copied ? (
                                <Check className="w-5 h-5 text-green-600" />
                            ) : (
                                <Link2 className="w-5 h-5 text-gray-700" />
                            )}
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </p>
                                <p className="text-xs text-gray-600">Share via URL</p>
                            </div>
                        </motion.button>

                        <motion.button
                            onClick={handleShareEmail}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors text-left"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Mail className="w-5 h-5 text-gray-700" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Email</p>
                                <p className="text-xs text-gray-600">Send via email</p>
                            </div>
                        </motion.button>

                        <motion.button
                            onClick={handleShareSMS}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors text-left"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <MessageCircle className="w-5 h-5 text-gray-700" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Message</p>
                                <p className="text-xs text-gray-600">Send via SMS</p>
                            </div>
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
