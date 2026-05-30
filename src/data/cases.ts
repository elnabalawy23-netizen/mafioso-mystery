import type { MysteryCase } from '../types';
import casesJson from './cases.json';

export const CASES: MysteryCase[] = casesJson as MysteryCase[];

export function getCaseById(id: string): MysteryCase | undefined {
  return CASES.find((c) => c.id === id);
}

export const MIN_PLAYERS = 4;

export function maxPlayersFor(c: MysteryCase): number {
  return c.characters.length;
}
