'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { analytics } from '@/lib/analytics';
import housesRaw from '@/content/houses.json';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { MysticVaultCard } from '@/components/ui/MysticVaultCard';
import { RadarChart, type RadarScores } from '@/components/ui/RadarChart';
import { ChallengeSection } from '@/components/ui/ChallengeSection';
import {
  getArchetype,
  pickDominantMotive,
  type FounderTwin,
  type HouseSlug,
} from '@/lib/archetypes';
import { extractPersonality } from '@/lib/scoring/engine';
import { buildForgeProfile } from '@/lib/scoring/buildProfile';
import { pathLine } from '@/lib/speakPath';
import { staggerContainer, fadeSlideUp, easeOvershoot } from '@/lib/motion';

type ShareStatus = 'idle' | 'copied' | 'downloading' | 'downloaded' | 'error';

interface LineageFigure { name: string; sharedTraitLine: string; quantified_impact?: string }
interface House {
  id: string; name: string; hex: string; tagline: string;
  description: string; strengths: string[]; lineage: LineageFigure[];
  collective_impact?: string;
}
const HOUSES = housesRaw as unknown as House[];

/**
 * S11 — Founder Profile (v8 — trading-card + #CatalstChallenge).
 *
 * One shareable artifact on top, then top matches, then the viral-loop
 * challenge, then the MysticVault pitch, then a soft skip. The trading-card
 * JSX is inline (not a separate component) because its layout is unique to
 * this screen and inlining keeps the row-by-row story readable.
 *
 * Archetype assignment: house × dominant McClelland motive (achievement |
 * affiliation | power). Extracted from the full ForgeProfile via the
 * existing scoring engine, so every path (A/B/C) produces a real motive
 * rather than a default.
 */
export function S11Profile() {
  const state = useJourneyStore();
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);
  const openDeepDive = useUIStore((s) => s.openDeepDive);

  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const dialogueSent = useRef(false);
  // Captured for the PNG snapshot. We ref the card-face div so the export
  // includes the gold border but not the breathing halo (which extends
  // beyond its box and would look weird as a frozen blur in a share image).
  const cardRef = useRef<HTMLDivElement>(null);

  // ── Resolve house / crowned / name ────────────────────────────────────
  const house = HOUSES.find((h) => h.id === state.houseId) || HOUSES[0];
  const houseColor = house.hex;
  const houseId = state.houseId;
  const crowned = state.matchedIdeas
    ? [state.matchedIdeas.nest, state.matchedIdeas.spark, state.matchedIdeas.wildvine]
        .find((s) => s.idea.idea_id === state.crownedIdeaId) || state.matchedIdeas.nest
    : null;
  const allIdeas = state.matchedIdeas
    ? [state.matchedIdeas.nest, state.matchedIdeas.spark, state.matchedIdeas.wildvine]
    : [];
  const displayName = state.displayName || 'Founder';

  // ── Archetype + radar scores via ForgeProfile → personality ───────────
  const { archetype, radarScores, matchPct } = useMemo(() => {
    const profile = buildForgeProfile(state);
    const personality = extractPersonality(profile);
    const motive = pickDominantMotive(personality.mcClelland);
    const arch = getArchetype((houseId ?? 'architects') as HouseSlug, motive);

    // Map scoring-engine signals to 6 display axes. Values 0-100.
    const rs: RadarScores = {
      scale:   Math.round(personality.mcClelland.nPow * 100),
      impact:  Math.round(personality.mcClelland.nAff * 100 * 0.6 + personality.mcClelland.nPow * 100 * 0.4),
      craft:   Math.round(personality.bigFive.C * 100),
      empathy: Math.round(personality.bigFive.A * 100),
      vision:  Math.round(personality.bigFive.O * 100),
      grit:    Math.round((1 - personality.bigFive.N) * 100 * 0.5 + personality.boldness * 100 * 0.5),
    };

    return {
      archetype: arch,
      radarScores: rs,
      matchPct: crowned?.displayScore ?? 85,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.houseId, state.crystalOrbs, state.blotResponses, state.wordResponses, state.industriesKept, crowned?.displayScore]);

  // "Sealed in" time — we don't track wall clock, so approximate from the
  // number of completed screens (×0.8 min each). Honest enough for MVP.
  const completedCount = state.completedScreens.length;
  const sealedMinutes = Math.max(3, Math.round(completedCount * 0.8));
  const sealedTime = `${sealedMinutes}m`;

  // ── Dialogue on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    analytics.complete(houseId || 'unknown', crowned?.idea.idea_name || 'unknown');
    enqueueMessage({ speaker: 'cedric', text: lines.s11.cedric.intro, type: 'dialogue' });
    setTimeout(
      () => enqueueMessage({ speaker: 'cedric', text: lines.s11.cedric.final(displayName), type: 'dialogue' }),
      3000,
    );
    setTimeout(
      () => enqueueMessage({
        speaker: 'pip',
        text: pathLine('s11.pip.final', lines.s11.pip.final, state.ideaMode),
        type: 'dialogue',
      }),
      5000,
    );
  }, [enqueueMessage, displayName, houseId, crowned, state.ideaMode]);

  // ── Share helpers used by the quick-share row ─────────────────────────
  const igCaption = useMemo(
    () =>
      `I'm ${archetype.name.toLowerCase()} on @catalst 🌱 founder twin: ${archetype.twinGlobal.name}. Tag 3 friends who should start an AI business. #CatalstChallenge`,
    [archetype],
  );

  // Silent clipboard helper used by every share button — fires-and-forgets
  // with a fallback for older browsers. Returns a promise so the caller can
  // sequence a toast after the copy settles.
  async function copyCaption(): Promise<void> {
    try {
      await navigator.clipboard.writeText(igCaption);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = igCaption;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  /**
   * Snapshot the founder card as a PNG and trigger a browser download.
   * Waits for fonts to settle so the Playfair display + mono fonts render
   * sharp in the export. 2× pixelRatio hits "HD" for the IG story aspect.
   */
  async function downloadCard() {
    if (!cardRef.current || shareStatus === 'downloading') return;
    analytics.cta('download');
    setShareStatus('downloading');
    try {
      // Let any in-flight webfonts finish before we rasterise.
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#0C0E12',
      });
      const safeName = displayName.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'founder';
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `catalst-${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setShareStatus('downloaded');
      setTimeout(() => setShareStatus('idle'), 2200);
    } catch (err) {
      console.error('[S11] download failed:', err);
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 2200);
    }
  }

  function flashCopied() {
    setShareStatus('copied');
    setTimeout(() => setShareStatus((s) => (s === 'copied' ? 'idle' : s)), 1800);
  }

  async function shareTwitter() {
    analytics.cta('twitter');
    await copyCaption();
    flashCopied();
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(igCaption)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  async function shareInstagram() {
    analytics.cta('instagram');
    // IG has no web-intent for posting, so we copy + toast. User pastes
    // the caption into the story they'll attach their downloaded card to.
    await copyCaption();
    flashCopied();
  }

  async function shareLinkedIn() {
    analytics.cta('linkedin');
    await copyCaption();
    flashCopied();
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://catalst.app')}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  return (
    <>
      {/* Vault backdrop — fixed gradient so S11 reads as its own chamber. */}
      <div
        className="fixed inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/65 pointer-events-none z-0"
        aria-hidden
      />

      <motion.div
        variants={staggerContainer(0.3, 0.12)}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-md mx-auto px-4 py-6 space-y-5 overflow-y-auto"
      >
        {/* ══════════ FOUNDER TRADING CARD ══════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: easeOvershoot }}
        >
          {/* Border stays STILL — a rotating conic read as busy on a share
              artifact. Instead we breathe a glow halo around the card so it
              feels alive without the motion distracting from the content. */}
          <div className="relative rounded-3xl p-[2px]">
            {/* Breathing halo — sits BEHIND the border, blurs out past the
                card edge. Pulses opacity + spread so the card reads "lit"
                rather than "spinning." Matches the pattern of the Forge
                Crystal CTA's boxShadow pulse (S06). */}
            <motion.div
              aria-hidden
              className="absolute -inset-2 rounded-[26px] pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${houseColor}55, ${houseColor}00 70%)`,
                filter: 'blur(14px)',
              }}
              animate={{ opacity: [0.45, 0.85, 0.45], scale: [1, 1.04, 1] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Static holographic border — conic fill, no rotation. */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: `conic-gradient(from 140deg, ${houseColor}, ${houseColor}aa, #ffffff22, ${houseColor}, ${houseColor})`,
              }}
            />
            <div
              ref={cardRef}
              className="relative rounded-[22px] bg-black/75 backdrop-blur-md p-4 sm:p-5 aspect-[9/16] overflow-hidden"
              style={{ boxShadow: `0 0 40px ${houseColor}4D` }}
            >
              {/* Row 1: house label + rarity tier */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HouseCrest color={houseColor} name={house.name} />
                  <span className="text-[10px] tracking-[0.25em] opacity-75">
                    {house.name?.toUpperCase() ?? 'FOUNDER'}
                  </span>
                </div>
                <span
                  className="text-[10px] tracking-[0.25em] px-2 py-1 rounded-full border"
                  style={{ borderColor: `${houseColor}60`, color: houseColor }}
                >
                  {archetype.rarity.toUpperCase()}
                </span>
              </div>

              {/* Row 2: name + archetype */}
              <div className="mt-5">
                <h1 className="font-serif text-3xl leading-none text-ivory">{displayName}</h1>
                <h2 className="font-serif italic text-lg mt-1" style={{ color: houseColor }}>
                  {archetype.name}
                </h2>
              </div>

              {/* Row 3: pull quote — narrative, 14px+ on mobile per audit rule */}
              <blockquote
                className="mt-4 text-[14px] italic text-ivory/90 border-l-2 pl-3 break-words whitespace-normal leading-snug line-clamp-3"
                style={{ borderColor: houseColor }}
              >
                &ldquo;{archetype.pullQuote}&rdquo;
              </blockquote>

              {/* Row 4: radar */}
              <div className="my-5 flex justify-center">
                <RadarChart scores={radarScores} color={houseColor} size={200} />
              </div>

              {/* Row 5: 3-stat pill row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <StatPill label="RARITY" value={archetype.rarity} color={houseColor} />
                <StatPill label="SEALED IN" value={sealedTime} color={houseColor} />
                <StatPill label="MATCH" value={`${matchPct}%`} color={houseColor} />
              </div>

              {/* Row 6: founder twin */}
              <div className="mt-5">
                <div className="text-[10px] tracking-[0.25em] opacity-65 mb-2">YOUR FOUNDER TWIN</div>
                <FounderTwinInline twin={archetype.twinGlobal} color={houseColor} />
                <div className="text-[10px] opacity-55 mt-2 text-center">
                  · and {archetype.twinIndian.name.split(' ').slice(-1)[0]} in India
                </div>
              </div>

              {/* Row 7: signature + kryptonite */}
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[9px] tracking-widest opacity-60 mb-1">SIGNATURE MOVE</div>
                  <div className="opacity-85 italic break-words whitespace-normal leading-snug">{archetype.signatureMove}</div>
                </div>
                <div>
                  <div className="text-[9px] tracking-widest opacity-60 mb-1">KRYPTONITE</div>
                  <div className="opacity-85 italic break-words whitespace-normal leading-snug">{archetype.kryptonite}</div>
                </div>
              </div>

              {/* Row 8: crowned idea */}
              {crowned && (
                <div className="mt-5 rounded-xl border border-white/10 p-3">
                  <div className="text-[9px] tracking-widest opacity-60">CROWNED IDEA</div>
                  <div className="font-semibold text-base mt-1 text-ivory">
                    {crowned.idea.idea_name}
                  </div>
                  <div className="text-xs opacity-70">
                    in {crowned.idea.domain_primary.replace(/_/g, ' ')}
                  </div>
                </div>
              )}

              {/* Row 9: url + challenge badge */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[10px]">
                <span className="tracking-widest opacity-50">#CATALSTCHALLENGE</span>
                <span className="font-mono opacity-60">
                  catalst.app/{houseId ?? 'founder'}/{displayName.toLowerCase()}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ══════════ SHARE ROW ═════════════════════════════════════════
            Primary: download the card as a PNG (IG-story ready). Secondary:
            three branded platform buttons — each silently copies the caption
            so whichever share surface opens, the user can paste it. */}
        <motion.div variants={fadeSlideUp} className="space-y-2.5">
          <button
            type="button"
            onClick={downloadCard}
            disabled={shareStatus === 'downloading'}
            aria-label="Download founder card"
            className="w-full h-12 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            style={{
              background: houseColor,
              color: '#0C0E12',
              boxShadow: `0 6px 22px ${houseColor}55`,
            }}
          >
            <DownloadIcon size={17} />
            <span>
              {shareStatus === 'downloading'
                ? 'Preparing image…'
                : shareStatus === 'downloaded'
                ? 'Saved to your device'
                : shareStatus === 'error'
                ? 'Download failed — try again'
                : 'Download founder card'}
            </span>
          </button>

          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'twitter',   label: 'Share on X',         onClick: shareTwitter,   Icon: XIcon },
              { key: 'instagram', label: 'Share on Instagram', onClick: shareInstagram, Icon: InstagramIcon },
              { key: 'linkedin',  label: 'Share on LinkedIn',  onClick: shareLinkedIn,  Icon: LinkedInIcon },
            ].map(({ key, label, onClick, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={onClick}
                aria-label={label}
                className="h-11 rounded-xl flex items-center justify-center transition-colors border"
                style={{
                  background: `${houseColor}14`,
                  borderColor: `${houseColor}55`,
                  color: houseColor,
                }}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>

          {shareStatus === 'copied' && (
            <p className="text-[11px] text-emerald-300/85 text-center">
              Caption copied — paste when you post.
            </p>
          )}
        </motion.div>

        {/* ══════════ TOP MATCHED IDEAS ═══════════════════════════════ */}
        <motion.section variants={fadeSlideUp}>
          <h2 className="font-serif text-lg text-ivory mb-3 px-1">Your Top Matches</h2>
          <div className="space-y-3">
            {allIdeas.map((si) => {
              const isCrowned = si.idea.idea_id === state.crownedIdeaId;
              return (
                <button
                  key={si.idea.idea_id}
                  type="button"
                  onClick={() => openDeepDive(si.idea.idea_id)}
                  className={`w-full text-left rounded-xl p-3 bg-white/5 backdrop-blur-sm transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
                    isCrowned ? 'border-2 border-gold/60' : 'border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isCrowned ? 'text-gold' : 'text-ivory'
                      }`}
                    >
                      {isCrowned && <span className="mr-1">👑</span>}
                      {si.idea.idea_name}
                    </p>
                    <span className="text-[10px] font-mono text-ivory/50 shrink-0">
                      {si.displayScore}%
                    </span>
                  </div>
                  <p className="text-sm text-ivory/60 mt-1 line-clamp-2 break-words whitespace-normal leading-snug">
                    {si.idea.one_liner}
                  </p>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* ══════════ #CATALSTCHALLENGE ═══════════════════════════════ */}
        <motion.div variants={fadeSlideUp}>
          <ChallengeSection
            houseColor={houseColor}
            firstName={displayName.split(' ')[0]}
            archetypeName={archetype.name}
            matchPct={matchPct}
            twinName={archetype.twinGlobal.name}
          />
        </motion.div>

        {/* ══════════ MysticVaultCard (full) ══════════════════════════ */}
        <motion.div variants={fadeSlideUp} className="pt-4 border-t border-white/10">
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

// ═══════════ helpers (inline, file-local) ═══════════════════════════

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 py-2">
      <div className="text-[9px] tracking-widest opacity-60">{label}</div>
      <div className="text-sm font-bold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

function FounderTwinInline({ twin, color }: { twin: FounderTwin; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
      <div
        className="w-12 h-12 rounded-full grid place-items-center font-serif text-lg font-bold shrink-0 text-white"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
      >
        {twin.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate text-ivory">{twin.name}</div>
        <div className="text-xs opacity-70 truncate">{twin.company}</div>
        <div className="text-xs italic opacity-60 mt-1 line-clamp-2">&ldquo;{twin.whyQuote}&rdquo;</div>
      </div>
    </div>
  );
}

// ─── Share-row icons (inline SVG — no extra deps, vibes match brand) ─────
//
// We standardise at a 24-unit viewBox so `size` scales all four icons
// consistently, and inherit `currentColor` on stroke/fill so each button's
// house-tinted text color flows through without extra props.

function DownloadIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function LinkedInIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/** Small circular crest with the house initial. Extracted so the card row
 *  stays readable; matches the style used elsewhere in the journey. */
function HouseCrest({ color, name }: { color: string; name: string }) {
  const initial = (name.match(/of (\w)/)?.[1] || name.charAt(0)).toUpperCase();
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center font-serif font-bold text-[13px] border"
      style={{
        color,
        borderColor: `${color}80`,
        background: `radial-gradient(circle at 35% 25%, ${color}35, ${color}08)`,
        boxShadow: `0 0 10px ${color}55`,
      }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
