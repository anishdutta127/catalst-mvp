/**
 * Personality Framework Mappings
 *
 * Maps user responses to established personality frameworks:
 *   - RIASEC (Holland Codes): Realistic, Investigative, Artistic, Social, Enterprising, Conventional
 *   - DISC: Dominance, Influence, Steadiness, Conscientiousness
 *   - Big Five: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
 *   - McClelland: Achievement, Affiliation, Power
 */

// ── RIASEC ─────────────────────────────────────────────────────────

export type RIASECDimension = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RIASECProfile {
  R: number; // Realistic – hands-on, mechanical
  I: number; // Investigative – analytical, intellectual
  A: number; // Artistic – creative, expressive
  S: number; // Social – helping, teaching
  E: number; // Enterprising – leading, persuading
  C: number; // Conventional – organizing, data
}

export function createRIASECProfile(): RIASECProfile {
  return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
}

// ── DISC ───────────────────────────────────────────────────────────

export interface DISCProfile {
  D: number; // Dominance
  I: number; // Influence
  S: number; // Steadiness
  C: number; // Conscientiousness
}

export function createDISCProfile(): DISCProfile {
  return { D: 0, I: 0, S: 0, C: 0 };
}

// ── Big Five ───────────────────────────────────────────────────────

export interface BigFiveProfile {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export function createBigFiveProfile(): BigFiveProfile {
  return {
    openness: 0,
    conscientiousness: 0,
    extraversion: 0,
    agreeableness: 0,
    neuroticism: 0,
  };
}

// ── McClelland ─────────────────────────────────────────────────────

export interface McClellandProfile {
  achievement: number;
  affiliation: number;
  power: number;
}

export function createMcClellandProfile(): McClellandProfile {
  return { achievement: 0, affiliation: 0, power: 0 };
}

// ── Composite ──────────────────────────────────────────────────────

export interface PersonalityComposite {
  riasec: RIASECProfile;
  disc: DISCProfile;
  bigFive: BigFiveProfile;
  mcClelland: McClellandProfile;
}

export function createCompositeProfile(): PersonalityComposite {
  return {
    riasec: createRIASECProfile(),
    disc: createDISCProfile(),
    bigFive: createBigFiveProfile(),
    mcClelland: createMcClellandProfile(),
  };
}
