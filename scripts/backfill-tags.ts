/**
 * Catalst v8 — Tag backfill migration.
 *
 * Adds a `tags: string[]` field to every idea in content/ideas.json based on
 * a rule-engine-generated map. This script is IDEMPOTENT — running it twice
 * is safe; it overwrites existing tags arrays with the authoritative map.
 *
 * USAGE:
 *   npx tsx scripts/backfill-tags.ts
 *
 * WHAT IT DOES:
 *   1. Reads content/ideas.json
 *   2. Writes a backup to content/ideas.json.pre-v8c.bak
 *   3. For each idea, sets idea.tags = TAG_MAP[idea_id] (or [] if missing)
 *   4. Writes content/ideas.json back
 *   5. Prints a coverage summary (tagged / untagged counts)
 *
 * PRECONDITION:
 *   lib/scoring/types.ts must declare `tags: string[]` on the Idea interface
 *   before running this script (so TS compilation stays happy).
 */

import * as fs from 'fs';
import * as path from 'path';

const CONTENT = path.join(process.cwd(), 'content', 'ideas.json');
const BACKUP = path.join(process.cwd(), 'content', 'ideas.json.pre-v8c.bak');

const TAG_MAP: Record<string, string[]> = {
  'CAT-0001': ['content', 'video', 'pets'],
  'CAT-0002': ['content', 'saas'],
  'CAT-0003': ['content', 'ai-agents'],
  'CAT-0004': ['content', 'community'],
  'CAT-0005': ['content', 'community'],
  'CAT-0006': ['edu-skilling', 'saas'],
  'CAT-0007': ['edu-skilling', 'saas'],
  'CAT-0008': ['edu-skilling', 'pets'],
  'CAT-0009': ['edu-skilling', 'saas'],
  'CAT-0010': ['ai-agents', 'saas'],
  'CAT-0011': ['ai-agents', 'civic', 'pets'],
  'CAT-0012': ['ai-agents', 'dev-tools', 'ev-mobility'],
  'CAT-0013': ['ai-agents', 'saas'],
  'CAT-0014': ['ai-agents', 'saas'],
  'CAT-0015': ['productivity', 'saas'],
  'CAT-0016': ['productivity', 'saas'],
  'CAT-0017': ['payments', 'saas'],
  'CAT-0018': ['sustainability', 'saas'],
  'CAT-0019': ['sustainability', 'ev-mobility'],
  'CAT-0020': ['productivity', 'saas', 'hr-tech'],
  'CAT-0021': ['productivity', 'saas'],
  'CAT-0022': ['productivity', 'legal-tech'],
  'CAT-0023': ['food-bev', 'saas'],
  'CAT-0024': ['food-bev', 'saas'],
  'CAT-0025': ['community', 'ev-mobility', 'events', 'dating'],
  'CAT-0026': ['community', 'saas'],
  'CAT-0027': ['telemedicine', 'mental-health'],
  'CAT-0028': ['telemedicine', 'fitness'],
  'CAT-0029': ['d2c', 'commerce'],
  'CAT-0030': ['d2c', 'commerce'],
  'CAT-0031': ['real-estate', 'saas'],
  'CAT-0032': ['productivity', 'construction', 'pets'],
  'CAT-0033': ['productivity', 'saas'],
  'CAT-0034': ['edu-parenting', 'wearables'],
  'CAT-0035': ['ai-agents', 'ai-voice'],
  'CAT-0036': ['ai-agents', 'video'],
  'CAT-0037': ['travel', 'saas'],
  'CAT-0038': ['entertainment', 'content'],
  'CAT-0039': ['productivity', 'saas'],
  'CAT-0040': ['community', 'design'],
  'CAT-0041': ['ai-agents', 'saas'],
  'CAT-0042': ['productivity', 'legal-tech'],
  'CAT-0043': ['ai-agents', 'ai-voice'],
  'CAT-0044': ['productivity', 'saas', 'events'],
  'CAT-0045': ['telemedicine', 'mental-health', 'sleep'],
  'CAT-0046': ['ai-agents', 'civic'],
  'CAT-0047': ['ai-agents', 'saas'],
  'CAT-0048': ['edu-skilling', 'edu-k12', 'edu-tutor', 'edu-language'],
  'CAT-0049': ['productivity', 'saas'],
  'CAT-0050': ['sustainability', 'saas'],
  'CAT-0051': ['content', 'saas'],
  'CAT-0052': ['content', 'ai-agents'],
  'CAT-0053': ['content', 'dating'],
  'CAT-0054': ['content', 'edu-language'],
  'CAT-0055': ['content', 'community'],
  'CAT-0056': ['content', 'saas'],
  'CAT-0057': ['ai-agents', 'agritech'],
  'CAT-0058': ['ai-agents', 'agritech'],
  'CAT-0059': ['sustainability', 'drones', 'agritech'],
  'CAT-0060': ['food-bev', 'saas'],
  'CAT-0061': ['productivity', 'saas'],
  'CAT-0062': ['d2c', 'commerce'],
  'CAT-0063': ['productivity', 'saas', 'logistics'],
  'CAT-0064': ['real-estate', 'drones', 'construction'],
  'CAT-0065': ['real-estate', 'saas'],
  'CAT-0066': ['real-estate', 'saas'],
  'CAT-0067': ['d2c', 'commerce'],
  'CAT-0068': ['productivity', 'saas', 'beauty'],
  'CAT-0069': ['sustainability', 'logistics', 'fashion'],
  'CAT-0070': ['telemedicine', 'fitness'],
  'CAT-0071': ['productivity', 'saas'],
  'CAT-0072': ['community', 'sports'],
  'CAT-0073': ['productivity', 'legal-tech'],
  'CAT-0074': ['productivity', 'saas'],
  'CAT-0075': ['productivity', 'legal-tech'],
  'CAT-0076': ['ai-agents', 'space', 'agritech'],
  'CAT-0077': ['ai-agents', 'space'],
  'CAT-0078': ['ai-agents', 'dev-tools', 'ev-mobility'],
  'CAT-0079': ['ai-agents', 'dev-tools', 'ev-mobility', 'design'],
  'CAT-0080': ['ai-agents', 'ai-coding', 'manufacturing'],
  'CAT-0081': ['telemedicine', 'mental-health'],
  'CAT-0082': ['telemedicine', 'mental-health'],
  'CAT-0083': ['telemedicine', 'mental-health'],
  'CAT-0084': ['telemedicine', 'mental-health'],
  'CAT-0085': ['entertainment', 'content', 'gaming'],
  'CAT-0086': ['entertainment', 'content', 'gaming', 'food-bev'],
  'CAT-0087': ['entertainment', 'content', 'gaming', 'dev-tools'],
  'CAT-0088': ['productivity', 'saas', 'hr-tech'],
  'CAT-0089': ['productivity', 'saas', 'hr-tech'],
  'CAT-0090': ['payments', 'saas'],
  'CAT-0091': ['insurance', 'edu-language'],
  'CAT-0092': ['insurance', 'saas'],
  'CAT-0093': ['ai-agents', 'saas'],
  'CAT-0094': ['sustainability', 'ev-mobility'],
  'CAT-0095': ['edu-skilling', 'edu-tutor', 'edu-language'],
  'CAT-0096': ['ai-agents', 'video', 'content', 'edu-language'],
  'CAT-0097': ['sustainability', 'dating', 'energy'],
  'CAT-0098': ['sustainability', 'wearables', 'neobank'],
  'CAT-0099': ['pets', 'wearables'],
  'CAT-0100': ['pets', 'saas'],
  'CAT-0101': ['ai-agents', 'pets'],
  'CAT-0102': ['community', 'wearables', 'civic'],
  'CAT-0103': ['edu-parenting', 'ai-voice', 'video', 'elder-care'],
  'CAT-0104': ['telemedicine', 'elder-care', 'pets'],
  'CAT-0105': ['travel', 'logistics'],
  'CAT-0106': ['food-bev', 'pets'],
  'CAT-0107': ['edu-skilling', 'edu-k12', 'ai-coding', 'edu-language'],
  'CAT-0108': ['edu-skilling', 'saas'],
  'CAT-0109': ['edu-skilling', 'edu-k12'],
  'CAT-0110': ['edu-skilling', 'saas'],
  'CAT-0111': ['productivity', 'saas'],
  'CAT-0112': ['productivity', 'saas', 'longevity'],
  'CAT-0113': ['real-estate', 'saas'],
  'CAT-0114': ['productivity', 'saas'],
  'CAT-0115': ['productivity', 'saas'],
  'CAT-0116': ['productivity', 'saas', 'hr-tech'],
  'CAT-0117': ['productivity', 'saas'],
  'CAT-0118': ['content', 'ai-agents'],
  'CAT-0119': ['ai-agents', 'saas'],
  'CAT-0120': ['ai-agents', 'saas'],
  'CAT-0121': ['d2c', 'commerce', 'ai-voice', 'edu-language'],
  'CAT-0122': ['telemedicine', 'mental-health'],
  'CAT-0123': ['ai-agents', 'ai-content', 'legal-tech'],
  'CAT-0124': ['d2c', 'commerce', 'manufacturing'],
  'CAT-0125': ['productivity', 'legal-tech', 'insurance', 'pets'],
  'CAT-0126': ['community', 'saas'],
  'CAT-0127': ['productivity', 'pets'],
  'CAT-0128': ['telemedicine', 'fitness'],
  'CAT-0129': ['productivity', 'saas'],
  'CAT-0130': ['entertainment', 'content', 'edu-language'],
  'CAT-0131': ['sustainability', 'saas'],
  'CAT-0132': ['edu-skilling', 'saas'],
  'CAT-0133': ['food-bev', 'saas'],
  'CAT-0134': ['pets', 'edu-parenting'],
  'CAT-0135': ['edu-skilling', 'saas'],
  'CAT-0136': ['d2c', 'commerce', 'manufacturing'],
  'CAT-0137': ['ai-agents', 'saas'],
  'CAT-0138': ['edu-skilling', 'content'],
  'CAT-0139': ['edu-parenting', 'saas'],
  'CAT-0140': ['productivity', 'saas', 'spiritual'],
  'CAT-0141': ['productivity', 'saas', 'logistics'],
  'CAT-0142': ['food-bev', 'nutrition'],
  'CAT-0143': ['edu-skilling', 'saas'],
  'CAT-0144': ['ai-agents', 'saas'],
  'CAT-0145': ['telemedicine', 'nutrition'],
  'CAT-0146': ['ai-agents', 'dev-tools', 'ev-mobility', 'ai-coding'],
  'CAT-0147': ['community', 'saas'],
  'CAT-0148': ['edu-skilling', 'saas'],
  'CAT-0149': ['sustainability', 'saas'],
  'CAT-0150': ['productivity', 'saas'],
  'CAT-0151': ['productivity', 'saas'],
  'CAT-0152': ['productivity', 'saas', 'pets'],
  'CAT-0153': ['productivity', 'saas', 'logistics'],
  'CAT-0154': ['productivity', 'manufacturing'],
  'CAT-0155': ['d2c', 'commerce', 'manufacturing'],
  'CAT-0156': ['lending', 'payments'],
  'CAT-0157': ['edu-parenting', 'video'],
  'CAT-0158': ['productivity', 'saas'],
  'CAT-0159': ['ai-agents', 'edu-language'],
  'CAT-0160': ['telemedicine', 'saas'],
  'CAT-0161': ['neobank', 'saas'],
  'CAT-0162': ['community', 'payments'],
  'CAT-0163': ['food-bev', 'design'],
  'CAT-0164': ['pets', 'saas'],
  'CAT-0165': ['telemedicine', 'mental-health'],
  'CAT-0166': ['content', 'saas'],
  'CAT-0167': ['edu-skilling', 'edu-k12', 'edu-tutor', 'edu-language'],
  'CAT-0168': ['ai-agents', 'sustainability', 'agritech'],
  'CAT-0169': ['productivity', 'legal-tech'],
  'CAT-0170': ['sustainability', 'saas'],
  'CAT-0171': ['community', 'saas'],
  'CAT-0172': ['d2c', 'commerce', 'fashion', 'design'],
  'CAT-0173': ['community', 'civic'],
  'CAT-0174': ['productivity', 'saas'],
  'CAT-0175': ['productivity', 'saas'],
  'CAT-0176': ['telemedicine', 'fitness', 'edu-language', 'space'],
  'CAT-0177': ['sports', 'fitness', 'video'],
  'CAT-0178': ['agritech', 'space'],
  'CAT-0179': ['legal-tech', 'civic'],
  'CAT-0180': ['fashion', 'beauty'],
  'CAT-0181': ['hr-tech', 'video', 'pets'],
  'CAT-0182': ['telemedicine', 'elder-care'],
  'CAT-0183': ['gaming', 'ev-mobility', 'ai-coding'],
  'CAT-0184': ['events', 'wearables'],
  'CAT-0185': ['cybersec', 'saas'],
  'CAT-0186': ['productivity', 'saas'],
  'CAT-0187': ['logistics', 'hardware', 'food-bev'],
  'CAT-0188': ['travel', 'spiritual'],
  'CAT-0189': ['edu-skilling', 'pets'],
  'CAT-0190': ['construction', 'real-estate'],
  'CAT-0191': ['ev-mobility', 'payments'],
  'CAT-0192': ['sustainability', 'saas'],
  'CAT-0193': ['insurance', 'edu-language'],
  'CAT-0194': ['wealth', 'crypto'],
  'CAT-0195': ['manufacturing', 'saas'],
  'CAT-0196': ['productivity', 'saas'],
  'CAT-0197': ['home-services', 'saas'],
  'CAT-0198': ['civic', 'pets'],
  'CAT-0199': ['productivity', 'content'],
  'CAT-0200': ['biotech', 'real-estate'],
  'CAT-0201': ['content', 'ai-voice', 'video', 'edu-language'],
  'CAT-0202': ['community', 'saas'],
  'CAT-0203': ['d2c', 'commerce', 'payments', 'logistics'],
  'CAT-0204': ['telemedicine', 'mental-health'],
  'CAT-0205': ['sustainability', 'longevity', 'd2c', 'design'],
  'CAT-0206': ['insurance', 'lending'],
  'CAT-0207': ['real-estate', 'design'],
  'CAT-0208': ['productivity', 'civic'],
  'CAT-0209': ['pets', 'video', 'telemedicine', 'edu-parenting'],
  'CAT-0210': ['hr-tech', 'saas'],
  'CAT-0211': ['sports', 'fitness', 'saas', 'payments'],
  'CAT-0212': ['agritech', 'drones'],
  'CAT-0213': ['d2c', 'commerce'],
  'CAT-0214': ['spiritual', 'saas'],
  'CAT-0215': ['ai-agents', 'edu-language'],
  'CAT-0216': ['edu-parenting', 'ev-mobility', 'wearables'],
  'CAT-0217': ['commerce', 'saas'],
  'CAT-0218': ['sustainability', 'agritech'],
  'CAT-0219': ['ai-voice', 'insurance', 'lending', 'civic'],
  'CAT-0220': ['productivity', 'wealth'],
  'CAT-0221': ['events', 'ev-mobility', 'saas'],
  'CAT-0222': ['telemedicine', 'nutrition', 'food-bev'],
  'CAT-0223': ['edu-skilling', 'mental-health'],
  'CAT-0224': ['d2c', 'commerce', 'payments', 'logistics'],
  'CAT-0225': ['productivity', 'saas', 'real-estate'],
  'CAT-0226': ['sustainability', 'energy'],
  'CAT-0227': ['sports', 'fitness', 'community'],
  'CAT-0228': ['entertainment', 'content'],
  'CAT-0229': ['agritech', 'logistics', 'food-bev'],
  'CAT-0230': ['hr-tech', 'pets'],
  'CAT-0231': ['edu-skilling', 'ai-agents'],
  'CAT-0232': ['food-bev', 'longevity', 'd2c'],
  'CAT-0233': ['fashion', 'beauty', 'sustainability'],
  'CAT-0234': ['sustainability', 'hardware'],
  'CAT-0235': ['edu-skilling', 'edu-language'],
  'CAT-0236': ['productivity', 'saas'],
  'CAT-0237': ['gaming', 'community', 'esports', 'sports'],
  'CAT-0238': ['edu-skilling', 'saas'],
  'CAT-0239': ['home-services', 'saas'],
  'CAT-0240': ['community', 'space', 'pets'],
  'CAT-0241': ['content', 'design'],
  'CAT-0242': ['edu-skilling', 'edu-tutor'],
  'CAT-0243': ['pets', 'insurance', 'edu-parenting'],
  'CAT-0244': ['entertainment', 'content', 'video'],
  'CAT-0245': ['sustainability', 'wearables'],
  'CAT-0246': ['edu-skilling', 'edu-language', 'pets'],
  'CAT-0247': ['ai-agents', 'space', 'mental-health', 'agritech'],
  'CAT-0248': ['telemedicine', 'saas'],
  'CAT-0249': ['sustainability', 'energy'],
  'CAT-0250': ['productivity', 'saas'],
  'CAT-0251': ['real-estate', 'saas'],
  'CAT-0252': ['sustainability', 'agritech', 'community'],
  'CAT-0253': ['entertainment', 'content', 'ev-mobility', 'events'],
  'CAT-0254': ['telemedicine', 'saas'],
  'CAT-0255': ['ai-agents', 'ai-voice', 'edu-language', 'logistics'],
  'CAT-0256': ['fashion', 'beauty'],
  'CAT-0257': ['community', 'saas'],
  'CAT-0258': ['real-estate', 'legal-tech'],
  'CAT-0259': ['telemedicine', 'saas'],
  'CAT-0260': ['edu-skilling', 'saas'],
};

interface Idea {
  idea_id: string;
  tags?: string[];
  [k: string]: unknown;
}

function main(): void {
  if (!fs.existsSync(CONTENT)) {
    console.error(`❌ ${CONTENT} not found — are you running this from repo root?`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CONTENT, 'utf8');
  const ideas: Idea[] = JSON.parse(raw);
  console.log(`Loaded ${ideas.length} ideas from ${CONTENT}`);

  // Write backup once — don't clobber an earlier backup on a re-run
  if (!fs.existsSync(BACKUP)) {
    fs.writeFileSync(BACKUP, raw);
    console.log(`📦 Backup written to ${BACKUP}`);
  } else {
    console.log(`📦 Backup already exists at ${BACKUP} — skipping`);
  }

  let tagged = 0;
  let missing = 0;
  const missingIds: string[] = [];

  for (const idea of ideas) {
    const mapped = TAG_MAP[idea.idea_id];
    if (mapped && mapped.length > 0) {
      idea.tags = mapped;
      tagged++;
    } else if (Array.isArray(idea.tags) && idea.tags.length > 0) {
      // New ideas from the v8 expansion already carry tags — leave them alone
      tagged++;
    } else {
      idea.tags = [];
      missing++;
      missingIds.push(idea.idea_id);
    }
  }

  fs.writeFileSync(CONTENT, JSON.stringify(ideas, null, 2));

  console.log(`\n✅ Tagged ${tagged} / ${ideas.length} ideas`);
  if (missing > 0) {
    console.warn(`⚠️  ${missing} ideas have no tags:`);
    console.warn(`   ${missingIds.slice(0, 10).join(', ')}${missingIds.length > 10 ? ', …' : ''}`);
  }
}

main();
