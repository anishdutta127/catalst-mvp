'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/lib/store/uiStore';
import { CedricBubble } from '@/components/characters/CedricBubble';
import { PipBubble } from '@/components/characters/PipBubble';

/**
 * DialogueStrip — reserved grid zone for Cedric/Pip messages.
 * NOT an overlay. Occupies the "dialogue" grid area with guaranteed space.
 * Handles auto-removal of expired dialogue messages.
 */
export function DialogueStrip() {
  const messages = useUIStore((s) => s.messageQueue);
  const removeMessage = useUIStore((s) => s.removeMessage);

  // Auto-remove expired dialogue messages
  useEffect(() => {
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
    <div className="h-full px-4 flex flex-col justify-end">
      <div className="mx-auto w-full max-w-[720px] flex flex-col gap-2 pb-2">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
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
