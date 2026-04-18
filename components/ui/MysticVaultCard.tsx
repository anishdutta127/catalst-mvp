'use client';

import { motion } from 'framer-motion';
import { analytics } from '@/lib/analytics';

interface MysticVaultCardProps {
  whatsAppMessage?: string;
  whatsAppNumber?: string;
  linkedInUrl?: string;
  matchPercent?: number;
  ideaName?: string;
  houseName?: string;
  /** Show the expanded/always-open version (at S11). Default: collapsible/teaser (at S09). */
  variant?: 'teaser' | 'full';
  /**
   * Called when the user clicks the secondary "continue to my house" CTA.
   * When omitted, that CTA is hidden (use this on S11 where there's
   * nowhere further to advance to). When provided, renders below the
   * WhatsApp CTA as a "Maybe later" escape hatch.
   */
  onContinue?: () => void;
}

const DEFAULT_WHATSAPP = '919686917041';
const DEFAULT_LINKEDIN = 'https://in.linkedin.com/in/anish-dutta-4ba701282';

/**
 * MysticVaultCard — the sapphire shimmering premium card.
 *
 * Appears at S09 (below Crown CTA after user crowns an idea) and repeats
 * at S11 bottom (after founder card + share row). Same component, different
 * variant prop to tune length + emphasis.
 *
 * Shimmer effect: CSS keyframe gradient sweep every 4s — lightweight, no JS.
 * Avatar: rotating glow ring around a circular photo slot (placeholder emoji
 * for now — swap the img src with Anish's actual headshot URL to personalize).
 */
export function MysticVaultCard({
  whatsAppMessage,
  whatsAppNumber = DEFAULT_WHATSAPP,
  linkedInUrl = DEFAULT_LINKEDIN,
  matchPercent,
  ideaName,
  houseName,
  variant = 'teaser',
  onContinue,
}: MysticVaultCardProps) {
  const defaultMsg = [
    'Hi Anish! I just completed my Catalst journey.',
    houseName ? `I'm a ${houseName} founder.` : '',
    ideaName && matchPercent ? `My crowned idea: ${ideaName} (${matchPercent}% match).` : '',
    'I want to explore building it with your team — can we set up the ₹500 strategy call?',
  ].filter(Boolean).join('\n');

  const waMsg = encodeURIComponent(whatsAppMessage || defaultMsg);
  const waHref = `https://wa.me/${whatsAppNumber}?text=${waMsg}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        boxShadow: '0 12px 40px -10px rgba(99,102,241,0.45), 0 0 0 1px rgba(99,102,241,0.3)',
      }}
    >
      {/* Animated sapphire gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, #1E1B4B 0%, #1E3A8A 25%, #1E1B4B 50%, #312E81 75%, #1E1B4B 100%)
          `,
        }}
      />

      {/* Shimmer sweep overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(
              115deg,
              transparent 30%,
              rgba(147, 197, 253, 0.18) 45%,
              rgba(191, 219, 254, 0.3) 50%,
              rgba(147, 197, 253, 0.18) 55%,
              transparent 70%
            )
          `,
          backgroundSize: '200% 100%',
          animation: 'mysticShimmer 5s ease-in-out infinite',
        }}
      />

      {/* Decorative sparkles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-3 right-6 w-1 h-1 rounded-full bg-white shadow-[0_0_6px_white] animate-pulse" />
        <div className="absolute bottom-6 left-10 w-1 h-1 rounded-full bg-blue-200 shadow-[0_0_6px_#BFDBFE] animate-pulse" style={{ animationDelay: '0.8s' }} />
        <div className="absolute top-12 left-4 w-[3px] h-[3px] rounded-full bg-indigo-300 shadow-[0_0_8px_#A5B4FC] animate-pulse" style={{ animationDelay: '1.6s' }} />
      </div>

      {/* Content */}
      <div className="relative p-5 sm:p-6 space-y-4">
        {/* Label pill */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-blue-200/80 bg-white/10 border border-white/20 rounded-full px-2.5 py-1 backdrop-blur-sm">
            🔷 Mystic Vault
          </span>
          <span className="text-[9px] uppercase tracking-widest text-blue-100/50">optional · 30 min · ₹500</span>
        </div>

        {/* Hero: garden mark + headline */}
        <div className="flex items-start gap-4">
          {/* Catalst sprout mark (replaces personal initials — this is a
              TEAM pitch, not a founder-bragging card) with rotating glow */}
          <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #60A5FA, #A5B4FC, #C7D2FE, #60A5FA)',
                filter: 'blur(4px)',
                opacity: 0.7,
              }}
            />
            <div
              className="absolute inset-[3px] rounded-full flex items-center justify-center text-[26px] border-2 border-white/30 leading-none"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #312E81)' }}
              aria-hidden
            >
              🌱
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[20px] sm:text-[22px] font-serif font-bold text-white leading-tight">
              Build this idea with us in 7 days.
            </h3>
            <p className="text-blue-100/75 text-[12px] leading-snug mt-1">
              The team that ships: AI builders + designers + operators.
            </p>
          </div>
        </div>

        {/* Team positioning — emphasis on the squad, not a solo founder */}
        <p className="text-blue-50/85 text-[13px] leading-relaxed">
          We&rsquo;re a team of AI-native builders — Claude Code engineers,
          MidJourney designers, video editors, product strategists. We
          ship founder MVPs fast using the full AI toolchain, and
          we&rsquo;ve done it repeatedly at Catalst.
        </p>

        {/* Capability chips — team roles, not personal credentials */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { icon: '⚡', label: 'Claude Code engineers' },
            { icon: '🎨', label: 'MidJourney designers' },
            { icon: '🎥', label: 'Video editors' },
            { icon: '📊', label: 'Product strategists' },
          ].map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-blue-100/85 border border-white/15 backdrop-blur-sm"
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </span>
          ))}
        </div>

        {/* Value props — team-positioned */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '⚡', label: '7-day MVP', sub: 'Real product, not a demo' },
            { icon: '🎯', label: '₹500 · 30 min', sub: 'Strategy call with our team' },
            { icon: '💬', label: 'Direct access', sub: 'WhatsApp, not ticket queue' },
          ].map((v) => (
            <div
              key={v.label}
              className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center backdrop-blur-sm"
            >
              <div className="text-[18px] mb-0.5">{v.icon}</div>
              <p className="text-[11px] text-white font-semibold leading-tight">{v.label}</p>
              <p className="text-[9px] text-blue-200/60 leading-tight mt-0.5">{v.sub}</p>
            </div>
          ))}
        </div>

        {variant === 'full' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1.5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-widest text-blue-200/80">What you get in 30 min</p>
            <ul className="text-[12px] text-blue-50/85 space-y-1">
              <li>• A sharp read on whether this idea is actually yours to build</li>
              <li>• The exact 7-day sprint plan to ship the MVP</li>
              <li>• Our team's availability + pricing for the build</li>
              <li>• Zero sales pressure — ~60% of my calls end with me saying "not yet"</li>
            </ul>
          </div>
        )}

        {/* Primary WhatsApp CTA */}
        <motion.a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => analytics.cta('whatsapp')}
          data-testid="vault-whatsapp-cta"
          whileHover={{ scale: 1.015, boxShadow: '0 0 36px rgba(147,197,253,0.6)' }}
          whileTap={{ scale: 0.98 }}
          className="relative block w-full py-4 rounded-2xl overflow-hidden text-center"
          style={{
            background: 'linear-gradient(95deg, #60A5FA 0%, #818CF8 50%, #A78BFA 100%)',
            boxShadow: '0 4px 20px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
        >
          {/* Inner shimmer on CTA */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.28) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'mysticShimmer 3s ease-in-out infinite',
            }}
          />
          <span className="relative text-white font-bold text-[15px] flex items-center justify-center gap-2">
            💬 Message the team on WhatsApp
            <span className="text-white/80 font-normal text-[12px]">→</span>
          </span>
        </motion.a>

        {/* Secondary CTA — "Maybe later" escape hatch. Only rendered when the
            caller passes onContinue; on S11 (no further screen) it's hidden. */}
        {onContinue && (
          <button
            onClick={onContinue}
            data-testid="vault-continue-cta"
            className="w-full h-10 rounded-xl bg-transparent border border-white/15 text-blue-100/60 text-[12px] hover:bg-white/5 hover:text-blue-50/90 hover:border-white/25 transition-all"
          >
            Maybe later — continue to my house →
          </button>
        )}

        {/* LinkedIn link */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="vault-linkedin-link"
            onClick={() => analytics.cta('linkedin')}
            className="inline-flex items-center gap-1.5 text-[11px] text-blue-200/70 hover:text-blue-100 transition-colors"
          >
            <span className="w-4 h-4 rounded bg-[#0A66C2] flex items-center justify-center text-white text-[9px] font-bold">in</span>
            <span className="underline underline-offset-2">linkedin.com/in/anish-dutta</span>
          </a>
        </div>
        <p className="text-center text-[10px] text-blue-200/45 -mt-2">
          30 min · ₹500 · No commitment · Real builder talk
        </p>
      </div>

      {/* Shimmer keyframe (scoped via style tag — scoped-enough for Next) */}
      <style>{`
        @keyframes mysticShimmer {
          0%   { background-position: -150% 0; }
          100% { background-position: 150% 0; }
        }
      `}</style>
    </motion.div>
  );
}
