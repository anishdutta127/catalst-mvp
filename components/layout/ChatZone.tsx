'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/lib/store/uiStore';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { CedricBubble } from '@/components/characters/CedricBubble';
import { easeSmooth } from '@/lib/motion';

interface ChatZoneProps {
  /**
   * Signals that the current screen owns Pip itself (e.g. S04 renders Pip as
   * an absolute sprite on the activity zone). ChatZone is already Cedric-only,
   * so today this flag is a no-op inside the component — it exists for
   * semantic clarity at call sites and reserves the contract for a future
   * Pip-in-chat layout.
   */
  hidePip?: boolean;
}

/**
 * ChatZone — Cedric only. Pip lives in PipFloater (activity zone, bottom-right)
 * by default, or is taken over by the screen when `hidePip` is true.
 *
 * Shows the most recent Cedric message. When streaming completes we set
 * uiStore.cedricDone = true so PipFloater knows it's safe to start Pip.
 */
export function ChatZone(_props: ChatZoneProps = {}) {
  const messages = useUIStore((s) => s.messageQueue);
  const setCedricDone = useUIStore((s) => s.setCedricDone);
  const clearOnScreenChange = useUIStore((s) => s.clearOnScreenChange);
  const currentScreen = useJourneyStore((s) => s.currentScreen);

  useEffect(() => { clearOnScreenChange(); }, [currentScreen, clearOnScreenChange]);

  // Show the LATEST Cedric message — supersedes any earlier one in the queue.
  const cedricMsg = [...messages].reverse().find((m) => m.speaker === 'cedric');

  return (
    <div className="py-3 px-4 min-h-[80px] flex items-center">
      <div className="w-full">
        <AnimatePresence mode="wait">
          {cedricMsg && (
            <motion.div
              key={cedricMsg.id}
              layout
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, transition: { duration: 0.2 } }}
              transition={{ duration: 0.4, ease: easeSmooth }}
              className="w-full"
            >
              <CedricBubble
                text={cedricMsg.text}
                onComplete={() => setCedricDone(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
