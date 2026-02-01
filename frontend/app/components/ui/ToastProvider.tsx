'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { ToastContainer, ToastProps, ToastType } from './Toast'

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void
    success: (title: string, message?: string) => void
    error: (title: string, message?: string) => void
    info: (title: string, message?: string) => void
    warning: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastProps[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    const showToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
        const id = Math.random().toString(36).substring(7)
        setToasts((prev) => [
            ...prev,
            {
                id,
                type,
                title,
                message,
                duration,
                onClose: removeToast,
            },
        ])
    }, [removeToast])

    const success = useCallback((title: string, message?: string) => {
        showToast('success', title, message)
    }, [showToast])

    const error = useCallback((title: string, message?: string) => {
        showToast('error', title, message)
    }, [showToast])

    const info = useCallback((title: string, message?: string) => {
        showToast('info', title, message)
    }, [showToast])

    const warning = useCallback((title: string, message?: string) => {
        showToast('warning', title, message)
    }, [showToast])

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
            {children}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}
