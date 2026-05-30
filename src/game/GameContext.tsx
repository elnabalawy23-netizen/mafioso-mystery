import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Assignment, MysteryCase, Phase } from '../types';
import { assignCharacters } from './assignment';

interface GameState {
  phase: Phase;
  selectedCase: MysteryCase | null;
  players: string[];
  assignments: Assignment[];
  revealIndex: number;
  revealedClues: number;
  lastAccusedId: string | null;
  wrongAttempts: number;
}

interface GameContextValue extends GameState {
  go: (phase: Phase) => void;
  chooseCase: (mystery: MysteryCase) => void;
  setPlayers: (players: string[]) => void;
  startGame: () => void;
  nextReveal: () => void;
  beginInvestigation: () => void;
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

  const setPlayers = useCallback((players: string[]) => {
    setState((s) => ({ ...s, players }));
  }, []);

  const startGame = useCallback(() => {
    setState((s) => {
      if (!s.selectedCase) return s;
      const assignments = assignCharacters(s.selectedCase, s.players);
      return {
        ...s,
        assignments,
        revealIndex: 0,
        revealedClues: 0,
        lastAccusedId: null,
        wrongAttempts: 0,
        phase: 'reveal',
      };
    });
  }, []);

  const nextReveal = useCallback(() => {
    setState((s) => {
      const next = s.revealIndex + 1;
      if (next >= s.assignments.length) {
        return { ...s, revealIndex: next, phase: 'crime' };
      }
      return { ...s, revealIndex: next };
    });
  }, []);

  const beginInvestigation = useCallback(() => {
    setState((s) => ({ ...s, phase: 'discussion' }));
  }, []);

  const revealNextClue = useCallback(() => {
    setState((s) => {
      if (!s.selectedCase) return s;
      if (s.revealedClues >= s.selectedCase.clues.length) return s;
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
      correct = characterId === s.selectedCase.criminalId;
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
      const hasMore = s.revealedClues < s.selectedCase.clues.length;
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
      const assignments = assignCharacters(s.selectedCase, s.players);
      return {
        ...s,
        assignments,
        revealIndex: 0,
        revealedClues: 0,
        lastAccusedId: null,
        wrongAttempts: 0,
        phase: 'reveal',
      };
    });
  }, []);

  const resetAll = useCallback(() => {
    setState({ ...INITIAL, phase: 'home' });
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      ...state,
      go,
      chooseCase,
      setPlayers,
      startGame,
      nextReveal,
      beginInvestigation,
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
      go,
      chooseCase,
      setPlayers,
      startGame,
      nextReveal,
      beginInvestigation,
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
