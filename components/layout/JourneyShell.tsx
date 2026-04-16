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
 * JourneyShell — full-viewport container using CSS Grid with named areas.
 *
 * Grid layout (top to bottom):
 *   header    — CATALST wordmark + milestone bar
 *   dialogue  — Cedric/Pip message strip (reserved space, not overlay)
 *   activity  — screen-specific interactions (1fr)
 *   pip       — Pip character zone (auto height)
 *   cta       — sticky action buttons
 *
 * Background: full-bleed Midjourney image with dark vignette overlay.
 * Content: max-w-[720px] centered on desktop, full-width with padding on mobile.
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
    <div className="journey-shell relative h-dvh w-full overflow-hidden bg-dark">
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

      {/* Grid container — sits above background */}
      <div className="relative z-10 grid h-dvh journey-grid">
        {/* Zone 1: Header */}
        <div className="[grid-area:header]">
          <Header
            currentScreen={currentScreen}
            completedScreens={completedScreens}
          />
        </div>

        {/* Zone 2: Dialogue strip (reserved space, not overlay) */}
        <div className="[grid-area:dialogue] overflow-y-auto">
          <DialogueStrip />
        </div>

        {/* Zone 3: Activity area — screen content */}
        <div className="[grid-area:activity] overflow-y-auto px-4">
          <div className="mx-auto w-full max-w-[720px] h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Zone 4: Pip character (singleton renders here, controlled by store) */}
        <div className="[grid-area:pip] flex items-center justify-center">
          {/* PipCharacter will render here in a later gate */}
        </div>

        {/* Zone 5: CTA bar */}
        <div className="[grid-area:cta]">
          <CTABar visible={ctaVisible}>
            {ctaContent}
          </CTABar>
        </div>
      </div>

      {/* Optional footer (absolute, outside grid) */}
      {footerContent && (
        <div className="absolute bottom-1 left-0 right-0 z-20 flex justify-center">
          <span className="text-xs text-ivory/20">{footerContent}</span>
        </div>
      )}
    </div>
  );
}
