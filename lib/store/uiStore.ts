/**
 * UI Store — ephemeral state for animations, dialogue queue, Pip positioning.
 * Never persisted to Supabase.
 *
 * Message lifecycle (from ARCHITECTURE_ENG.md):
 *   dialogue   — auto-fade after streaming_time + hold_time
 *   instruction — persists until replaced by new instruction or screen change
 *   result      — persists until screen change
 *
 * Max 2 messages visible. Oldest dialogue evicted first.
 * Instructions and results auto-clear on screen change via subscription.
 */

import { create } from 'zustand';
import { DIALOGUE_TIMING } from '@/lib/constants';

// ── Types ─────────────────────────────────────────────────────

export type PipState =
  | 'idle'
  | 'excited'
  | 'nervous'
  | 'pointing'
  | 'hiding'
  | 'celebrating';

export type PipPosition =
  | 'zone-pip'
  | 'activity-left'
  | 'activity-right'
  | 'activity-center'
  | 'off-screen';

export type MessageType = 'dialogue' | 'instruction' | 'result';

export interface DialogueMessage {
  id: string;
  speaker: 'cedric' | 'pip';
  text: string;
  type: MessageType;
  /** Timestamp when message should start fading (dialogue only) */
  expiresAt?: number;
}

// ── State ─────────────────────────────────────────────────────

interface UIState {
  // Dialogue
  messageQueue: DialogueMessage[];

  // Pip
  pipState: PipState;
  pipPosition: PipPosition;
  pipVisible: boolean;

  // Transitions
  isTransitioning: boolean;

  // Deep dive overlay
  deepDiveOpen: boolean;
  deepDiveIdeaId: string | null;
}

interface UIActions {
  // Dialogue
  enqueueMessage: (msg: Omit<DialogueMessage, 'id'>) => void;
  removeMessage: (id: string) => void;
  clearMessagesByType: (type: MessageType) => void;
  clearAllMessages: () => void;
  /** Called on screen change — clears instruction + result messages */
  clearOnScreenChange: () => void;

  // Pip
  setPipState: (state: PipState) => void;
  setPipPosition: (pos: PipPosition) => void;
  setPipVisible: (visible: boolean) => void;

  // Transitions
  setTransitioning: (value: boolean) => void;

  // Deep dive
  openDeepDive: (ideaId: string) => void;
  closeDeepDive: () => void;
}

// ── Expiry Calculation ───────────────────────────────────────

function computeExpiry(text: string, speaker: 'cedric' | 'pip'): number {
  const wordCount = text.split(' ').length;
  const wordDelay = speaker === 'cedric'
    ? DIALOGUE_TIMING.cedricWordDelay
    : DIALOGUE_TIMING.pipWordDelay;
  const streamingTime = wordCount * wordDelay;
  const holdTime = DIALOGUE_TIMING.baseHoldTime + (wordCount * DIALOGUE_TIMING.perWordHoldTime);
  return Date.now() + streamingTime + holdTime;
}

// ── Store ─────────────────────────────────────────────────────

export const useUIStore = create<UIState & UIActions>()((set) => ({
  // Initial state
  messageQueue: [],
  pipState: 'idle',
  pipPosition: 'zone-pip',
  pipVisible: false,
  isTransitioning: false,
  deepDiveOpen: false,
  deepDiveIdeaId: null,

  // Dialogue
  enqueueMessage: (msg) => set((s) => {
    const id = crypto.randomUUID();
    const message: DialogueMessage = { ...msg, id };

    // For dialogue messages, calculate expiry using correct math
    if (msg.type === 'dialogue') {
      message.expiresAt = computeExpiry(msg.text, msg.speaker);
    }

    // Max 2 messages visible. If at limit, remove oldest dialogue first.
    let queue = [...s.messageQueue, message];
    while (queue.length > 2) {
      const oldestDialogue = queue.findIndex((m) => m.type === 'dialogue');
      if (oldestDialogue >= 0) {
        queue.splice(oldestDialogue, 1);
      } else {
        queue.shift();
      }
    }

    return { messageQueue: queue };
  }),

  removeMessage: (id) => set((s) => ({
    messageQueue: s.messageQueue.filter((m) => m.id !== id),
  })),

  clearMessagesByType: (type) => set((s) => ({
    messageQueue: s.messageQueue.filter((m) => m.type !== type),
  })),

  clearAllMessages: () => set({ messageQueue: [] }),

  clearOnScreenChange: () => set((s) => ({
    messageQueue: s.messageQueue.filter((m) => m.type === 'dialogue'),
  })),

  // Pip
  setPipState: (state) => set({ pipState: state }),
  setPipPosition: (pos) => set({ pipPosition: pos }),
  setPipVisible: (visible) => set({ pipVisible: visible }),

  // Transitions
  setTransitioning: (value) => set({ isTransitioning: value }),

  // Deep dive
  openDeepDive: (ideaId) => set({ deepDiveOpen: true, deepDiveIdeaId: ideaId }),
  closeDeepDive: () => set({ deepDiveOpen: false, deepDiveIdeaId: null }),
}));
