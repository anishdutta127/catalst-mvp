'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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

  const [copied, setCopied] = useState<'share' | null>(null);
  const dialogueSent = useRef(false);

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
  }, [enqueueMessage, displayName, houseId, crowned]);

  // ── Share helpers used by the quick-share row ─────────────────────────
  const igCaption = useMemo(
    () =>
      `I'm ${archetype.name.toLowerCase()} on @catalst 🌱 founder twin: ${archetype.twinGlobal.name}. Tag 3 friends who should start an AI business. #CatalstChallenge`,
    [archetype],
  );

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(igCaption);
      setCopied('share');
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // Fallback for older browsers.
      const ta = document.createElement('textarea');
      ta.value = igCaption;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied('share');
      setTimeout(() => setCopied(null), 1600);
    }
  }

  function openWhatsApp() {
    analytics.cta('whatsapp');
    const msg = `just found out I'm ${archetype.name} on Catalst 👀 ${matchPct}% match with ${archetype.twinGlobal.name}. catalst.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  }

  function openTwitter() {
    const t = encodeURIComponent(igCaption);
    window.open(`https://twitter.com/intent/tweet?text=${t}`, '_blank', 'noopener,noreferrer');
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
          <motion.div
            className="rounded-3xl p-[2px]"
            style={{
              background: `conic-gradient(from 0deg, ${houseColor}, ${houseColor}aa, #ffffff22, ${houseColor}, ${houseColor})`,
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          >
            <div className="rounded-[22px] bg-black/75 backdrop-blur-md p-4 sm:p-5 aspect-[9/16] relative overflow-hidden">
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
                className="mt-4 text-[14px] leading-relaxed italic text-ivory/90 border-l-2 pl-3"
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
                  <div className="opacity-85 italic">{archetype.signatureMove}</div>
                </div>
                <div>
                  <div className="text-[9px] tracking-widest opacity-60 mb-1">KRYPTONITE</div>
                  <div className="opacity-85 italic">{archetype.kryptonite}</div>
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
          </motion.div>
        </motion.div>

        {/* ══════════ QUICK SHARE ROW ══════════════════════════════════ */}
        <motion.div variants={fadeSlideUp} className="flex justify-center gap-3">
          {[
            { icon: '📸', label: 'Instagram', onClick: copyCaption },
            { icon: '🐦', label: 'Twitter', onClick: openTwitter },
            { icon: '💬', label: 'WhatsApp', onClick: openWhatsApp },
            { icon: '⬇️', label: 'Download', onClick: copyCaption }, // future batch: html2canvas
          ].map((b) => (
            <button
              key={b.label}
              onClick={b.onClick}
              aria-label={b.label}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center transition"
            >
              <span aria-hidden className="text-base">{b.icon}</span>
            </button>
          ))}
        </motion.div>
        {copied === 'share' && (
          <p className="text-[11px] text-emerald-300/80 text-center -mt-3">
            Caption copied — paste into your story.
          </p>
        )}

        {/* ══════════ TOP MATCHED IDEAS ═══════════════════════════════ */}
        <motion.section variants={fadeSlideUp}>
          <h2 className="font-serif text-lg text-ivory mb-3 px-1">Your Top Matches</h2>
          <div className="space-y-3">
            {allIdeas.map((si) => {
              const isCrowned = si.idea.idea_id === state.crownedIdeaId;
              return (
                <div
                  key={si.idea.idea_id}
                  className={`rounded-xl p-3 bg-white/5 backdrop-blur-sm ${
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
                  <p className="text-sm text-ivory/60 mt-1 line-clamp-1">
                    {si.idea.one_liner}
                  </p>
                </div>
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

        {/* ══════════ SKIP CTA ════════════════════════════════════════ */}
        <motion.button
          variants={fadeSlideUp}
          onClick={() => {
            const el = document.querySelector('[data-testid="vault-continue-cta"]') as HTMLButtonElement | null;
            el?.click();
          }}
          className="block mx-auto mt-2 text-ivory/60 hover:text-ivory/90 underline-offset-4 hover:underline transition text-sm"
        >
          Maybe later — continue to my house →
        </motion.button>

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
