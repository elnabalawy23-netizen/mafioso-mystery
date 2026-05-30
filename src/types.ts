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
  isCriminal: boolean;
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
  clues: Clue[];
  criminalId: string;
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
