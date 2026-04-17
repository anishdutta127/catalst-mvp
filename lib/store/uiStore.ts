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

export interface PipTimerConfig {
  active: boolean;
  durationMs: number;
  /** Wall-clock ms when the countdown should *start*. May be in the future
   *  (intro grace period) — PipFloater clamps pct to 1 until that moment. */
  startedAt: number;
  resetKey: string | number;
}

interface UIState {
  // Dialogue
  messageQueue: DialogueMessage[];
  /** True once the currently-displayed Cedric bubble has finished streaming.
   *  PipFloater watches this so Pip never starts before Cedric is done. */
  cedricDone: boolean;

  // Pip
  pipState: PipState;
  pipPosition: PipPosition;
  pipVisible: boolean;
  /** Timer rendered as a depleting ring around the Pip sprite.
   *  Screens publish via startPipTimer; PipFloater owns the visual + RAF. */
  pipTimer: PipTimerConfig | null;

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
  setCedricDone: (done: boolean) => void;
  /** Called on screen change — clears instruction + result messages */
  clearOnScreenChange: () => void;

  // Pip
  setPipState: (state: PipState) => void;
  setPipPosition: (pos: PipPosition) => void;
  setPipVisible: (visible: boolean) => void;
  startPipTimer: (
    durationMs: number,
    resetKey: string | number,
    onExpire: () => void,
    startDelayMs?: number,
  ) => void;
  stopPipTimer: () => void;

  // Transitions
  setTransitioning: (value: boolean) => void;

  // Deep dive
  openDeepDive: (ideaId: string) => void;
  closeDeepDive: () => void;
}

// ── Pip Timer onExpire (module-ref, not reactive) ─────────────
// We keep the callback outside zustand state so screens can pass fresh closures
// without causing every subscriber to re-render. PipFloater reads this via the
// exported getter and calls it exactly once on expiry.

let pipTimerOnExpireRef: (() => void) | null = null;
export function firePipTimerExpiry() {
  const fn = pipTimerOnExpireRef;
  pipTimerOnExpireRef = null;
  fn?.();
}

// ── Cedric "minimum visible time" gate ───────────────────────
// Without this, a new screen's mount-enqueue replaces the previous screen's
// wrap-up Cedric line in the chat strip before the user finishes reading it.
// We hold a wall-clock timestamp (`cedricBusyUntil`) — when a new Cedric
// message is enqueued before that, we defer it via setTimeout so the prior
// message stays visible long enough to be read.
const CEDRIC_CHAR_MS = 28;
const CEDRIC_READ_BUFFER_MS = 1200;
let cedricBusyUntil = 0;

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
  cedricDone: true,
  pipState: 'idle',
  pipPosition: 'zone-pip',
  pipVisible: false,
  pipTimer: null,
  isTransitioning: false,
  deepDiveOpen: false,
  deepDiveIdeaId: null,

  // Dialogue
  enqueueMessage: (msg) => {
    // Hold-back gate: if a previous Cedric line is still within its "must be
    // readable" window, defer this enqueue rather than overwrite that line.
    if (msg.speaker === 'cedric') {
      const now = Date.now();
      if (now < cedricBusyUntil) {
        const delay = cedricBusyUntil - now;
        setTimeout(() => useUIStore.getState().enqueueMessage(msg), delay);
        return;
      }
      // Reserve visible time for THIS message before any future Cedric line
      // can replace it.
      cedricBusyUntil = now + msg.text.length * CEDRIC_CHAR_MS + CEDRIC_READ_BUFFER_MS;
    }

    set((s) => {
      const id = crypto.randomUUID();
      const message: DialogueMessage = { ...msg, id };

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

      const cedricDone = msg.speaker === 'cedric' ? false : s.cedricDone;
      return { messageQueue: queue, cedricDone };
    });
  },

  setCedricDone: (done) => set({ cedricDone: done }),

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
  startPipTimer: (durationMs, resetKey, onExpire, startDelayMs = 0) => {
    pipTimerOnExpireRef = onExpire;
    set({
      pipTimer: {
        active: true,
        durationMs,
        startedAt: Date.now() + startDelayMs,
        resetKey,
      },
    });
  },
  stopPipTimer: () => {
    pipTimerOnExpireRef = null;
    set({ pipTimer: null });
  },

  // Transitions
  setTransitioning: (value) => set({ isTransitioning: value }),

  // Deep dive
  openDeepDive: (ideaId) => set({ deepDiveOpen: true, deepDiveIdeaId: ideaId }),
  closeDeepDive: () => set({ deepDiveOpen: false, deepDiveIdeaId: null }),
}));
