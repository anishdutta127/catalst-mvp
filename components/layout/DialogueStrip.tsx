'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/lib/store/uiStore';
import { CedricBubble } from '@/components/characters/CedricBubble';
import { PipBubble } from '@/components/characters/PipBubble';

/**
 * DialogueStrip — overlay at top of viewport.
 * Renders messages from the UI store's message queue.
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

  if (messages.length === 0) return null;

  return (
    <div className="absolute top-12 left-0 right-0 z-20 px-4 pointer-events-none">
      <div className="max-w-[720px] mx-auto flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-auto"
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
