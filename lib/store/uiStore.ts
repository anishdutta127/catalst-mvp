/**
 * UI Store — ephemeral state for animations, dialogue queue, Pip positioning.
 * Never persisted to Supabase.
 */

import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────────

export type PipState =
  | 'idle'
  | 'excited'
  | 'nervous'
  | 'pointing'
  | 'hiding'
  | 'celebrating';

export type PipPosition =
  | 'zone3'
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

// ── Store ─────────────────────────────────────────────────────

let messageCounter = 0;

export const useUIStore = create<UIState & UIActions>()((set) => ({
  // Initial state
  messageQueue: [],
  pipState: 'idle',
  pipPosition: 'zone3',
  pipVisible: false,
  isTransitioning: false,
  deepDiveOpen: false,
  deepDiveIdeaId: null,

  // Dialogue
  enqueueMessage: (msg) => set((s) => {
    const id = `msg_${++messageCounter}`;
    const message: DialogueMessage = { ...msg, id };

    // For dialogue messages, calculate expiry
    if (msg.type === 'dialogue') {
      const wordCount = msg.text.split(' ').length;
      const holdTime = 2000 + wordCount * 60;
      message.expiresAt = Date.now() + holdTime + 3000; // +3s for streaming time
    }

    // Max 3 messages visible. If at limit, remove oldest dialogue.
    let queue = [...s.messageQueue, message];
    while (queue.length > 3) {
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
