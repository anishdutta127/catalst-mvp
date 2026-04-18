'use client';

/**
 * components/ui/FounderTwinCard.tsx
 * ─────────────────────────────────
 * Inline card showing a founder-twin (archetype match) with a colored-initials
 * avatar, name, company, and one-line "why they're your twin" quote.
 *
 * Used inside the S11 founder trading card to anchor the archetype against
 * a recognizable name. The color prop is the user's house-hex — drives the
 * avatar gradient so the twin visually inherits the founder's house tint.
 */

import { darken } from '@/lib/color';
import type { FounderTwin } from '@/lib/archetypes';

export interface FounderTwinCardProps {
  twin: FounderTwin;
  color: string;
}

export function FounderTwinCard({ twin, color }: FounderTwinCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <div
        className="w-12 h-12 rounded-full grid place-items-center font-serif text-lg font-bold shrink-0 text-white"
        style={{
          background: `linear-gradient(135deg, ${color}, ${darken(color, 30)})`,
          boxShadow: `0 4px 14px ${color}55`,
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
        aria-hidden
      >
        {twin.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-ivory truncate">{twin.name}</div>
        <div className="text-xs text-ivory/70 truncate">{twin.company}</div>
        <div className="text-xs italic text-ivory/60 mt-1 line-clamp-2">
          &ldquo;{twin.whyQuote}&rdquo;
        </div>
      </div>
    </div>
  );
}
