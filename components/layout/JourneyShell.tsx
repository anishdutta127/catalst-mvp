'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { ChatZone } from './ChatZone';
import { PipFloater } from './PipFloater';
import { useUIStore } from '@/lib/store/uiStore';
import { SCREEN_BACKGROUNDS, type ScreenId } from '@/lib/constants';

interface JourneyShellProps {
  currentScreen: ScreenId;
  completedScreens: ScreenId[];
  children: ReactNode;
  ctaContent?: ReactNode;
  ctaVisible?: boolean;
}

/**
 * JourneyShell — full-bleed background, full-width chat/header strips, 720px activity column.
 *
 * Fixes:
 *   - Chat backdrop moved from inside 720px column to full-viewport-width strip.
 *     (The old column edge against the chat's dark rgba bg was drawing the hairline.)
 *   - AnimatePresence modes unified to 'wait' — no more bg/content timing mismatch.
 *   - Header + chat strip use flex column, activity zone scoped with relative/absolute.
 */
export function JourneyShell({
  currentScreen,
  completedScreens,
  children,
  ctaContent,
  ctaVisible = true,
}: JourneyShellProps) {
  const bgImage = SCREEN_BACKGROUNDS[currentScreen];
  const messages = useUIStore((s) => s.messageQueue);
  const hasChatContent = messages.length > 0 && currentScreen !== 's00';

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-dark flex flex-col">
      {/* Background — full bleed, absolute behind everything */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            {bgImage && (
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-dark/50 via-dark/20 to-dark/60" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FULL-WIDTH header strip (no column edge = no hairline) */}
      <div className="relative z-10 shrink-0">
        <Header currentScreen={currentScreen} completedScreens={completedScreens} />
      </div>

      {/* CENTERED chat card — backdrop wrapped to inner column, not full-bleed */}
      <AnimatePresence initial={false}>
        {hasChatContent && (
          <motion.div
            key="chatstrip"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative z-10 shrink-0 px-4 pt-3"
          >
            <div
              className="mx-auto w-full max-w-[720px] rounded-xl overflow-hidden"
              style={{
                background: 'rgba(0, 0, 0, 0.58)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <ChatZone />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity zone — scoped 720px column, relative so scoped sheets + PipFloater work */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <div className="mx-auto w-full max-w-[720px] h-full relative px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="w-full h-full overflow-y-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>

          {/* Pip lives in the activity zone, bottom-right */}
          <PipFloater />
        </div>
      </div>

      {/* CTA zone */}
      {ctaVisible && ctaContent && (
        <div className="relative z-10 shrink-0 px-4 pb-4 pt-2">
          <div className="mx-auto w-full max-w-[720px]">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {ctaContent}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
