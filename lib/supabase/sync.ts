/**
 * Session sync — upserts journey state to Supabase.
 * Non-blocking: fire and forget, never gates UX.
 *
 * Migration SQL (run in Supabase dashboard):
 *
 *   create table sessions (
 *     id text primary key,
 *     state jsonb not null,
 *     updated_at timestamptz default now()
 *   );
 */

import { supabase } from './client';
import type { JourneyState } from '@/lib/store/journeyStore';

/** Upsert current journey state. Called on every screen advance. */
export async function syncSession(state: JourneyState): Promise<void> {
  if (!supabase || !state.sessionId) return;
  try {
    await supabase.from('sessions').upsert({
      id: state.sessionId,
      state: state as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[sync] Failed to sync session:', err);
  }
}

/** Load existing session for resume support. Returns null if not found. */
export async function loadSession(sessionId: string): Promise<Partial<JourneyState> | null> {
  if (!supabase || !sessionId) return null;
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('state')
      .eq('id', sessionId)
      .single();
    if (error || !data) return null;
    return data.state as Partial<JourneyState>;
  } catch {
    return null;
  }
}
