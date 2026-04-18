'use client';

/**
 * components/ui/ChallengeSection.tsx
 * ──────────────────────────────────
 * The #CatalstChallenge viral-loop block. Sits on S11 below the founder
 * card and above MysticVaultCard. Goal: push one concrete action
 * ("tag 3 friends") that turns private results into a public challenge.
 *
 * Share payload strategy:
 *   - Instagram has no direct Story API for web; clicking the IG button
 *     copies a pre-filled caption to clipboard and shows a toast. User
 *     pastes into their Story. MVP-acceptable per the batch spec.
 *   - WhatsApp opens wa.me with pre-filled text — works universally.
 *   - Download button triggers the parent's onSaveCard prop (wired to the
 *     html-to-image PNG export) so users can save + share together.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { darken } from '@/lib/color';
import type { Archetype } from '@/lib/archetypes';

export interface ChallengeSectionProps {
  houseColor: string;
  houseName: string;
  archetype: Archetype;
  matchPercent: number;
  crownedIdeaName?: string;
  onSaveCard?: () => void;
}

function buildCaptionIG(
  archetype: Archetype,
  houseName: string,
): string {
  const lowerName = archetype.name.toLowerCase();
  return `I'm ${lowerName} on @catalst 🌱 ${houseName.replace('House of ', '')} house · founder twin: ${archetype.twinGlobal.name}. Tag 3 friends who should start an AI business. #CatalstChallenge`;
}

function buildMessageWA(
  archetype: Archetype,
  matchPercent: number,
): string {
  const future = new Date();
  future.setDate(future.getDate() + 7);
  const month = future.toLocaleDateString('en-US', { month: 'short' });
  const day = future.getDate();
  return `just found out I'm ${archetype.name} on Catalst 👀 ${matchPercent}% match with ${archetype.twinGlobal.name}. you should try — I'm challenging you to find yours before ${month} ${day}: catalst.app`;
}

export function ChallengeSection({
  houseColor,
  houseName,
  archetype,
  matchPercent,
  onSaveCard,
}: ChallengeSectionProps) {
  const [toast, setToast] = useState<string | null>(null);

  const captionIG = buildCaptionIG(archetype, houseName);
  const messageWA = buildMessageWA(archetype, matchPercent);

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  async function handleInstagram() {
    try {
      await navigator.clipboard.writeText(captionIG);
      flashToast('Caption copied — paste into your Story');
    } catch {
      flashToast('Copy failed — long-press the caption text to copy');
    }
  }

  function handleWhatsApp() {
    const encoded = encodeURIComponent(messageWA);
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener');
  }

  function handleSaveAndChallenge() {
    if (onSaveCard) onSaveCard();
    // Copy the caption too so users don't have to double-tap.
    navigator.clipboard
      .writeText(captionIG)
      .then(() => flashToast('Saved + caption copied — challenge on!'))
      .catch(() => flashToast('Saving card…'));
  }

  return (
    <div
      className="relative mt-8 rounded-3xl bg-gradient-to-br from-white/8 to-white/0 border border-white/15 p-6 overflow-hidden"
      style={{
        boxShadow: `0 18px 40px -18px ${houseColor}55, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      {/* Subtle house-tinted glow corner */}
      <div
        className="absolute -top-20 -right-16 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${houseColor}33 0%, ${houseColor}00 65%)`,
          filter: 'blur(14px)',
        }}
        aria-hidden
      />

      <div className="relative text-center">
        <div
          className="text-xs tracking-[0.3em] mb-2 font-mono"
          style={{ color: `${houseColor}D0` }}
        >
          #CATALSTCHALLENGE
        </div>
        <h3 className="font-serif text-2xl text-ivory mb-3 leading-tight">
          Think you know three founders?
        </h3>
        <p className="text-sm text-ivory/80 leading-relaxed mb-6 max-w-sm mx-auto">
          Tag 3 friends who should start an AI business.
          First to ship earns bragging rights — and we&rsquo;ll be watching.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={handleInstagram}
            data-testid="challenge-instagram"
            className="py-3 rounded-xl bg-white/10 hover:bg-white/18 backdrop-blur-sm transition text-sm font-medium text-ivory flex items-center justify-center gap-2"
          >
            <InstagramIcon />
            Story
          </button>
          <button
            onClick={handleWhatsApp}
            data-testid="challenge-whatsapp"
            className="py-3 rounded-xl bg-white/10 hover:bg-white/18 backdrop-blur-sm transition text-sm font-medium text-ivory flex items-center justify-center gap-2"
          >
            <WhatsAppIcon />
            WhatsApp
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveAndChallenge}
          data-testid="challenge-save"
          className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${houseColor}, ${darken(houseColor, 20)})`,
            boxShadow: `0 8px 22px -8px ${houseColor}AA`,
          }}
        >
          <DownloadIcon />
          Save + Challenge 3 Friends
        </motion.button>

        <p className="text-[10px] text-ivory/45 mt-3">
          Challenge message auto-fills. Edit before posting.
        </p>

        {/* Toast — bottom-center, auto-clears. */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/85 text-white text-[11px] px-3 py-1.5 rounded-full border border-white/15 whitespace-nowrap"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Inline icons (lucide-react isn't a project dep) ─────────────────────

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
