/**
 * Supabase browser client.
 * Uses NEXT_PUBLIC_ env vars — safe for client-side.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = url && key ? createClient(url, key) : null;
