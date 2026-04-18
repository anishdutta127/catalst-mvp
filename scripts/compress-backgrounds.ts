#!/usr/bin/env tsx
/**
 * Compress the journey background PNGs. The originals sit at 8–10 MB each,
 * which causes a noticeable first-paint lag on mobile. Target: under 1 MB
 * with no perceptible quality loss at ≤1920px display width.
 *
 * Run once:
 *   npx tsx scripts/compress-backgrounds.ts
 *
 * Idempotent: any file already under 1 MB is skipped, so re-running is safe.
 */

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'public/backgrounds';
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.png'));

/**
 * Compression thresholds. First pass knocks the 8-10 MB originals down
 * with mild settings (1920 wide, quality 82). Anything still >1 MB gets
 * a second pass at 1440px / quality 68 — more aggressive but still
 * invisible at typical mobile-to-desktop viewing ratios.
 */
const TARGET_BYTES = 1_000_000;

async function compress(
  fp: string,
  opts: { maxEdge: number; quality: number },
): Promise<void> {
  const buf = await sharp(fp)
    .resize({ width: opts.maxEdge, height: opts.maxEdge, fit: 'inside', withoutEnlargement: true })
    .png({ quality: opts.quality, compressionLevel: 9, palette: true })
    .toBuffer();
  fs.writeFileSync(fp, buf);
}

(async () => {
  for (const f of files) {
    const fp = path.join(DIR, f);
    const beforeSize = fs.statSync(fp).size;

    if (beforeSize < TARGET_BYTES) {
      console.log(`  ✓ ${f} already ${(beforeSize / 1024).toFixed(0)} KB — skip`);
      continue;
    }

    // Pass 1 — mild settings, matches Anish's baseline quality expectations.
    await compress(fp, { maxEdge: 1920, quality: 82 });
    let afterSize = fs.statSync(fp).size;

    // Pass 2 — if still over target, tighten. 1440px max edge keeps the
    // image crisp on 1440p monitors while slashing the ~2M-pixel overhead
    // of an oversized hero bg.
    if (afterSize > TARGET_BYTES) {
      await compress(fp, { maxEdge: 1440, quality: 68 });
      afterSize = fs.statSync(fp).size;
    }

    const sizeNote = afterSize > TARGET_BYTES ? ' ⚠ still > 1MB' : '';
    console.log(
      `  ✏️  ${f}: ${(beforeSize / 1024 / 1024).toFixed(1)} MB → ${(afterSize / 1024).toFixed(0)} KB${sizeNote}`,
    );
  }
  console.log('\n✅ done');
})();
