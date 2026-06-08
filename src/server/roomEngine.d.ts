/**
 * Server-authoritative room engine for online play.
 *
 * The full RoomState (including the culprit and who-plays-whom) lives ONLY on
 * the server. Clients never receive it directly — they call `viewFor(state, me)`
 * which returns a per-player view that exposes ONLY that player's own character
 * and secret, plus the shared public evidence. The culprit's identity and other
 * players' secrets are never sent until the case is solved/revealed.
 */
import type { Character, Clue, Gender } from '../types';
export type RoomPhase = 'lobby' | 'roles' | 'clues' | 'voting' | 'wrong' | 'solved' | 'final';
export interface RoomPlayer {
    id: string;
    name: string;
    gender: Gender;
    isHost: boolean;
    joinedAt: number;
    lastSeen: number;
    /** Character voted for in the current voting round (cleared each round). */
    vote: string | null;
}
export interface RoomState {
    code: string;
    caseId: string;
    phase: RoomPhase;
    players: RoomPlayer[];
    /** SECRET — never sent to clients before the solution is revealed. */
    criminalId: string | null;
    /** SECRET — playerId -> characterId. Each client only learns its own. */
    assignments: Record<string, string>;
    revealedClues: number;
    wrongAttempts: number;
    lastAccusedId: string | null;
    round: number;
    createdAt: number;
    updatedAt: number;
}
export declare function newRoomCode(): string;
export declare function newPlayerId(): string;
export declare class RoomError extends Error {
    code: string;
    constructor(message: string, code?: string);
}
export declare function createRoom(caseId: string, hostName: string, hostGender: Gender, now: number): {
    state: RoomState;
    playerId: string;
};
export declare function joinRoom(state: RoomState, name: string, gender: Gender, now: number): {
    state: RoomState;
    playerId: string;
};
export declare function updatePlayer(state: RoomState, playerId: string, patch: {
    name?: string;
    gender?: Gender;
}, now: number): RoomState;
export declare function heartbeat(state: RoomState, playerId: string, now: number): RoomState;
export declare function leaveRoom(state: RoomState, playerId: string, now: number): RoomState;
export declare function startGame(state: RoomState, playerId: string, now: number): RoomState;
export declare function beginInvestigation(state: RoomState, playerId: string, now: number): RoomState;
export declare function openVoting(state: RoomState, playerId: string, now: number): RoomState;
export declare function castVote(state: RoomState, playerId: string, characterId: string, now: number): RoomState;
export declare function resolveVoting(state: RoomState, playerId: string, now: number): RoomState;
export declare function continueAfterWrong(state: RoomState, playerId: string, now: number): RoomState;
export declare function revealTruth(state: RoomState, playerId: string, now: number): RoomState;
export declare function playAgain(state: RoomState, playerId: string, now: number): RoomState;
export interface PublicPlayer {
    id: string;
    name: string;
    gender: Gender;
    isHost: boolean;
    connected: boolean;
    hasVoted: boolean;
}
export interface RoomView {
    code: string;
    phase: RoomPhase;
    round: number;
    you: {
        id: string;
        name: string;
        gender: Gender;
        isHost: boolean;
    } | null;
    players: PublicPlayer[];
    case: {
        id: string;
        title: string;
        theme: string;
        difficulty: string;
        description: string;
        victim: string;
    };
    suspects: {
        id: string;
        name: string;
        age: number;
        gender: Gender;
        occupation: string;
    }[];
    myCharacter: (Character & {
        amICulprit: boolean;
    }) | null;
    clues: Clue[];
    revealedClues: number;
    totalClues: number;
    votesIn: number;
    myVote: string | null;
    /** Only present once the case is over. */
    solution: {
        criminalId: string;
        criminalName: string;
        culpritPlayerName: string | null;
        accusedId: string | null;
        explanation: string;
        cast: {
            playerName: string;
            characterId: string;
            characterName: string;
        }[];
    } | null;
}
export declare function viewFor(state: RoomState, playerId: string, now: number): RoomView;
