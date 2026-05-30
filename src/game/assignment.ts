import type { Assignment, Character, MysteryCase } from '../types';

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Assigns one character to each player.
 * - When players < available characters: a random subset is chosen,
 *   but the criminal is ALWAYS included so the mystery stays solvable.
 * - When players == available characters: all characters are used.
 *
 * The culprit is decided by the caller (chosen randomly each playthrough)
 * and passed in, so the same case can have a different criminal every round.
 */
export function assignCharacters(
  mystery: MysteryCase,
  players: string[],
  culpritId: string,
): Assignment[] {
  const count = players.length;
  const criminal = mystery.characters.find((c) => c.id === culpritId);
  const innocents = mystery.characters.filter((c) => c.id !== culpritId);

  let chosen: Character[];
  if (criminal) {
    const neededInnocents = Math.max(0, count - 1);
    const pickedInnocents = shuffle(innocents).slice(0, neededInnocents);
    chosen = shuffle([criminal, ...pickedInnocents]);
  } else {
    chosen = shuffle(mystery.characters).slice(0, count);
  }

  const shuffledPlayers = shuffle(players);
  return shuffledPlayers.map((player, i) => ({
    player,
    character: chosen[i],
  }));
}
