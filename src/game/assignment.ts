import type { Assignment, Character, Gender, MysteryCase, Player } from '../types';

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Assigns one character to each player, matching the player's chosen gender to
 * a same-gender character whenever possible.
 *
 * - The culprit (decided by the caller) is placed at the front of its gender
 *   pool, so a random same-gender player receives it and the mystery stays
 *   solvable. The caller picks the culprit from a gender that has a player.
 * - If a gender runs short of characters (a mix the setup screen didn't allow),
 *   we fall back to any unused character so the game never breaks.
 */
export function assignCharacters(
  mystery: MysteryCase,
  players: Player[],
  culpritId: string,
): Assignment[] {
  const culprit = mystery.characters.find((c) => c.id === culpritId);

  const pools: Record<Gender, Character[]> = {
    male: shuffle(mystery.characters.filter((c) => c.gender === 'male' && c.id !== culpritId)),
    female: shuffle(mystery.characters.filter((c) => c.gender === 'female' && c.id !== culpritId)),
  };
  // Front-load the culprit into its gender pool so a same-gender player gets it.
  if (culprit) pools[culprit.gender].unshift(culprit);

  const used = new Set<string>();
  const take = (gender: Gender): Character => {
    // Same-gender pool first, skipping any character already handed out
    // (a character can be borrowed cross-gender below before its pool is reached).
    const pool = pools[gender];
    while (pool.length) {
      const ch = pool.shift()!;
      if (!used.has(ch.id)) return ch;
    }
    // Not enough same-gender characters: borrow any unused one.
    const fallback = mystery.characters.find((c) => !used.has(c.id));
    return fallback ?? mystery.characters[0];
  };

  const assignments = shuffle(players).map((player) => {
    const character = take(player.gender);
    used.add(character.id);
    return { player: player.name, character };
  });

  // Safety net: guarantee the culprit ended up assigned to someone.
  if (culprit && !used.has(culprit.id) && assignments.length) {
    const slot =
      assignments.find((a) => a.character.gender === culprit.gender) ?? assignments[0];
    slot.character = culprit;
  }

  return assignments;
}
