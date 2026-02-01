'use client'

import { ReactNode } from 'react'

interface BentoGridProps {
  children: ReactNode
  className?: string
}

export default function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <div className={`bento-grid grid-cols-1 md:grid-cols-12 ${className}`}>
      {children}
    </div>
  )
}

interface BentoItemProps {
  children: ReactNode
  className?: string
  colSpan?: string
  rowSpan?: string
}

export function BentoItem({
  children,
  className = '',
  colSpan = 'md:col-span-6',
  rowSpan = ''
}: BentoItemProps) {
  return (
    <div className={`${colSpan} ${rowSpan} ${className}`}>
      {children}
    </div>
  )
}
