import { Participant } from '../db/schema';
import { Skill } from '../events/constants';

// Explicitly defined complementary skill pairing matrix
export const COMPLEMENTARY_PAIRS: Array<[Skill, Skill]> = [
  ['Programación', 'Diseño UX/UI'],
  ['Programación', 'Marketing'],
  ['Electrónica', 'Programación'],
  ['Robótica', 'Diseño 3D'],
  ['Inteligencia Artificial', 'Análisis de Datos'],
  ['Programación', 'Negocios'],
  ['Inteligencia Artificial', 'Negocios'],
  ['Robótica', 'Electrónica'],
  ['Diseño UX/UI', 'Marketing'],
  ['Liderazgo', 'Programación'],
  ['Liderazgo', 'Electrónica'],
  ['Comunicación', 'Marketing'],
  ['Diseño 3D', 'Electrónica'],
  ['Análisis de Datos', 'Marketing'],
];

export interface MatchResult {
  score: number;
  reason: string;
  sourceId: string;
  targetId: string;
}

export function areSkillsComplementary(skillA: string, skillB: string): boolean {
  for (const [a, b] of COMPLEMENTARY_PAIRS) {
    if (
      (a === skillA && b === skillB) ||
      (a === skillB && b === skillA)
    ) {
      return true;
    }
  }
  return false;
}

export function calculateMatch(a: Participant, b: Participant): MatchResult | null {
  if (a.id === b.id) return null;

  let score = 0;
  const reasons: string[] = [];

  // 1. Shared interests (+4 points each)
  const interestsA = new Set(a.interests as string[]);
  const interestsB = new Set(b.interests as string[]);
  const sharedInterests = [...interestsA].filter((i) => interestsB.has(i));

  if (sharedInterests.length > 0) {
    score += sharedInterests.length * 4;
    if (sharedInterests.length === 1) {
      reasons.push(`Ambos comparten interés en ${sharedInterests[0]}`);
    } else {
      reasons.push(`Interés mutuo en ${sharedInterests.slice(0, 2).join(' y ')}`);
    }
  }

  // 2. Complementary skills (+3 points each pairing)
  const skillsA = (a.skills as string[]) || [];
  const skillsB = (b.skills as string[]) || [];
  const foundComplementary: string[] = [];

  for (const sA of skillsA) {
    for (const sB of skillsB) {
      if (areSkillsComplementary(sA, sB)) {
        score += 3;
        foundComplementary.push(`${sA} + ${sB}`);
      }
    }
  }

  if (foundComplementary.length > 0) {
    reasons.push(`${foundComplementary[0]}: habilidades complementarias`);
  }

  // 3. Shared discipline (+1 point)
  if (a.discipline === b.discipline) {
    score += 1;
    reasons.push(`Misma disciplina en ${a.discipline}`);
  }

  // Threshold: must have at least 4 points (at least one shared interest or strong complementary pairing)
  if (score < 4) {
    return null;
  }

  // Canonical ordering (UUID lexicographical comparison)
  const [sourceId, targetId] = a.id < b.id ? [a.id, b.id] : [b.id, a.id];

  return {
    score,
    reason: reasons.slice(0, 2).join(' · '),
    sourceId,
    targetId,
  };
}

/**
 * Finds up to maxMatches strongest connections for a new participant against a pool of existing participants.
 */
export function findTopMatches(
  newParticipant: Participant,
  existingParticipants: Participant[],
  maxMatches = 3
): MatchResult[] {
  const matches: MatchResult[] = [];

  for (const existing of existingParticipants) {
    const match = calculateMatch(newParticipant, existing);
    if (match) {
      matches.push(match);
    }
  }

  // Sort descending by score, tiebreaker by targetId for deterministic ordering
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.targetId.localeCompare(b.targetId);
  });

  return matches.slice(0, maxMatches);
}
