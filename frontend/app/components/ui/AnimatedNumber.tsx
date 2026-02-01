'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AnimatedNumberProps {
    value: number
    duration?: number
    className?: string
    suffix?: string
    prefix?: string
}

export default function AnimatedNumber({
    value,
    duration = 1,
    className = '',
    suffix = '',
    prefix = ''
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(0)

    const spring = useSpring(0, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    useEffect(() => {
        spring.set(value)

        const unsubscribe = spring.on('change', (latest) => {
            setDisplayValue(Math.round(latest))
        })

        return () => unsubscribe()
    }, [value, spring])

    return (
        <motion.span
            className={className}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {prefix}{displayValue}{suffix}
        </motion.span>
    )
}
