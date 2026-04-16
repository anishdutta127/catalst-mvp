'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MilestoneBar } from '@/components/shared/MilestoneBar';
import type { ScreenId } from '@/lib/constants';

interface HeaderProps {
  currentScreen: ScreenId;
  completedScreens: ScreenId[];
}

export function Header({ currentScreen, completedScreens }: HeaderProps) {
  const isGateway = currentScreen === 's00';

  return (
    <header className="absolute top-0 left-0 right-0 z-30 px-4 pt-3 pb-2">
      <div className="max-w-[720px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <AnimatePresence mode="wait">
          {isGateway ? (
            <motion.div
              key="full-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-lg tracking-[0.4em] text-gold/80 font-semibold uppercase"
            >
              ✦ CATALST ✦
            </motion.div>
          ) : (
            <motion.div
              key="mini-logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs tracking-[0.3em] text-gold/60 font-semibold uppercase"
            >
              CATALST
            </motion.div>
          )}
        </AnimatePresence>

        {/* Milestone bar — visible after gateway */}
        <AnimatePresence>
          {!isGateway && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <MilestoneBar
                currentScreen={currentScreen}
                completedScreens={completedScreens}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
