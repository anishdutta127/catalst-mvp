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
 * JourneyShell — three-zone layout.
 *
 * Background: full-bleed viewport.
 * Content: single max-w-[720px] centered column.
 * Chat zone dark bg is column-width, NOT viewport-width.
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
      {/* Background — full bleed viewport */}
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
            <div className="absolute inset-0 bg-gradient-to-b from-dark/50 via-dark/20 to-dark/60" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content column — centered, max-w-[720px] */}
      <div className="relative z-10 h-dvh mx-auto w-full max-w-[720px] flex flex-col">
        {/* ZONE 1a: Header (48px) */}
        <div className="shrink-0 h-12">
          <Header currentScreen={currentScreen} completedScreens={completedScreens} />
        </div>

        {/* ZONE 1b: Chat zone (column-width dark bg, rounded bottom) */}
        <div
          className="shrink-0 overflow-hidden"
          style={{
            height: 120,
            background: 'rgba(0,0,0,0.55)',
            borderRadius: '0 0 12px 12px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <ChatZone />
        </div>

        {/* ZONE 2: Activity (transparent, flex-1, background shows through) */}
        <div className="flex-1 overflow-y-auto relative px-4">
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

        {/* ZONE 3: CTA (64px, dark overlay, column-width) */}
        <div
          className="shrink-0 flex items-center justify-center px-4"
          style={{
            height: 64,
            background: 'rgba(0,0,0,0.7)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px 12px 0 0',
          }}
        >
          <div className="w-full flex flex-col items-center">
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
