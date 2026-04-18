/**
 * PostHog analytics — all events non-blocking, never gate UX.
 * In development: capturing is disabled.
 */

import posthog from 'posthog-js';

let initialized = false;

export const analytics = {
  init: () => {
    if (initialized || typeof window === 'undefined') return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    posthog.init(key, {
      api_host: 'https://app.posthog.com',
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.opt_out_capturing();
      },
    });
    initialized = true;
  },

  screen: (screenId: string) => {
    posthog.capture('screen_view', { screen: screenId });
  },

  select: (screen: string, value: string) => {
    posthog.capture('selection', { screen, value });
  },

  advance: (from: string, to: string) => {
    posthog.capture('screen_advance', { from, to });
  },

  cta: (type: 'whatsapp' | 'download' | 'consultation' | 'linkedin' | 'twitter' | 'instagram') => {
    posthog.capture('cta_tap', { type });
  },

  complete: (houseId: string, ideaName: string) => {
    posthog.capture('journey_complete', { houseId, ideaName });
  },

  drop: (screen: string) => {
    posthog.capture('drop_off', { screen });
  },
};
