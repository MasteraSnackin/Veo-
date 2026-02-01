import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from './components/ui/ToastProvider'
import Sidebar from './components/ui/Sidebar'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Veo - AI-Powered Housing Recommendations',
  description: 'Discover your perfect London neighborhood with intelligent, data-driven insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <ToastProvider>
          <Sidebar />
          <div className="md:pl-[240px]">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}
