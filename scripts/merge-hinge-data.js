/**
 * merge-hinge-data.js
 * ───────────────────
 * Merges content/industries-hinge-data.json INTO content/industries.json.
 * Adds new fields (category, color_primary/secondary, tagline, ai_disruption_angle,
 * cultural_trend, recent_headline, investor_sentiment_short, sub_category_cagrs,
 * hinge_prompts) to the 15 core journey industries. Leaves all existing fields
 * untouched so deep-dive/backward compat continues to work.
 *
 * Non-core industries (cybersecurity, space_tech, web3, etc.) get sensible
 * category + color defaults so they still render in the Hinge UI.
 *
 * Run from repo root:  node scripts/merge-hinge-data.js
 */

const fs = require('fs');
const path = require('path');

const INDUSTRIES_PATH = path.join(__dirname, '..', 'content', 'industries.json');
const HINGE_PATH = path.join(__dirname, '..', 'content', 'industries-hinge-data.json');

const CATEGORY_DEFAULTS = {
  cybersecurity: { category: 'tech', color_primary: '#DC2626', color_secondary: '#7F1D1D' },
  space_tech: { category: 'build', color_primary: '#0F172A', color_secondary: '#020617' },
  web3: { category: 'finance', color_primary: '#D97706', color_secondary: '#78350F' },
  senior_care: { category: 'health', color_primary: '#0891B2', color_secondary: '#164E63' },
  cannabis: { category: 'health', color_primary: '#16A34A', color_secondary: '#14532D' },
  parenting: { category: 'social', color_primary: '#DB2777', color_secondary: '#831843' },
  dating: { category: 'social', color_primary: '#E11D48', color_secondary: '#881337' },
  spirituality: { category: 'social', color_primary: '#9333EA', color_secondary: '#4C1D95' },
  travel: { category: 'play', color_primary: '#0EA5E9', color_secondary: '#0C4A6E' },
  pet_care: { category: 'social', color_primary: '#F59E0B', color_secondary: '#78350F' },
};

function main() {
  const industries = JSON.parse(fs.readFileSync(INDUSTRIES_PATH, 'utf8'));
  const hinge = JSON.parse(fs.readFileSync(HINGE_PATH, 'utf8')).industries;

  let enriched = 0;
  let defaulted = 0;

  const merged = industries.map((ind) => {
    const hingeData = hinge[ind.id];
    if (hingeData) {
      enriched++;
      return { ...ind, ...hingeData };
    }
    // Non-core industries — apply sensible defaults so they still render.
    const defaults = CATEGORY_DEFAULTS[ind.id] || {
      category: 'other',
      color_primary: '#78716C',
      color_secondary: '#292524',
    };
    defaulted++;
    return {
      ...ind,
      ...defaults,
      tagline: ind.trending_insight || `$${ind.market_size_b || '?'}B market, ${ind.cagr_pct || '?'}% CAGR`,
      ai_disruption_angle: ind.ai_opportunity || 'AI reshaping workflows across this sector',
      cultural_trend: ind.trending_insight || 'Category on the move',
      recent_headline: `${ind.name} hits milestone — check the latest moves`,
      investor_sentiment_short: ind.investor_sentiment || 'Mixed — category-dependent',
      sub_category_cagrs: [],
      hinge_prompts: [
        { label: 'MY BIGGEST FLEX', text: `$${ind.market_size_b || '?'}B market, ${ind.cagr_pct || '?'}% CAGR — space is moving` },
        { label: 'HONEST TRUTH', text: ind.hookLine || 'Worth a closer look' },
        { label: 'TOGETHER WE COULD', text: (ind.trendingIdeas && ind.trendingIdeas[0]) || 'Find the angle others missed' },
      ],
    };
  });

  fs.writeFileSync(INDUSTRIES_PATH, JSON.stringify(merged, null, 2));
  console.log(`Merged.  Enriched: ${enriched}  Defaulted: ${defaulted}  Total: ${merged.length}`);
}

main();
