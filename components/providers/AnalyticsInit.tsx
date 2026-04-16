'use client';

import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';

/** Client-side analytics init. Mount once at root. */
export function AnalyticsInit() {
  useEffect(() => {
    analytics.init();
  }, []);
  return null;
}
