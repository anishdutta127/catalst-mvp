'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * #CatalstChallenge viral-loop section for S11. Renders below the founder
 * card. Three share actions:
 *   - WhatsApp: opens wa.me with a pre-filled message
 *   - Instagram Story: copies caption to clipboard + prompts user to paste
 *   - Download card: triggers card capture (future batch — for now just copies)
 */

export function ChallengeSection({
  houseColor,
  firstName,
  archetypeName,
  matchPct,
  twinName,
}: {
  houseColor: string;
  firstName: string;
  archetypeName: string;
  matchPct: number;
  twinName: string;
}) {
  const [copied, setCopied] = useState<'ig' | 'wa' | null>(null);

  const waText = `just found out I'm ${archetypeName} on Catalst 👀 ${matchPct}% match with ${twinName}. you should try — I'm challenging you to find yours before next week: catalst.app`;
  const igCaption = `I'm ${archetypeName.toLowerCase()} on @catalst 🌱 founder twin: ${twinName}. Tag 3 friends who should start an AI business. #CatalstChallenge`;

  async function copyToClipboard(text: string, which: 'ig' | 'wa') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(which);
      setTimeout(() => setCopied(null), 1800);
    }
  }

  function openWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="rounded-3xl border p-5 sm:p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 70%)',
        borderColor: 'rgba(255,255,255,0.12)',
      }}
    >
      <div className="text-center">
        <div className="text-[10px] tracking-[0.3em] opacity-70 mb-2">#CATALSTCHALLENGE</div>
        <h3 className="font-serif text-xl sm:text-2xl mb-3">Think you know three founders?</h3>
        <p className="text-[13px] opacity-80 leading-relaxed mb-5 max-w-sm mx-auto">
          Tag 3 friends who should start an AI business. First to ship earns bragging rights —
          and we&rsquo;ll be watching.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={openWhatsApp}
            className="min-h-[48px] rounded-xl bg-white/10 hover:bg-white/15 transition text-[13px] font-medium flex items-center justify-center gap-2"
            data-testid="challenge-whatsapp"
          >
            <span aria-hidden>💬</span> WhatsApp
          </button>
          <button
            onClick={() => copyToClipboard(igCaption, 'ig')}
            className="min-h-[48px] rounded-xl bg-white/10 hover:bg-white/15 transition text-[13px] font-medium flex items-center justify-center gap-2"
            data-testid="challenge-instagram"
          >
            <span aria-hidden>📸</span> {copied === 'ig' ? 'Caption copied' : 'Story caption'}
          </button>
        </div>

        <button
          onClick={() => copyToClipboard(`${firstName} · ${archetypeName} · ${matchPct}% · Twin: ${twinName} · catalst.app`, 'wa')}
          className="w-full min-h-[48px] rounded-xl font-semibold text-[13px] text-dark flex items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${houseColor}, ${houseColor}cc)`,
          }}
          data-testid="challenge-download"
        >
          <span aria-hidden>⬇️</span>
          {copied === 'wa' ? 'Summary copied' : 'Save + Challenge 3 Friends'}
        </button>

        <p className="text-[10px] opacity-50 mt-3">
          Challenge message auto-fills. Edit before posting.
        </p>
      </div>
    </motion.div>
  );
}
