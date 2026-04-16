/**
 * POST /api/narrative
 *
 * Generates personalized "Why You" or "Mirror Pool" text using Gemini.
 * Fallback to static template on API failure.
 *
 * Body: { type: 'whyYou' | 'mirrorPool', context: {...}, sessionId: string }
 * Rate limit: 1 req per session per type.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

// Rate limit tracking (in-memory, resets on deploy)
const generated = new Map<string, Set<string>>();

function checkRateLimit(sessionId: string, type: string): boolean {
  const key = sessionId;
  if (!generated.has(key)) generated.set(key, new Set());
  const types = generated.get(key)!;
  if (types.has(type)) return false;
  types.add(type);
  return true;
}

// Static fallback templates
function whyYouFallback(ctx: Record<string, string>): string {
  const workStyle = ctx.userWorkStyle || 'analytical';
  const house = ctx.houseId || 'founder';
  const idea = ctx.ideaName || 'this idea';
  return `Your ${workStyle} approach makes you a natural fit for ${idea}. As a ${house}, your instinct to build with intention is exactly what this space needs. Trust the pull.`;
}

function mirrorPoolFallback(ctx: Record<string, string>): string {
  const house = ctx.houseName || 'founder';
  const strengths = ctx.topStrengths || 'vision and persistence';
  return `You carry the mark of a ${house}. Your strengths in ${strengths} are rare and powerful. The ideas you build will reflect who you are, not just what the market wants. That's your edge.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, context, sessionId } = body as {
      type: 'whyYou' | 'mirrorPool';
      context: Record<string, string>;
      sessionId?: string;
    };

    if (!type || !context) {
      return NextResponse.json({ error: 'Missing type or context' }, { status: 400 });
    }

    // Rate limit check
    if (sessionId && !checkRateLimit(sessionId, type)) {
      const fallback = type === 'whyYou' ? whyYouFallback(context) : mirrorPoolFallback(context);
      return NextResponse.json({ text: fallback, source: 'rate-limited' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallback = type === 'whyYou' ? whyYouFallback(context) : mirrorPoolFallback(context);
      return NextResponse.json({ text: fallback, source: 'fallback-no-key' });
    }

    // Build prompt
    const prompt = type === 'whyYou'
      ? `You are Cedric, a wise mentor with dry wit. Write 2-3 sentences explaining why this startup idea fits this person. Be direct, warm, zero jargon. Cedric voice: gravity, not lectures.

Idea: ${context.ideaName} — ${context.ideaOneLiner || ''}
Person's work style: ${context.userWorkStyle || 'analytical'}
House: ${context.houseId || 'unknown'}
Top strengths: ${context.topStrengths || 'determination'}

Write ONLY the narrative. No preamble, no quotes.`
      : `You are Cedric, a wise mentor giving a closing reflection to a founder. Write 2-3 paragraphs about this person's founder psychology. Most gravitas, ceremony register.

House: ${context.houseName || 'unknown'}
Strengths: ${context.topStrengths || 'vision'}
Motives: ${context.topMotives || 'impact'}
Ideas matched: ${context.ideaNames || 'startups'}
Crystal orbs: ${context.crystalOrbs || 'unknown'}

Write ONLY the reflection. No preamble.`;

    // Call Gemini with 10s timeout, 1 retry
    const maxTokens = type === 'whyYou' ? 150 : 300;
    let text: string | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) break;
        }
      } catch {
        // Retry on timeout/error
      }
    }

    if (!text) {
      text = type === 'whyYou' ? whyYouFallback(context) : mirrorPoolFallback(context);
      return NextResponse.json({ text, source: 'fallback' });
    }

    return NextResponse.json({ text: text.trim(), source: 'gemini' });
  } catch (error) {
    Sentry.captureException(error, { extra: { route: '/api/narrative' } });
    return NextResponse.json(
      { text: 'The garden sees something in you. Trust the match.', source: 'error' },
      { status: 200 }
    );
  }
}
