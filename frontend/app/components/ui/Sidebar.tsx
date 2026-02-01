'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Home, Search, History, Settings, Menu, X, User, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface NavItem {
    icon: typeof Home
    label: string
    href: string
    badge?: number
}

const navItems: NavItem[] = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Search, label: 'Search', href: '/#search' },
    { icon: History, label: 'History', href: '/history' },
]

const secondaryItems: NavItem[] = [
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: HelpCircle, label: 'Help', href: '/help' },
]

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/' || pathname === '/results'
        }
        return pathname.startsWith(href)
    }

    const handleNavigation = (href: string) => {
        router.push(href)
        setIsMobileOpen(false)
    }

    return (
        <>
            {/* Mobile Menu Button */}
            <motion.button
                className="fixed top-4 left-4 z-50 md:hidden glass-card p-3 rounded-xl"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>

            {/* Desktop Sidebar */}
            <motion.aside
                className="hidden md:flex flex-col fixed left-0 top-0 h-screen bg-white/5 backdrop-blur-xl border-r border-white/10 z-40"
                initial={false}
                animate={{ width: isCollapsed ? '80px' : '240px' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                <div className="flex flex-col h-full">
                    {/* Logo & Collapse Toggle */}
                    <div className="p-6 flex items-center justify-between">
                        <AnimatePresence mode="wait">
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">V</span>
                                    </div>
                                    <span className="font-bold text-lg gradient-text">Veo</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Menu className="w-5 h-5 text-gray-600" />
                        </motion.button>
                    </div>

                    {/* Primary Navigation */}
                    <nav className="flex-1 px-3">
                        <div className="space-y-1">
                            {navItems.map((item) => (
                                <SidebarItem
                                    key={item.href}
                                    item={item}
                                    isActive={isActive(item.href)}
                                    isCollapsed={isCollapsed}
                                    onClick={() => handleNavigation(item.href)}
                                />
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="my-4 h-px bg-white/10" />

                        {/* Secondary Navigation */}
                        <div className="space-y-1">
                            {secondaryItems.map((item) => (
                                <SidebarItem
                                    key={item.href}
                                    item={item}
                                    isActive={isActive(item.href)}
                                    isCollapsed={isCollapsed}
                                    onClick={() => handleNavigation(item.href)}
                                />
                            ))}
                        </div>
                    </nav>

                    {/* User Profile */}
                    <div className="p-3 border-t border-white/10">
                        <motion.div
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">User</p>
                                    <p className="text-xs text-gray-500 truncate">View profile</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </motion.aside>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                        />

                        {/* Sidebar */}
                        <motion.aside
                            className="fixed left-0 top-0 h-screen w-64 bg-white/95 backdrop-blur-xl border-r border-white/20 z-50 md:hidden"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <div className="flex flex-col h-full">
                                {/* Logo */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center">
                                            <span className="text-white font-bold">V</span>
                                        </div>
                                        <span className="font-bold text-xl gradient-text">Veo</span>
                                    </div>
                                </div>

                                {/* Navigation */}
                                <nav className="flex-1 px-3">
                                    <div className="space-y-1">
                                        {navItems.map((item) => (
                                            <SidebarItem
                                                key={item.href}
                                                item={item}
                                                isActive={isActive(item.href)}
                                                isCollapsed={false}
                                                onClick={() => handleNavigation(item.href)}
                                            />
                                        ))}
                                    </div>

                                    <div className="my-4 h-px bg-white/20" />

                                    <div className="space-y-1">
                                        {secondaryItems.map((item) => (
                                            <SidebarItem
                                                key={item.href}
                                                item={item}
                                                isActive={isActive(item.href)}
                                                isCollapsed={false}
                                                onClick={() => handleNavigation(item.href)}
                                            />
                                        ))}
                                    </div>
                                </nav>

                                {/* User Profile */}
                                <div className="p-3 border-t border-white/20">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-900">User</p>
                                            <p className="text-xs text-gray-500">View profile</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

interface SidebarItemProps {
    item: NavItem
    isActive: boolean
    isCollapsed: boolean
    onClick: () => void
}

function SidebarItem({ item, isActive, isCollapsed, onClick }: SidebarItemProps) {
    const Icon = item.icon

    return (
        <motion.button
            onClick={onClick}
            className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl
        transition-all duration-200
        ${isActive
                    ? 'bg-gradient-to-r from-primary-500/10 to-accent-purple/10 text-primary-600 font-semibold shadow-sm'
                    : 'text-gray-600 hover:bg-white/5 hover:text-gray-900'
                }
      `}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : ''}`} />
            {!isCollapsed && (
                <span className="flex-1 text-left text-sm">{item.label}</span>
            )}
            {!isCollapsed && item.badge && (
                <span className="px-2 py-0.5 bg-primary-500 text-white text-xs font-bold rounded-full">
                    {item.badge}
                </span>
            )}
        </motion.button>
    )
}
