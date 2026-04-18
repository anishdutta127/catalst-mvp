/**
 * Catalst v8 — Batch 7C merge script.
 *
 * Reads content/ideas-v8-expansion.json (100 new ideas, CAT-0261 to CAT-0360)
 * and appends them to content/ideas.json after validating:
 *
 *   1. No duplicate idea_id with existing ideas
 *   2. All 8 motive_* fields present and in [0, 1]
 *   3. All 5 *_fit fields present and in [0, 1]
 *   4. All 8 is_* flag fields present (boolean)
 *   5. tags is a non-empty array of 2-4 strings
 *   6. All required scalar fields present
 *
 * USAGE:
 *   npx tsx scripts/merge-ideas-v8.ts
 *
 * ORDER OF OPERATIONS — this must run AFTER backfill-tags.ts so the schema
 * shape of existing ideas already includes `tags`. Running them in the other
 * order is also OK (new ideas carry their own tags), but we recommend:
 *
 *   1. Update lib/scoring/types.ts  (add `tags: string[]`)
 *   2. Run backfill-tags.ts         (patches existing 260 ideas)
 *   3. Run merge-ideas-v8.ts        (this script — adds the 100 new ones)
 *   4. Run test-matching-fuzz.ts    (sanity check)
 */

import * as fs from 'fs';
import * as path from 'path';

const CONTENT = path.join(process.cwd(), 'content', 'ideas.json');
const EXPANSION = path.join(process.cwd(), 'content', 'ideas-v8-expansion.json');
const BACKUP = path.join(process.cwd(), 'content', 'ideas.json.pre-v8c-merge.bak');

const MOTIVE_KEYS = [
  'motive_freedom', 'motive_wealth', 'motive_status', 'motive_mastery',
  'motive_impact', 'motive_belonging', 'motive_creativity', 'motive_stability',
] as const;

const FIT_KEYS = [
  'builder_fit', 'researcher_fit', 'seller_fit', 'creator_fit', 'host_fit',
] as const;

const FLAG_KEYS = [
  'is_marketplace', 'is_hardware_heavy', 'is_enterprise_sales',
  'is_inventory_heavy', 'is_regulatory_heavy', 'is_local_offline',
  'is_ad_dependent', 'is_long_rnd',
] as const;

const REQUIRED_SCALAR = [
  'idea_id', 'idea_name', 'one_liner', 'domain_primary',
  'problem_type_primary', 'ideal_social_energy', 'maturity',
  'customer_archetype', 'pain_to_promise', 'why_now',
  'starter_model', 'first_7day_move', 'aiAdvantage',
] as const;

interface Idea {
  idea_id: string;
  idea_name: string;
  tags?: string[];
  [k: string]: unknown;
}

function validate(idea: Idea): string[] {
  const errs: string[] = [];
  const id = idea.idea_id || '??';

  // Required scalars present and non-empty
  for (const k of REQUIRED_SCALAR) {
    const v = idea[k];
    if (v === undefined || v === null || v === '') {
      errs.push(`${id}: missing or empty '${k}'`);
    }
  }

  // Motives
  for (const k of MOTIVE_KEYS) {
    const v = idea[k];
    if (typeof v !== 'number' || v < 0 || v > 1) {
      errs.push(`${id}: '${k}' is not a number in [0,1] (got ${v})`);
    }
  }

  // Fits
  for (const k of FIT_KEYS) {
    const v = idea[k];
    if (typeof v !== 'number' || v < 0 || v > 1) {
      errs.push(`${id}: '${k}' is not a number in [0,1] (got ${v})`);
    }
  }

  // Flags
  for (const k of FLAG_KEYS) {
    const v = idea[k];
    if (typeof v !== 'boolean') {
      errs.push(`${id}: '${k}' is not a boolean (got ${v})`);
    }
  }

  // Tags
  const tags = idea.tags;
  if (!Array.isArray(tags)) {
    errs.push(`${id}: 'tags' is not an array`);
  } else if (tags.length < 2 || tags.length > 4) {
    errs.push(`${id}: 'tags' has ${tags.length} items (expected 2-4)`);
  }

  // Nested required groups
  const analytics = idea.analytics as Record<string, unknown> | undefined;
  if (!analytics || typeof analytics !== 'object') {
    errs.push(`${id}: 'analytics' block missing`);
  }

  const proof = idea.proof as Record<string, unknown> | undefined;
  if (!proof || typeof proof !== 'object') {
    errs.push(`${id}: 'proof' block missing`);
  }

  const quickStart = idea.quickStart as Record<string, unknown> | undefined;
  if (!quickStart || typeof quickStart !== 'object') {
    errs.push(`${id}: 'quickStart' block missing`);
  }

  return errs;
}

function main(): void {
  if (!fs.existsSync(CONTENT)) {
    console.error(`❌ ${CONTENT} not found`);
    process.exit(1);
  }
  if (!fs.existsSync(EXPANSION)) {
    console.error(`❌ ${EXPANSION} not found — did you copy ideas-v8-expansion.json into content/?`);
    process.exit(1);
  }

  const existing: Idea[] = JSON.parse(fs.readFileSync(CONTENT, 'utf8'));
  const incoming: Idea[] = JSON.parse(fs.readFileSync(EXPANSION, 'utf8'));

  console.log(`Existing: ${existing.length} ideas`);
  console.log(`Incoming: ${incoming.length} ideas (from ${path.basename(EXPANSION)})`);

  // Duplicate check
  const existingIds = new Set(existing.map((i) => i.idea_id));
  const dupIds = incoming.filter((i) => existingIds.has(i.idea_id)).map((i) => i.idea_id);
  if (dupIds.length > 0) {
    console.error(`❌ ${dupIds.length} incoming IDs already exist in content/ideas.json:`);
    console.error(`   ${dupIds.slice(0, 10).join(', ')}${dupIds.length > 10 ? ', …' : ''}`);
    console.error(`Refusing to merge. Resolve the collision first.`);
    process.exit(1);
  }

  // Internal duplicate check on incoming
  const incomingIds = incoming.map((i) => i.idea_id);
  const incomingDups = incomingIds.filter((id, idx) => incomingIds.indexOf(id) !== idx);
  if (incomingDups.length > 0) {
    console.error(`❌ incoming has internal duplicates: ${[...new Set(incomingDups)].join(', ')}`);
    process.exit(1);
  }

  // Schema validation
  const allErrors: string[] = [];
  for (const idea of incoming) {
    allErrors.push(...validate(idea));
  }
  if (allErrors.length > 0) {
    console.error(`❌ ${allErrors.length} validation errors:`);
    for (const e of allErrors.slice(0, 30)) {
      console.error(`   ${e}`);
    }
    if (allErrors.length > 30) {
      console.error(`   … and ${allErrors.length - 30} more`);
    }
    process.exit(1);
  }

  // Backup
  if (!fs.existsSync(BACKUP)) {
    fs.writeFileSync(BACKUP, fs.readFileSync(CONTENT, 'utf8'));
    console.log(`📦 Backup written to ${BACKUP}`);
  }

  // Merge + write
  const merged = [...existing, ...incoming];
  fs.writeFileSync(CONTENT, JSON.stringify(merged, null, 2));

  console.log(`\n✅ Merged. content/ideas.json now has ${merged.length} ideas.`);
  console.log(`   (added ${incoming.length}, previous was ${existing.length})`);

  // Tag + domain summary
  const tagCounts = new Map<string, number>();
  const domCounts = new Map<string, number>();
  for (const idea of merged) {
    for (const t of idea.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    const d = idea.domain_primary as string;
    domCounts.set(d, (domCounts.get(d) ?? 0) + 1);
  }
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log(`\nTop 10 tags across full corpus:`);
  for (const [t, c] of topTags) console.log(`  ${t.padEnd(20)} ${c}`);
  const thinDomains = [...domCounts.entries()].filter(([, c]) => c < 5).sort((a, b) => a[1] - b[1]);
  if (thinDomains.length > 0) {
    console.log(`\nStill-thin domains (<5 ideas):`);
    for (const [d, c] of thinDomains) console.log(`  ${d.padEnd(30)} ${c}`);
  }
}

main();
