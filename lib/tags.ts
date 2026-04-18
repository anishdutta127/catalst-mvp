/**
 * Catalst v8 — Tag vocabulary.
 *
 * Tags sit one level below the 8 high-level categories (tech / creative /
 * health / finance / social / build / play / other). Each idea gets 2-4
 * tags. Each industry derives its sub-tags from the ideas in it.
 *
 * The S04 chip row uses this: tap a category → the same 9-chip row
 * transforms into "◂ Build · Robotics · Hardware · Space · …". Tap the
 * back chip to return to categories.
 */

export type Category = 'tech' | 'creative' | 'health' | 'finance' | 'social' | 'build' | 'play' | 'other';

export const CATEGORIES: Category[] = [
  'tech', 'creative', 'health', 'finance', 'social', 'build', 'play', 'other',
];

export interface TagDef {
  id: string;         // slug — kebab-case, stable
  label: string;      // display label for chips
  category: Category;
}

export const TAGS: TagDef[] = [
  // ── tech ──
  { id: 'ai-agents',      label: 'AI Agents',      category: 'tech' },
  { id: 'ai-voice',       label: 'Voice AI',       category: 'tech' },
  { id: 'ai-video',       label: 'AI Video',       category: 'tech' },
  { id: 'ai-coding',      label: 'AI Coding',      category: 'tech' },
  { id: 'ai-content',     label: 'AI Content',     category: 'tech' },
  { id: 'dev-tools',      label: 'Dev Tools',      category: 'tech' },
  { id: 'cybersec',       label: 'Cyber',          category: 'tech' },
  { id: 'legal-tech',     label: 'Legal Tech',     category: 'tech' },
  { id: 'productivity',   label: 'Productivity',   category: 'tech' },
  { id: 'hr-tech',        label: 'HR Tech',        category: 'tech' },
  { id: 'saas',           label: 'SaaS',           category: 'tech' },

  // ── creative ──
  { id: 'd2c',            label: 'D2C',            category: 'creative' },
  { id: 'content',        label: 'Content',        category: 'creative' },
  { id: 'video',          label: 'Video',          category: 'creative' },
  { id: 'commerce',       label: 'Commerce',       category: 'creative' },
  { id: 'design',         label: 'Design',         category: 'creative' },
  { id: 'fashion',        label: 'Fashion',        category: 'creative' },
  { id: 'beauty',         label: 'Beauty',         category: 'creative' },
  { id: 'food-bev',       label: 'Food & Bev',     category: 'creative' },

  // ── health ──
  { id: 'telemedicine',   label: 'Telemedicine',   category: 'health' },
  { id: 'mental-health',  label: 'Mental Health',  category: 'health' },
  { id: 'femtech',        label: 'Femtech',        category: 'health' },
  { id: 'longevity',      label: 'Longevity',      category: 'health' },
  { id: 'diagnostics',    label: 'Diagnostics',    category: 'health' },
  { id: 'wearables',      label: 'Wearables',      category: 'health' },
  { id: 'pharmacy',       label: 'Pharmacy',       category: 'health' },
  { id: 'elder-care',     label: 'Elder Care',     category: 'health' },
  { id: 'nutrition',      label: 'Nutrition',      category: 'health' },
  { id: 'chronic-care',   label: 'Chronic Care',   category: 'health' },
  { id: 'biotech',        label: 'Biotech',        category: 'health' },
  { id: 'fitness',        label: 'Fitness',        category: 'health' },
  { id: 'sleep',          label: 'Sleep',          category: 'health' },

  // ── finance ──
  { id: 'payments',       label: 'Payments',       category: 'finance' },
  { id: 'lending',        label: 'Lending',        category: 'finance' },
  { id: 'insurance',      label: 'Insurance',      category: 'finance' },
  { id: 'neobank',        label: 'Neobank',        category: 'finance' },
  { id: 'wealth',         label: 'Wealth',         category: 'finance' },
  { id: 'crypto',         label: 'Crypto',         category: 'finance' },
  { id: 'sme-finance',    label: 'SME Finance',    category: 'finance' },
  { id: 'embedded',       label: 'Embedded',       category: 'finance' },
  { id: 'prediction',     label: 'Prediction',     category: 'finance' },

  // ── social ──
  { id: 'edu-k12',        label: 'K-12 Edu',       category: 'social' },
  { id: 'edu-skilling',   label: 'Skilling',       category: 'social' },
  { id: 'edu-tutor',      label: 'AI Tutor',       category: 'social' },
  { id: 'edu-parenting',  label: 'Parenting Edu',  category: 'social' },
  { id: 'edu-language',   label: 'Language',       category: 'social' },
  { id: 'community',      label: 'Community',      category: 'social' },
  { id: 'dating',         label: 'Dating',         category: 'social' },
  { id: 'pets',           label: 'Pets',           category: 'social' },
  { id: 'spiritual',      label: 'Spiritual',      category: 'social' },
  { id: 'civic',          label: 'Civic',          category: 'social' },

  // ── build ──
  { id: 'robotics',       label: 'Robotics',       category: 'build' },
  { id: 'hardware',       label: 'Hardware',       category: 'build' },
  { id: 'space',          label: 'Space',          category: 'build' },
  { id: 'agritech',       label: 'Agritech',       category: 'build' },
  { id: 'logistics',      label: 'Logistics',      category: 'build' },
  { id: 'manufacturing',  label: 'Manufacturing',  category: 'build' },
  { id: 'drones',         label: 'Drones',         category: 'build' },
  { id: 'ev-mobility',    label: 'EV & Mobility',  category: 'build' },
  { id: 'quick-commerce', label: 'Q-Commerce',     category: 'build' },
  { id: 'sustainability', label: 'Sustainability', category: 'build' },
  { id: 'energy',         label: 'Energy',         category: 'build' },
  { id: 'construction',   label: 'Construction',   category: 'build' },

  // ── play ──
  { id: 'gaming',         label: 'Gaming',         category: 'play' },
  { id: 'esports',        label: 'Esports',        category: 'play' },
  { id: 'sports',         label: 'Sports',         category: 'play' },
  { id: 'travel',         label: 'Travel',         category: 'play' },
  { id: 'entertainment',  label: 'Entertainment',  category: 'play' },
  { id: 'fantasy',        label: 'Fantasy',        category: 'play' },

  // ── other ──
  { id: 'real-estate',    label: 'Real Estate',    category: 'other' },
  { id: 'home-services',  label: 'Home Services',  category: 'other' },
  { id: 'events',         label: 'Events',         category: 'other' },
];

export const TAG_BY_ID: Record<string, TagDef> = TAGS.reduce(
  (acc, t) => { acc[t.id] = t; return acc; },
  {} as Record<string, TagDef>,
);

export const TAGS_BY_CATEGORY: Record<Category, TagDef[]> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c] = TAGS.filter((t) => t.category === c);
    return acc;
  },
  {} as Record<Category, TagDef[]>,
);

/** Validate that a tag id exists in the vocabulary. */
export function isValidTag(id: string): boolean {
  return id in TAG_BY_ID;
}

/** Given an idea's tags, derive its category (first valid tag's category). */
export function categoryForTags(tags: string[]): Category | null {
  for (const t of tags) {
    const def = TAG_BY_ID[t];
    if (def) return def.category;
  }
  return null;
}
