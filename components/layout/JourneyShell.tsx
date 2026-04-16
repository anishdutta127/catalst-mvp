'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { DialogueStrip } from './DialogueStrip';
import { CTABar } from './CTABar';
import { SCREEN_BACKGROUNDS, type ScreenId } from '@/lib/constants';

interface JourneyShellProps {
  currentScreen: ScreenId;
  completedScreens: ScreenId[];
  children: ReactNode;
  ctaContent?: ReactNode;
  ctaVisible?: boolean;
  footerContent?: ReactNode;
}

/**
 * JourneyShell — the full-viewport container implementing Option C layout.
 *
 * Layers (bottom to top):
 * - Background image (full bleed, crossfade transitions)
 * - Dark gradient overlay (readability)
 * - Activity area (centered content slot)
 * - Dialogue strip (overlay at top)
 * - Header (absolute top)
 * - CTA bar (sticky bottom)
 */
export function JourneyShell({
  currentScreen,
  completedScreens,
  children,
  ctaContent,
  ctaVisible = true,
  footerContent,
}: JourneyShellProps) {
  const bgImage = SCREEN_BACKGROUNDS[currentScreen];

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-dark">
      {/* Background layer — crossfade between screens */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {bgImage && (
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage})` }}
              />
            )}
            {/* Dark vignette for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-dark/50 via-dark/60 to-dark/85" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Header */}
      <Header
        currentScreen={currentScreen}
        completedScreens={completedScreens}
      />

      {/* Dialogue overlay */}
      <DialogueStrip />

      {/* Activity area — centered content slot */}
      <main
        className="relative z-10 flex items-center justify-center px-4"
        style={{ height: 'calc(100dvh - 120px)', marginTop: '48px' }}
      >
        <div className="w-full max-w-[720px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* CTA bar */}
      <CTABar visible={ctaVisible}>
        {ctaContent}
      </CTABar>

      {/* Optional footer */}
      {footerContent && (
        <div className="absolute bottom-1 left-0 right-0 z-20 flex justify-center">
          <span className="text-xs text-ivory/20">{footerContent}</span>
        </div>
      )}
    </div>
  );
}
