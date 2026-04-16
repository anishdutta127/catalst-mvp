'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CTABarProps {
  children?: ReactNode;
  visible?: boolean;
}

export function CTABar({ children, visible = true }: CTABarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-8 bg-gradient-to-t from-dark via-dark/80 to-transparent pointer-events-none">
      <div className="max-w-[720px] mx-auto flex flex-col items-center gap-2 pointer-events-auto">
        <AnimatePresence>
          {visible && children && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
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
