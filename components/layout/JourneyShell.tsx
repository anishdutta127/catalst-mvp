'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { ChatZone } from './ChatZone';
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
 * JourneyShell — three-zone layout enforced by CSS Grid.
 *
 * ZONE 1: header (48px) + chat (140px) — fixed, dark overlay
 * ZONE 2: activity (1fr) — TRANSPARENT, background shows through
 * ZONE 3: cta (64px) — fixed, dark overlay
 *
 * Background: full-bleed Midjourney image with dark vignette.
 * The background IS the design. Activity zone is transparent.
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
      {/* Background layer */}
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
            {/* Vignette — lighter in center for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-dark/60 via-dark/30 to-dark/70" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Grid container */}
      <div className="relative z-10 grid h-dvh journey-grid">
        {/* ZONE 1a: Header (48px) */}
        <div className="[grid-area:header]">
          <Header currentScreen={currentScreen} completedScreens={completedScreens} />
        </div>

        {/* ZONE 1b: Chat zone (140px, dark overlay) */}
        <div className="[grid-area:chat] overflow-hidden">
          <ChatZone />
        </div>

        {/* ZONE 2: Activity (transparent — background shows through) */}
        <div className="[grid-area:activity] overflow-y-auto relative">
          <div className="mx-auto w-full max-w-[720px] h-full px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.1 } }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                className="w-full h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ZONE 3: CTA (64px, dark overlay) */}
        <div
          className="[grid-area:cta] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="mx-auto w-full max-w-[720px] flex flex-col items-center">
            <AnimatePresence>
              {ctaVisible && ctaContent && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col items-center"
                >
                  {ctaContent}
                </motion.div>
              )}
            </AnimatePresence>
            {footerContent && (
              <span className="text-[10px] text-ivory/20 mt-1">{footerContent}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
