'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CTABarProps {
  children?: ReactNode;
  visible?: boolean;
}

/**
 * CTABar — occupies the "cta" grid area.
 * No longer absolute. Background gradient applied to blend with the dark bottom.
 */
export function CTABar({ children, visible = true }: CTABarProps) {
  return (
    <div className="h-full px-4 flex items-center justify-center bg-gradient-to-t from-dark to-dark/80">
      <div className="mx-auto w-full max-w-[720px] flex flex-col items-center gap-2">
        <AnimatePresence>
          {visible && children && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center gap-2"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
