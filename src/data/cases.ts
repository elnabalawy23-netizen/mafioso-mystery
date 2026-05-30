import type { Clue, MysteryCase } from '../types';
import casesJson from './cases.json';

export const CASES: MysteryCase[] = casesJson as MysteryCase[];

export function getCaseById(id: string): MysteryCase | undefined {
  return CASES.find((c) => c.id === id);
}

export const MIN_PLAYERS = 4;

export function maxPlayersFor(c: MysteryCase): number {
  return c.characters.length;
}

/**
 * Every character that can be the culprit for this case: the canonical
 * criminal plus anyone carrying a guilt dossier. Used to pick a random
 * culprit each playthrough so the solution is never the same twice.
 */
export function culpritCandidateIds(c: MysteryCase): string[] {
  const ids = new Set<string>();
  if (c.criminalId) ids.add(c.criminalId);
  for (const ch of c.characters) {
    if (ch.guilt) ids.add(ch.id);
  }
  return [...ids];
}

/** Number of distinct ways this case can play out (different culprits). */
export function variantCount(c: MysteryCase): number {
  return Math.max(1, culpritCandidateIds(c).length);
}

/** Picks a random culprit for a fresh playthrough. */
export function pickCulprit(c: MysteryCase): string {
  const ids = culpritCandidateIds(c);
  if (ids.length === 0) return c.criminalId;
  return ids[Math.floor(Math.random() * ids.length)];
}

/** The clues to reveal for a given culprit (their dossier, or the canonical set). */
export function cluesFor(c: MysteryCase, culpritId: string): Clue[] {
  const ch = c.characters.find((x) => x.id === culpritId);
  if (ch?.guilt?.clues?.length) return ch.guilt.clues;
  return c.clues;
}

/** The final explanation for a given culprit (their dossier, or the canonical text). */
export function explanationFor(c: MysteryCase, culpritId: string): string {
  const ch = c.characters.find((x) => x.id === culpritId);
  if (ch?.guilt?.explanation) return ch.guilt.explanation;
  return c.finalExplanation;
}
