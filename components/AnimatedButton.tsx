'use client'

import { motion } from 'framer-motion'
import type { ComponentPropsWithoutRef } from 'react'

/**
 * Drop-in replacement for <button> with scale-press + spring-release feedback.
 * Usage: import AnimatedButton from '@/components/AnimatedButton'
 *        <AnimatedButton onClick={...} className="...">Label</AnimatedButton>
 */
export default function AnimatedButton({
  children,
  className,
  style,
  disabled,
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
      style={style}
      disabled={disabled}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}
