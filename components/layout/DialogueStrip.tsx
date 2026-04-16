'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/lib/store/uiStore';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { CedricBubble } from '@/components/characters/CedricBubble';
import { PipBubble } from '@/components/characters/PipBubble';
import { DIALOGUE_TIMING } from '@/lib/constants';

/**
 * DialogueStrip — reserved grid zone for Cedric/Pip messages.
 * NOT an overlay. Occupies the "dialogue" grid area with guaranteed space.
 *
 * Lifecycle:
 *   - dialogue messages auto-fade after streaming + hold time
 *   - instruction/result messages cleared on screen change
 *   - max 2 messages visible (enforced at enqueue in uiStore)
 */
export function DialogueStrip() {
  const messages = useUIStore((s) => s.messageQueue);
  const removeMessage = useUIStore((s) => s.removeMessage);
  const clearOnScreenChange = useUIStore((s) => s.clearOnScreenChange);
  const currentScreen = useJourneyStore((s) => s.currentScreen);

  // Auto-clear instruction + result messages on screen change
  useEffect(() => {
    clearOnScreenChange();
  }, [currentScreen, clearOnScreenChange]);

  // Auto-remove expired dialogue messages
  useEffect(() => {
    if (messages.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      for (const msg of messages) {
        if (msg.type === 'dialogue' && msg.expiresAt && now > msg.expiresAt) {
          removeMessage(msg.id);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [messages, removeMessage]);

  return (
    <div className="h-full px-4 flex flex-col justify-end overflow-hidden">
      <div className="mx-auto w-full max-w-[720px] flex flex-col gap-2 pb-2">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: DIALOGUE_TIMING.fadeOutDuration / 1000 }}
            >
              {msg.speaker === 'cedric' ? (
                <CedricBubble text={msg.text} />
              ) : (
                <PipBubble text={msg.text} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
