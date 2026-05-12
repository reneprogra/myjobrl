'use client'

import { motion } from 'framer-motion'

/**
 * Wraps page content with a 0.2s fade-in on mount.
 * Used in app/(app)/layout.tsx around {children}.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
