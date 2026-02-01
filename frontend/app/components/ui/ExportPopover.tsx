'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Download, FileText, Image, X } from 'lucide-react'
import { useToast } from './ToastProvider'

interface ExportPopoverProps {
    isOpen: boolean
    onClose: () => void
    buttonRef: React.RefObject<HTMLButtonElement>
    data?: any
}

export default function ExportPopover({ isOpen, onClose, buttonRef, data }: ExportPopoverProps) {
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

    const handleExportJSON = () => {
        try {
            const jsonStr = JSON.stringify(data, null, 2)
            const blob = new Blob([jsonStr], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `veo-recommendations-${Date.now()}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success('Exported successfully!', 'Downloaded as JSON file')
            onClose()
        } catch (error) {
            toast.error('Export failed', 'Please try again')
        }
    }

    const handleExportCSV = () => {
        try {
            if (!data || !data.recommendations || data.recommendations.length === 0) {
                toast.warning('No data to export', 'Try running a search first')
                return
            }

            const headers = ['Rank', 'Name', 'Area Code', 'Score', ...Object.keys(data.recommendations[0].factors)]
            const rows = data.recommendations.map((rec: any) => [
                rec.rank,
                rec.name,
                rec.areaCode,
                rec.score,
                ...Object.values(rec.factors)
            ])

            const csvContent = [
                headers.join(','),
                ...rows.map((row: any[]) => row.join(','))
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `veo-recommendations-${Date.now()}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success('Exported successfully!', 'Downloaded as CSV file')
            onClose()
        } catch (error) {
            toast.error('Export failed', 'Please try again')
        }
    }

    const handlePrint = () => {
        window.print()
        toast.info('Print dialog opened', 'Save as PDF or print')
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
                            <Download className="w-4 h-4 text-primary-600" />
                            <h3 className="font-semibold text-gray-900">Export Results</h3>
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
                            onClick={handleExportJSON}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors text-left"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <FileText className="w-5 h-5 text-gray-700" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">JSON</p>
                                <p className="text-xs text-gray-600">Full data export</p>
                            </div>
                        </motion.button>

                        <motion.button
                            onClick={handleExportCSV}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors text-left"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <FileText className="w-5 h-5 text-gray-700" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">CSV</p>
                                <p className="text-xs text-gray-600">Spreadsheet format</p>
                            </div>
                        </motion.button>

                        <motion.button
                            onClick={handlePrint}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors text-left"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Image className="w-5 h-5 text-gray-700" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">PDF / Print</p>
                                <p className="text-xs text-gray-600">Save or print</p>
                            </div>
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
