'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { ChatZone } from './ChatZone';
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
 * JourneyShell — dynamic layout.
 *
 * Background: full-bleed viewport.
 * Content: max-w-[720px] centered column.
 * Chat zone: dynamic height (0 when empty, auto when messages exist).
 * No footers. No bottom bars except screen-provided CTAs.
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
    <div className="relative h-dvh w-full overflow-hidden bg-dark">
      {/* Background — full bleed */}
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
              <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage})` }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-dark/50 via-dark/20 to-dark/60" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content column */}
      <div className="relative z-10 h-dvh mx-auto w-full max-w-[720px] flex flex-col">
        {/* Header */}
        <div className="shrink-0">
          <Header currentScreen={currentScreen} completedScreens={completedScreens} />
        </div>

        {/* Chat zone — only renders when content exists */}
        {hasChatContent && (
          <div className="shrink-0 px-4 pt-2 pb-1"
            style={{ background: 'rgba(0,0,0,0.55)', borderRadius: '0 0 12px 12px', backdropFilter: 'blur(4px)' }}>
            <ChatZone />
          </div>
        )}

        {/* Activity zone — transparent, flex-1 */}
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

        {/* CTA zone — only renders when screen provides content */}
        {ctaVisible && ctaContent && (
          <div className="shrink-0 px-4 pb-4 pt-2">
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
        )}
      </div>
    </div>
  );
}
