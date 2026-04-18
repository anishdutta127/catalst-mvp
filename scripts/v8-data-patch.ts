#!/usr/bin/env tsx
/**
 * Catalst v8 — one-shot data patcher.
 *
 * Run ONCE from repo root:
 *   npx tsx scripts/v8-data-patch.ts
 *
 * What it does (idempotent — safe to re-run):
 *   1. Renames 7 duplicate idea_names in content/ideas.json
 *      so no two ideas share a display name.
 *   2. Re-categorises industries in content/industries.json
 *      so the Play tab actually has gaming + sports + travel,
 *      and "Other" drops from 7 entries to 1.
 *
 * Writes a backup to content/ideas.json.pre-v8.bak and
 * content/industries.json.pre-v8.bak before modifying.
 *
 * Does NOT touch scoring logic, does NOT add new ideas,
 * does NOT remove any ideas — only renames + re-tags.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const IDEAS_PATH = path.join(REPO_ROOT, 'content/ideas.json');
const INDUSTRIES_PATH = path.join(REPO_ROOT, 'content/industries.json');

// ═══════════════════════════════════════════════════════════
// 1. IDEA RENAMES — 7 duplicate-name pairs
// ═══════════════════════════════════════════════════════════
//
// Strategy: each pair gets ONE of its two entries renamed so that
// every idea_name in the repository becomes unique. No ideas are
// deleted — both versions stay because their scoring fields differ.

const IDEA_RENAMES: Array<{ id: string; from: string; to: string; reason: string }> = [
  {
    id: 'CAT-0231',
    from: 'PromptCraft',
    to: 'AIAkademi',
    reason: 'CAT-0014 is a done-for-you AI agency; CAT-0231 is a training academy. Different products, different matchmakers. Rename the academy.',
  },
  {
    id: 'CAT-0066',
    from: 'InteriorAI',
    to: 'RoomRender',
    reason: 'Same concept as CAT-0207 but different scoring fields. Rename the earlier/simpler version so both remain as scoring variants.',
  },
  {
    id: 'CAT-0072',
    from: 'RunCrew',
    to: 'PaceMate',
    reason: 'CAT-0072 is a narrow pace-matching app; CAT-0227 is a full running community platform. Different scopes — rename the niche one.',
  },
  {
    id: 'CAT-0091',
    from: 'InsureSimple',
    to: 'PolicyParse',
    reason: 'Same concept as CAT-0193 but scoring fields differ. Rename the earlier version to keep both as matching variants.',
  },
  {
    id: 'CAT-0215',
    from: 'LangBridge',
    to: 'BhashaBridge',
    reason: 'CAT-0095 is an English-confidence tutor (consumer); CAT-0215 is a B2B translation API. Different products. Rename the API one with a more Bharat-native name.',
  },
  {
    id: 'CAT-0162',
    from: 'SkillBridge',
    to: 'ChowkWork',
    reason: 'CAT-0162 is a blue-collar daily-wage gig platform (labour chowks); CAT-0189 is a vocational apprenticeship platform. Different products. Rename to evoke the chowk.',
  },
  {
    id: 'CAT-0170',
    from: 'WasteWorth',
    to: 'ScrapMatch',
    reason: 'Same concept as CAT-0192 but scoring fields differ. Rename the earlier version.',
  },
];

// ═══════════════════════════════════════════════════════════
// 2. INDUSTRY RE-CATEGORISATION — fixes Play tab emptiness
// ═══════════════════════════════════════════════════════════
//
// Current state of the filter bar: Tech/Creative/Health/Finance/Social/Build/Play/Other
// Play currently has only { travel } → tab feels empty.
// "Other" has 7 entries → lazy taxonomy.
//
// This redistributes the 30 industries so each bucket has at least 2
// entries and Play has gaming + sports + travel (what users expect).

const INDUSTRY_CATEGORY_OVERRIDES: Record<string, string> = {
  // Move into 'play' — gaming + sports are what a "Play" tab clicker wants
  gaming_entertainment: 'play',
  sports_fitness: 'play',
  // travel already = play

  // Dissolve the "other" bucket
  saas_productivity: 'tech',
  mental_health: 'health',
  hrtech_future_work: 'tech',
  food_agriculture: 'build',        // agri is physical/biological building
  ecommerce_retail: 'creative',     // commerce + storytelling
  govtech_civic: 'social',          // public sector = social impact
  // real_estate_home stays 'other' (no better home)
};

// ═══════════════════════════════════════════════════════════
// EXECUTION
// ═══════════════════════════════════════════════════════════

function backup(file: string) {
  const backup = `${file}.pre-v8.bak`;
  if (!fs.existsSync(backup)) {
    fs.copyFileSync(file, backup);
    console.log(`  💾 backup written → ${path.relative(REPO_ROOT, backup)}`);
  } else {
    console.log(`  💾 backup already exists → ${path.relative(REPO_ROOT, backup)}`);
  }
}

function patchIdeas() {
  console.log('\n━━━ IDEAS PATCH ━━━');
  if (!fs.existsSync(IDEAS_PATH)) {
    console.error(`  ❌ not found: ${IDEAS_PATH}`);
    process.exit(1);
  }
  backup(IDEAS_PATH);

  const raw = fs.readFileSync(IDEAS_PATH, 'utf8');
  const ideas: Array<{ idea_id: string; idea_name: string }> = JSON.parse(raw);
  console.log(`  📦 loaded ${ideas.length} ideas`);

  const byId = new Map(ideas.map((i) => [i.idea_id, i]));
  let renamed = 0;
  let skipped = 0;

  for (const op of IDEA_RENAMES) {
    const target = byId.get(op.id);
    if (!target) {
      console.warn(`  ⚠️  ${op.id} not found — skipping`);
      skipped++;
      continue;
    }
    if (target.idea_name === op.to) {
      console.log(`  ✓  ${op.id} already = "${op.to}" (idempotent skip)`);
      continue;
    }
    if (target.idea_name !== op.from) {
      console.warn(`  ⚠️  ${op.id} current name is "${target.idea_name}", expected "${op.from}" — skipping to be safe`);
      skipped++;
      continue;
    }
    target.idea_name = op.to;
    console.log(`  ✏️   ${op.id}: "${op.from}" → "${op.to}"`);
    renamed++;
  }

  // Verify no duplicate names remain
  const nameCounts = new Map<string, number>();
  for (const i of ideas) {
    nameCounts.set(i.idea_name, (nameCounts.get(i.idea_name) ?? 0) + 1);
  }
  const remainingDupes = [...nameCounts.entries()].filter(([, c]) => c > 1);
  if (remainingDupes.length > 0) {
    console.error(`  ❌ duplicate names still remain:`);
    for (const [n, c] of remainingDupes) console.error(`     "${n}": ${c}`);
    process.exit(1);
  }
  console.log(`  ✅ all ${ideas.length} ideas have unique names`);

  fs.writeFileSync(IDEAS_PATH, JSON.stringify(ideas, null, 2) + '\n');
  console.log(`  📝 wrote ${ideas.length} ideas (${renamed} renamed, ${skipped} skipped) → ${path.relative(REPO_ROOT, IDEAS_PATH)}`);
}

function patchIndustries() {
  console.log('\n━━━ INDUSTRIES PATCH ━━━');
  if (!fs.existsSync(INDUSTRIES_PATH)) {
    console.error(`  ❌ not found: ${INDUSTRIES_PATH}`);
    process.exit(1);
  }
  backup(INDUSTRIES_PATH);

  const raw = fs.readFileSync(INDUSTRIES_PATH, 'utf8');
  const industries: Array<{ id: string; category: string }> = JSON.parse(raw);
  console.log(`  📦 loaded ${industries.length} industries`);

  let retagged = 0;
  for (const ind of industries) {
    const newCat = INDUSTRY_CATEGORY_OVERRIDES[ind.id];
    if (!newCat) continue;
    if (ind.category === newCat) {
      console.log(`  ✓  ${ind.id} already category="${newCat}" (idempotent skip)`);
      continue;
    }
    console.log(`  ✏️   ${ind.id}: category "${ind.category}" → "${newCat}"`);
    ind.category = newCat;
    retagged++;
  }

  // Report new distribution
  const dist: Record<string, number> = {};
  for (const i of industries) dist[i.category] = (dist[i.category] ?? 0) + 1;
  console.log(`  📊 new category distribution:`);
  for (const [cat, n] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${cat.padEnd(10)} ${n}`);
  }

  fs.writeFileSync(INDUSTRIES_PATH, JSON.stringify(industries, null, 2) + '\n');
  console.log(`  📝 wrote ${industries.length} industries (${retagged} retagged) → ${path.relative(REPO_ROOT, INDUSTRIES_PATH)}`);
}

console.log('🔧 Catalst v8 data patch starting...');
patchIdeas();
patchIndustries();
console.log('\n✅ done. Commit content/ideas.json and content/industries.json.');
console.log('   Backups at *.pre-v8.bak if you need to roll back.\n');
