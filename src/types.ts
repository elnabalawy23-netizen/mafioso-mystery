/**
 * A "guilt dossier" turns a character into a possible culprit for the case.
 * When this character is randomly chosen as the criminal for a playthrough,
 * the game reveals THESE clues and THIS final explanation instead of the
 * case's canonical ones. This is what makes every case replayable: the
 * culprit (and therefore the evidence and the solution) changes each round.
 */
export interface GuiltDossier {
  clues: Clue[];
  explanation: string;
}

export interface Character {
  id: string;
  name: string;
  age: number;
  occupation: string;
  personality: string;
  relationship: string;
  story: string;
  statement: string;
  secret: string;
  /** Marks the canonical culprit; kept for the original authored case. */
  isCriminal: boolean;
  /** Present on additional suspects that can also be the culprit. */
  guilt?: GuiltDossier;
}

export interface Clue {
  id: string;
  title: string;
  text: string;
}

export interface MysteryCase {
  id: string;
  title: string;
  theme: string;
  description: string;
  victim: string;
  characters: Character[];
  /** Clues for the canonical culprit (the character whose id === criminalId). */
  clues: Clue[];
  /** The canonical culprit; used as a fallback when no guilt dossier applies. */
  criminalId: string;
  /** Final explanation for the canonical culprit. */
  finalExplanation: string;
}

export interface Assignment {
  player: string;
  character: Character;
}

export type Phase =
  | 'splash'
  | 'home'
  | 'selectCase'
  | 'addPlayers'
  | 'reveal'
  | 'crime'
  | 'discussion'
  | 'clue'
  | 'voting'
  | 'wrong'
  | 'correct'
  | 'final'
  | 'again';
