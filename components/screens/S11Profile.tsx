'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { analytics } from '@/lib/analytics';
import housesRaw from '@/content/houses.json';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { MysticVaultCard } from '@/components/ui/MysticVaultCard';
import { FounderTradingCard } from '@/components/ui/FounderTradingCard';
import { computeFounderStats } from '@/lib/founder-stats';
import { staggerContainer, fadeSlideUp, easeOvershoot } from '@/lib/motion';

interface LineageFigure { name: string; sharedTraitLine: string; quantified_impact?: string }
interface House {
  id: string; name: string; hex: string; tagline: string;
  description: string; strengths: string[]; lineage: LineageFigure[];
  collective_impact?: string;
}
const HOUSES = housesRaw as unknown as House[];

const ORB_COLORS: Record<string, string> = {
  Grit: '#F59E0B', Vision: '#F0D060', Craft: '#CD7F32', Influence: '#9B59B6',
  Empathy: '#00D8B9', Analysis: '#5DADE2', Freedom: '#BDC3C7', Stability: '#27AE60',
};

/**
 * S11 — Founder Profile (Batch 5 vault finish).
 *
 * Structure:
 *   0. Page-level gradient backdrop — from-black/55 via-black/30 to-black/65
 *      fixed, so the journey's final screen reads as a closed "vault" instead
 *      of bleeding into the S10 particles.
 *   1. FounderTradingCard — 9:16 holographic hero (conic-gradient foil, 8s).
 *   2. Share row — 4 × 44×44 circular buttons (IG/X/WA/Download) using inline
 *      SVG icons since `lucide-react` isn't a project dep. 80ms stagger.
 *   3. Stats breakdown — explains the numbers on the card.
 *   4. House identity — name, description, lineage cards.
 *   5. Top 3 matched ideas — compact cards with crowned badge.
 *   6. Divider → MysticVaultCard variant="full" (the tease into pro features).
 *
 * Sequencing: page uses staggerContainer (300ms delay, 120ms stagger). Each
 * block uses fadeSlideUp so they arrive in cadence. Trading card gets its
 * own spring entrance (scale 0.92 → 1, 600ms delay 100ms) since it's the hero.
 */
export function S11Profile() {
  const state = useJourneyStore();
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [downloadError, setDownloadError] = useState('');
  const [cardSaving, setCardSaving] = useState(false);
  const dialogueSent = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const house = HOUSES.find((h) => h.id === state.houseId) || HOUSES[0];
  const crowned = state.matchedIdeas
    ? [state.matchedIdeas.nest, state.matchedIdeas.spark, state.matchedIdeas.wildvine]
        .find((s) => s.idea.idea_id === state.crownedIdeaId) || state.matchedIdeas.nest
    : null;
  const allIdeas = state.matchedIdeas
    ? [state.matchedIdeas.nest, state.matchedIdeas.spark, state.matchedIdeas.wildvine]
    : [];
  const displayName = state.displayName || 'Founder';

  const orbData = useMemo(() => (
    state.crystalOrbs.slice(0, 3).map((name) => ({
      name,
      color: ORB_COLORS[name] || '#D4A843',
    }))
  ), [state.crystalOrbs]);

  const stats = useMemo(() => computeFounderStats({
    houseId: state.houseId,
    displayName,
    matchPercent: crowned?.displayScore || 0,
    noveltyScore: crowned?.idea.novelty_score,
    crystalOrbs: state.crystalOrbs,
    blotResponseTimes: state.blotResponseTimes,
    wordResponseTimes: state.wordResponseTimes,
    crystalSelectionTimes: state.crystalSelectionTimes,
    industryName: crowned?.idea.domain_primary?.replace(/_/g, ' ') || 'your industry',
  }), [state.houseId, displayName, crowned, state.crystalOrbs, state.blotResponseTimes, state.wordResponseTimes, state.crystalSelectionTimes]);

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    analytics.complete(state.houseId || 'unknown', crowned?.idea.idea_name || 'unknown');
    enqueueMessage({ speaker: 'cedric', text: lines.s11.cedric.intro, type: 'dialogue' });
    setTimeout(() => enqueueMessage({ speaker: 'cedric', text: lines.s11.cedric.final(displayName), type: 'dialogue' }), 3000);
    setTimeout(() => enqueueMessage({ speaker: 'pip', text: lines.s11.pip.final, type: 'dialogue' }), 5000);
  }, [enqueueMessage, displayName, state.houseId, crowned]);

  const generateMarkdown = useCallback(() => {
    const whyYou = crowned ? (state.whyYouTexts[crowned.idea.idea_id] || 'Trust the match.') : '';
    const qs = crowned?.idea.quickStart;
    return `# ${crowned?.idea.idea_name || 'Your Idea'} — Your Catalst Founder Profile

**House:** ${house.name}
**Match:** ${crowned?.displayScore || 0}% in ${crowned?.idea.domain_primary?.replace(/_/g, ' ') || 'unknown'}
**Rarity:** ${stats.rarity.tier} — ${stats.rarity.label}
**Speed:** ${stats.responseSpeedRank.label}
**Novelty:** ${stats.noveltyDecile.label}
**Trait signature:** ${stats.traitSignature}

## Your Top Idea
${crowned?.idea.idea_name || ''} — ${crowned?.idea.one_liner || ''}

${crowned?.idea.pain_to_promise || ''}

## Why This Fits You
${whyYou.replace('__loading__', 'Trust the match.')}

## First Steps
- Week 1: ${qs?.week1 || 'Validate the core assumption'}
- MVP: ${qs?.mvp || 'Build the simplest version'}
- First customers: ${qs?.firstCustomers || 'Talk to 10 people in the space'}

## Your Personality Profile
House: ${house.name} | Traits: ${state.crystalOrbs.join(', ')} | Strengths: ${house.strengths.join(', ')}

---
Generated by Catalst · catalst.app
`;
  }, [crowned, house, state.crystalOrbs, state.whyYouTexts, stats]);

  function handleDownloadMd() {
    try {
      const md = generateMarkdown();
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalst-${house.id}-${displayName.toLowerCase().replace(/\s+/g, '-')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      analytics.cta('download');
    } catch { setDownloadError('Download failed, try again'); }
  }

  async function handleSaveCard() {
    if (!cardRef.current) return;
    setCardSaving(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `catalst-${house.id}-${displayName.toLowerCase().replace(/\s+/g, '-')}.png`;
      a.click();
      analytics.cta('download');
    } catch { setDownloadError('Card save failed, try again'); }
    setCardSaving(false);
  }

  const shareText = `I just found my startup idea on Catalst 🌱\n\nI'm a ${house.name} founder — ${stats.rarity.tier.toLowerCase()}, ${stats.rarity.label}.\nMy match: ${crowned?.idea.idea_name || 'my idea'} at ${crowned?.displayScore || 0}% fit.\n\nWhat founder are you? → catalst.app`;

  return (
    <>
      {/* ── Page-level vault backdrop ──
          Fixed gradient overlay sits above the route background but below
          page content. Darker top/bottom and a softer middle band keeps the
          trading card feeling lit-from-above while the lower content reads
          against a steadier surface. */}
      <div
        className="fixed inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/65 pointer-events-none z-0"
        aria-hidden
      />

      <motion.div
        variants={staggerContainer(0.3, 0.12)}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col gap-6 pb-8 overflow-y-auto max-w-xl mx-auto px-4 pt-2"
      >
        {/* ── 1. Trading card — spring entrance (it's the hero). ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: easeOvershoot }}
          className="flex justify-center"
        >
          <FounderTradingCard
            ref={cardRef}
            displayName={displayName}
            house={house}
            orbs={orbData}
            crownedIdeaName={crowned?.idea.idea_name}
            crownedIdeaDomain={crowned?.idea.domain_primary}
            matchPercent={crowned?.displayScore || 0}
            stats={stats}
          />
        </motion.div>

        {/* ── 2. Share row — 4 × 44×44 circular buttons with inline SVG icons.
            Own staggerContainer so each button slides in at 80ms increments. ── */}
        <motion.div
          variants={fadeSlideUp}
          className="w-full"
        >
          <p className="text-[10px] text-ivory/40 uppercase tracking-[0.22em] text-center mb-3">
            Share your card
          </p>
          <motion.div
            variants={staggerContainer(0, 0.08)}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center gap-4"
          >
            <ShareButton
              testId="share-instagram"
              label="Instagram"
              gradient="linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)"
              onClick={() => {
                handleSaveCard();
                const t = encodeURIComponent('Card saved! Now open Instagram → Your Story → upload from gallery');
                setTimeout(() => window.open(`https://wa.me/?text=${t}`, '_blank'), 300);
              }}
              icon={<InstagramIcon />}
            />
            <ShareButton
              testId="share-twitter"
              label="X / Post"
              gradient="linear-gradient(180deg, #0A0A0A 0%, #1F1F1F 100%)"
              border="1px solid rgba(255,255,255,0.18)"
              onClick={() => {
                const t = encodeURIComponent(shareText);
                window.open(`https://twitter.com/intent/tweet?text=${t}`, '_blank');
              }}
              icon={<XIcon />}
            />
            <ShareButton
              testId="share-whatsapp"
              label="WhatsApp"
              gradient="linear-gradient(135deg, #25D366 0%, #128C7E 100%)"
              onClick={() => {
                analytics.cta('whatsapp');
                const t = encodeURIComponent(shareText);
                window.open(`https://wa.me/?text=${t}`, '_blank');
              }}
              icon={<WhatsAppIcon />}
            />
            <ShareButton
              testId="share-download"
              label={cardSaving ? 'Saving' : 'Save PNG'}
              gradient="linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)"
              border="1px solid rgba(255,255,255,0.22)"
              onClick={handleSaveCard}
              disabled={cardSaving}
              icon={<DownloadIcon />}
            />
          </motion.div>
          {downloadError && (
            <p className="text-xs text-rose-400/80 text-center mt-2">{downloadError}</p>
          )}

          {/* Secondary: idea pack markdown download */}
          <button
            onClick={handleDownloadMd}
            data-testid="download-md"
            className="w-full mt-4 h-10 rounded-xl bg-white/5 border border-white/10 text-ivory/65 text-[12px] hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
          >
            📄 Download full idea pack (.md)
          </button>
        </motion.div>

        {/* ── 3. Stats breakdown — explains the trading card numbers. ── */}
        <motion.div variants={fadeSlideUp} className="w-full">
          <p className="text-[10px] text-ivory/40 uppercase tracking-[0.22em] mb-2">
            Stats on your card
          </p>
          <div className="space-y-1.5">
            <StatRow icon="🎖" label="Rarity" value={`${stats.rarity.tier} — ${stats.rarity.label}`} />
            <StatRow icon="⚡" label="Instinct speed" value={stats.responseSpeedRank.label} />
            <StatRow icon="💡" label="Idea novelty" value={stats.noveltyDecile.label} />
            <StatRow icon="🎯" label="Industry fit" value={stats.industryFitRank.label} />
            <StatRow icon="🧬" label="Trait signature" value={stats.traitSignature} mono />
          </div>
        </motion.div>

        {/* ── 4. House identity ── */}
        <motion.div variants={fadeSlideUp} className="w-full space-y-3">
          <h3 className="text-2xl font-serif font-bold" style={{ color: house.hex }}>
            {house.name}
          </h3>
          <p className="text-sm text-ivory/75 leading-relaxed">{house.description}</p>
          <div className="space-y-2">
            {house.lineage.map((fig) => (
              <div
                key={fig.name}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3"
              >
                <p className="text-sm font-semibold text-ivory">{fig.name}</p>
                {fig.quantified_impact && (
                  <p className="text-[11px]" style={{ color: `${house.hex}C0` }}>
                    {fig.quantified_impact}
                  </p>
                )}
                <p className="text-[10px] text-ivory/45 mt-0.5 uppercase tracking-wider">
                  {fig.sharedTraitLine}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── 5. Top 3 matched ideas — compact cards. ── */}
        <motion.div variants={fadeSlideUp} className="w-full space-y-2">
          <p className="text-xs font-mono text-ivory/40 uppercase tracking-[0.22em]">
            Your matched ideas
          </p>
          {allIdeas.map((si) => {
            const isCrowned = si.idea.idea_id === state.crownedIdeaId;
            return (
              <div
                key={si.idea.idea_id}
                className={`bg-white/5 backdrop-blur-sm rounded-lg p-3 ${
                  isCrowned ? 'border-2 border-gold/60' : 'border border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-semibold ${isCrowned ? 'text-gold' : 'text-ivory'}`}
                  >
                    {isCrowned && <span className="mr-1">👑</span>}
                    {si.idea.idea_name}
                  </p>
                  <span className="text-[10px] font-mono text-ivory/45">
                    {si.displayScore}%
                  </span>
                </div>
                <p className="text-xs text-ivory/50 mt-1 line-clamp-1">{si.idea.one_liner}</p>
              </div>
            );
          })}
        </motion.div>

        {/* ── Divider + MysticVaultCard ──
            The horizontal rule cues the user that what's below is "beyond"
            the core profile — a taste of the locked-deeper-features vault. */}
        <motion.div variants={fadeSlideUp} className="w-full pt-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/10" />
            <p className="text-[9px] font-mono text-ivory/35 uppercase tracking-[0.3em]">
              The vault
            </p>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <MysticVaultCard
            matchPercent={crowned?.displayScore}
            ideaName={crowned?.idea.idea_name}
            houseName={house.name}
            variant="full"
          />
        </motion.div>

        <ScreenQuote screen="s11" />

        <p className="text-[10px] text-ivory/25 text-center font-mono px-4">
          {lines.s11.journeyComplete(house.name)}
        </p>
      </motion.div>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function StatRow({ icon, label, value, mono }: { icon: string; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[13px]">{icon}</span>
        <span className="text-[10px] uppercase tracking-wider text-ivory/50">{label}</span>
      </div>
      <span className={`text-[11px] text-ivory/85 text-right ${mono ? 'font-mono tracking-wider' : ''}`}>
        {value}
      </span>
    </div>
  );
}

interface ShareButtonProps {
  testId: string;
  label: string;
  gradient: string;
  border?: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function ShareButton({ testId, label, gradient, border, icon, onClick, disabled }: ShareButtonProps) {
  return (
    <motion.button
      variants={fadeSlideUp}
      whileHover={{ scale: disabled ? 1 : 1.06 }}
      whileTap={{ scale: disabled ? 1 : 0.92 }}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      aria-label={label}
      className="relative w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      style={{
        background: gradient,
        border: border ?? '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
      }}
    >
      {icon}
    </motion.button>
  );
}

// ─── Inline SVG icons (lucide-react isn't a project dep) ─────────────────
// Stroke-based line icons at 20×20, stroke=1.75, rounded caps/joins — matches
// the lucide aesthetic the spec asks for without adding a dependency.

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="white" stroke="none" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
