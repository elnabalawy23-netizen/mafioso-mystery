import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Assignment, Clue, MysteryCase, Phase, Player } from '../types';
import { assignCharacters } from './assignment';
import { cluesFor, explanationFor, pickCulprit } from '../data/cases';

interface GameState {
  phase: Phase;
  selectedCase: MysteryCase | null;
  players: Player[];
  assignments: Assignment[];
  /** The culprit chosen for THIS playthrough (random each round). */
  criminalId: string;
  revealIndex: number;
  revealedClues: number;
  lastAccusedId: string | null;
  wrongAttempts: number;
}

interface GameContextValue extends GameState {
  /** Active clues for the current culprit. */
  clues: Clue[];
  /** Active final explanation for the current culprit. */
  finalExplanation: string;
  go: (phase: Phase) => void;
  chooseCase: (mystery: MysteryCase) => void;
  setPlayers: (players: Player[]) => void;
  startGame: () => void;
  nextReveal: () => void;
  startReveal: () => void;
  revealNextClue: () => void;
  goVote: () => void;
  accuse: (characterId: string) => boolean;
  continueAfterWrong: () => void;
  revealTruth: () => void;
  playAgainSameCase: () => void;
  resetAll: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

const INITIAL: GameState = {
  phase: 'splash',
  selectedCase: null,
  players: [],
  assignments: [],
  criminalId: '',
  revealIndex: 0,
  revealedClues: 0,
  lastAccusedId: null,
  wrongAttempts: 0,
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(INITIAL);

  const go = useCallback((phase: Phase) => {
    setState((s) => ({ ...s, phase }));
  }, []);

  const chooseCase = useCallback((mystery: MysteryCase) => {
    setState((s) => ({ ...s, selectedCase: mystery, players: [], phase: 'addPlayers' }));
  }, []);

  const setPlayers = useCallback((players: Player[]) => {
    setState((s) => ({ ...s, players }));
  }, []);

  const startGame = useCallback(() => {
    setState((s) => {
      if (!s.selectedCase) return s;
      const genders = new Set(s.players.map((p) => p.gender));
      const criminalId = pickCulprit(s.selectedCase, genders);
      const assignments = assignCharacters(s.selectedCase, s.players, criminalId);
      return {
        ...s,
        assignments,
        criminalId,
        revealIndex: 0,
        revealedClues: 0,
        lastAccusedId: null,
        wrongAttempts: 0,
        phase: 'crime',
      };
    });
  }, []);

  const nextReveal = useCallback(() => {
    setState((s) => {
      const next = s.revealIndex + 1;
      if (next >= s.assignments.length) {
        return { ...s, revealIndex: next, phase: 'discussion' };
      }
      return { ...s, revealIndex: next };
    });
  }, []);

  // Show the crime story first; this then hands out characters one player at a time.
  const startReveal = useCallback(() => {
    setState((s) => ({ ...s, phase: 'reveal', revealIndex: 0 }));
  }, []);

  const revealNextClue = useCallback(() => {
    setState((s) => {
      if (!s.selectedCase) return s;
      const total = cluesFor(s.selectedCase, s.criminalId).length;
      if (s.revealedClues >= total) return s;
      return { ...s, revealedClues: s.revealedClues + 1, phase: 'clue' };
    });
  }, []);

  const goVote = useCallback(() => {
    setState((s) => ({ ...s, phase: 'voting' }));
  }, []);

  const accuse = useCallback((characterId: string): boolean => {
    let correct = false;
    setState((s) => {
      if (!s.selectedCase) return s;
      correct = characterId === s.criminalId;
      return {
        ...s,
        lastAccusedId: characterId,
        wrongAttempts: correct ? s.wrongAttempts : s.wrongAttempts + 1,
        phase: correct ? 'correct' : 'wrong',
      };
    });
    return correct;
  }, []);

  const continueAfterWrong = useCallback(() => {
    setState((s) => {
      if (!s.selectedCase) return s;
      const total = cluesFor(s.selectedCase, s.criminalId).length;
      const hasMore = s.revealedClues < total;
      if (hasMore) {
        return { ...s, revealedClues: s.revealedClues + 1, phase: 'clue' };
      }
      return { ...s, phase: 'voting' };
    });
  }, []);

  const revealTruth = useCallback(() => {
    setState((s) => ({ ...s, phase: 'final' }));
  }, []);

  const playAgainSameCase = useCallback(() => {
    setState((s) => {
      if (!s.selectedCase) return s;
      const genders = new Set(s.players.map((p) => p.gender));
      const criminalId = pickCulprit(s.selectedCase, genders);
      const assignments = assignCharacters(s.selectedCase, s.players, criminalId);
      return {
        ...s,
        assignments,
        criminalId,
        revealIndex: 0,
        revealedClues: 0,
        lastAccusedId: null,
        wrongAttempts: 0,
        phase: 'crime',
      };
    });
  }, []);

  const resetAll = useCallback(() => {
    setState({ ...INITIAL, phase: 'home' });
  }, []);

  const clues = useMemo<Clue[]>(
    () => (state.selectedCase ? cluesFor(state.selectedCase, state.criminalId) : []),
    [state.selectedCase, state.criminalId],
  );
  const finalExplanation = useMemo<string>(
    () => (state.selectedCase ? explanationFor(state.selectedCase, state.criminalId) : ''),
    [state.selectedCase, state.criminalId],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      ...state,
      clues,
      finalExplanation,
      go,
      chooseCase,
      setPlayers,
      startGame,
      nextReveal,
      startReveal,
      revealNextClue,
      goVote,
      accuse,
      continueAfterWrong,
      revealTruth,
      playAgainSameCase,
      resetAll,
    }),
    [
      state,
      clues,
      finalExplanation,
      go,
      chooseCase,
      setPlayers,
      startGame,
      nextReveal,
      startReveal,
      revealNextClue,
      goVote,
      accuse,
      continueAfterWrong,
      revealTruth,
      playAgainSameCase,
      resetAll,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
