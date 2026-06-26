/**
 * Server-authoritative room engine for online play.
 *
 * The full RoomState (including the culprit and who-plays-whom) lives ONLY on
 * the server. Clients never receive it directly — they call `viewFor(state, me)`
 * which returns a per-player view that exposes ONLY that player's own character
 * and secret, plus the shared public evidence. The culprit's identity and other
 * players' secrets are never sent until the case is solved/revealed.
 */
import type { Character, Clue, Gender, MysteryCase } from '../types';
import { assignCharacters } from '../game/assignment';
import { cluesFor, explanationFor, getCaseById, pickCulprit, MIN_PLAYERS } from '../data/cases';

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

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const DISCONNECT_MS = 20_000;

function randomString(len: number, alphabet = CODE_ALPHABET): string {
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function newRoomCode(): string {
  return randomString(4);
}
export function newPlayerId(): string {
  return 'p_' + randomString(16, 'abcdefghijklmnopqrstuvwxyz0123456789');
}

function requireCase(caseId: string): MysteryCase {
  const c = getCaseById(caseId);
  if (!c) throw new RoomError('القضية مش موجودة', 'CASE_NOT_FOUND');
  return c;
}
function maxPlayers(c: MysteryCase): number {
  return c.characters.length;
}

export class RoomError extends Error {
  code: string;
  constructor(message: string, code = 'BAD_REQUEST') {
    super(message);
    this.code = code;
  }
}

function host(state: RoomState): RoomPlayer | undefined {
  return state.players.find((p) => p.isHost);
}
function requireHost(state: RoomState, playerId: string) {
  if (host(state)?.id !== playerId) throw new RoomError('ده تصرّف لمنظّم الغرفة بس', 'NOT_HOST');
}
function player(state: RoomState, playerId: string): RoomPlayer {
  const p = state.players.find((x) => x.id === playerId);
  if (!p) throw new RoomError('اللاعب مش في الغرفة', 'NOT_IN_ROOM');
  return p;
}

// ---- Mutations (each returns the updated state; throws RoomError on misuse) ----

export function createRoom(caseId: string, hostName: string, hostGender: Gender, now: number): {
  state: RoomState;
  playerId: string;
} {
  requireCase(caseId);
  const name = hostName.trim();
  if (!name) throw new RoomError('اكتب اسمك الأول');
  const id = newPlayerId();
  const state: RoomState = {
    code: newRoomCode(),
    caseId,
    phase: 'lobby',
    players: [{ id, name, gender: hostGender, isHost: true, joinedAt: now, lastSeen: now, vote: null }],
    criminalId: null,
    assignments: {},
    revealedClues: 0,
    wrongAttempts: 0,
    lastAccusedId: null,
    round: 0,
    createdAt: now,
    updatedAt: now,
  };
  return { state, playerId: id };
}

export function joinRoom(state: RoomState, name: string, gender: Gender, now: number): {
  state: RoomState;
  playerId: string;
} {
  if (state.phase !== 'lobby') throw new RoomError('اللعبة بدأت خلاص، مش هتقدر تدخل دلوقتي', 'ALREADY_STARTED');
  const c = requireCase(state.caseId);
  if (state.players.length >= maxPlayers(c)) throw new RoomError('الغرفة مليانة', 'ROOM_FULL');
  const trimmed = name.trim();
  if (!trimmed) throw new RoomError('اكتب اسمك الأول');
  const id = newPlayerId();
  state.players.push({ id, name: trimmed, gender, isHost: false, joinedAt: now, lastSeen: now, vote: null });
  state.updatedAt = now;
  return { state, playerId: id };
}

export function updatePlayer(
  state: RoomState,
  playerId: string,
  patch: { name?: string; gender?: Gender },
  now: number,
): RoomState {
  const p = player(state, playerId);
  if (state.phase !== 'lobby') throw new RoomError('مش هتقدر تغيّر دلوقتي', 'ALREADY_STARTED');
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (n) p.name = n;
  }
  if (patch.gender) p.gender = patch.gender;
  p.lastSeen = now;
  state.updatedAt = now;
  return state;
}

export function heartbeat(state: RoomState, playerId: string, now: number): RoomState {
  const p = state.players.find((x) => x.id === playerId);
  if (p) p.lastSeen = now;
  return state;
}

export function leaveRoom(state: RoomState, playerId: string, now: number): RoomState {
  const idx = state.players.findIndex((x) => x.id === playerId);
  if (idx === -1) return state;
  const wasHost = state.players[idx].isHost;
  // In the lobby, players can drop out entirely; mid-game we keep their slot
  // (their character is in play) but they'll show as disconnected.
  if (state.phase === 'lobby') {
    state.players.splice(idx, 1);
  } else {
    state.players[idx].lastSeen = 0;
  }
  if (wasHost && state.players.length) {
    const next = state.players.find((p) => p.id !== playerId) ?? state.players[0];
    state.players.forEach((p) => (p.isHost = p.id === next.id));
  }
  state.updatedAt = now;
  return state;
}

export function startGame(state: RoomState, playerId: string, now: number): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'lobby') throw new RoomError('اللعبة بدأت خلاص', 'ALREADY_STARTED');
  if (state.players.length < MIN_PLAYERS) {
    throw new RoomError(`محتاجين ${MIN_PLAYERS} لاعبين على الأقل`, 'NOT_ENOUGH_PLAYERS');
  }
  dealRoles(state, now);
  return state;
}

function dealRoles(state: RoomState, now: number) {
  const c = requireCase(state.caseId);
  const genders = new Set<Gender>(state.players.map((p) => p.gender));
  const criminalId = pickCulprit(c, genders);
  const assignments = assignCharacters(
    c,
    state.players.map((p) => ({ name: p.id, gender: p.gender })), // use id as key
    criminalId,
  );
  state.assignments = {};
  for (const a of assignments) state.assignments[a.player] = a.character.id;
  state.criminalId = criminalId;
  state.phase = 'roles';
  state.revealedClues = 0;
  state.wrongAttempts = 0;
  state.lastAccusedId = null;
  state.players.forEach((p) => (p.vote = null));
  state.updatedAt = now;
}

export function beginInvestigation(state: RoomState, playerId: string, now: number): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'roles') throw new RoomError('مش وقتها', 'BAD_PHASE');
  state.phase = 'clues';
  state.revealedClues = 1;
  state.updatedAt = now;
  return state;
}

/** Host pulls the next clue during discussion — no need to vote first. */
export function revealNextClue(state: RoomState, playerId: string, now: number): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'clues') throw new RoomError('مش وقتها', 'BAD_PHASE');
  const c = requireCase(state.caseId);
  const total = cluesFor(c, state.criminalId ?? c.criminalId).length;
  if (state.revealedClues < total) {
    state.revealedClues += 1;
    state.updatedAt = now;
  }
  return state;
}

export function openVoting(state: RoomState, playerId: string, now: number): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'clues' && state.phase !== 'wrong') throw new RoomError('مش وقتها', 'BAD_PHASE');
  state.players.forEach((p) => (p.vote = null));
  state.phase = 'voting';
  state.updatedAt = now;
  return state;
}

export function castVote(state: RoomState, playerId: string, characterId: string, now: number): RoomState {
  if (state.phase !== 'voting') throw new RoomError('مفيش تصويت دلوقتي', 'BAD_PHASE');
  const p = player(state, playerId);
  // The target must be a character actually dealt to a player…
  const assignedCharIds = new Set(Object.values(state.assignments));
  if (!assignedCharIds.has(characterId)) throw new RoomError('المشتبه ده مش من اللاعبين', 'BAD_TARGET');
  // …and you can't accuse yourself.
  if (state.assignments[playerId] === characterId) throw new RoomError('مش هتقدر تصوّت على نفسك', 'SELF_VOTE');
  p.vote = characterId;
  p.lastSeen = now;
  state.updatedAt = now;
  return state;
}

/** Tally votes to a single accusation (plurality; ties broken at random). */
function tally(state: RoomState): string | null {
  const counts = new Map<string, number>();
  for (const p of state.players) if (p.vote) counts.set(p.vote, (counts.get(p.vote) ?? 0) + 1);
  if (!counts.size) return null;
  const max = Math.max(...counts.values());
  const top = [...counts.entries()].filter(([, n]) => n === max).map(([id]) => id);
  return top[Math.floor(Math.random() * top.length)];
}

export function resolveVoting(state: RoomState, playerId: string, now: number): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'voting') throw new RoomError('مفيش تصويت يتقفل', 'BAD_PHASE');
  const accused = tally(state);
  if (!accused) throw new RoomError('محدش صوّت لسه', 'NO_VOTES');
  state.lastAccusedId = accused;
  if (accused === state.criminalId) {
    state.phase = 'solved';
  } else {
    state.wrongAttempts += 1;
    state.phase = 'wrong';
  }
  state.updatedAt = now;
  return state;
}

export function continueAfterWrong(state: RoomState, playerId: string, now: number): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'wrong') throw new RoomError('مش وقتها', 'BAD_PHASE');
  const c = requireCase(state.caseId);
  const total = cluesFor(c, state.criminalId ?? c.criminalId).length;
  if (state.revealedClues < total) {
    state.revealedClues += 1;
    state.phase = 'clues';
  } else {
    state.phase = 'final';
  }
  state.players.forEach((p) => (p.vote = null));
  state.updatedAt = now;
  return state;
}

export function revealTruth(state: RoomState, playerId: string, now: number): RoomState {
  requireHost(state, playerId);
  state.phase = 'final';
  state.updatedAt = now;
  return state;
}

export function playAgain(state: RoomState, playerId: string, now: number): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'solved' && state.phase !== 'final') throw new RoomError('مش وقتها', 'BAD_PHASE');
  state.round += 1;
  dealRoles(state, now);
  return state;
}

// ---------------------------- Per-player view ----------------------------

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
  you: { id: string; name: string; gender: Gender; isHost: boolean } | null;
  players: PublicPlayer[];
  case: { id: string; title: string; theme: string; difficulty: string; description: string; victim: string };
  suspects: { id: string; name: string; age: number; gender: Gender; occupation: string }[];
  myCharacter: (Character & { amICulprit: boolean }) | null;
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
    cast: { playerName: string; characterId: string; characterName: string }[];
  } | null;
}

export function viewFor(state: RoomState, playerId: string, now: number): RoomView {
  const c = requireCase(state.caseId);
  const me = state.players.find((p) => p.id === playerId) ?? null;
  const over = state.phase === 'solved' || state.phase === 'final';

  const charById = new Map(c.characters.map((ch) => [ch.id, ch] as const));
  const myCharId = me ? state.assignments[me.id] : undefined;
  const myChar = myCharId ? charById.get(myCharId) ?? null : null;
  // Only characters actually dealt to players are real suspects.
  const assignedCharIds = new Set(Object.values(state.assignments));

  const totalClues = state.criminalId ? cluesFor(c, state.criminalId).length : c.clues.length;
  const revealed = state.criminalId
    ? cluesFor(c, state.criminalId).slice(0, state.revealedClues)
    : [];

  let solution: RoomView['solution'] = null;
  if (over && state.criminalId) {
    const criminal = charById.get(state.criminalId)!;
    const culpritPlayer = state.players.find((p) => state.assignments[p.id] === state.criminalId) ?? null;
    solution = {
      criminalId: state.criminalId,
      criminalName: criminal.name,
      culpritPlayerName: culpritPlayer?.name ?? null,
      accusedId: state.lastAccusedId,
      explanation: explanationFor(c, state.criminalId),
      cast: state.players.map((p) => {
        const ch = charById.get(state.assignments[p.id]);
        return { playerName: p.name, characterId: ch?.id ?? '', characterName: ch?.name ?? '—' };
      }),
    };
  }

  return {
    code: state.code,
    phase: state.phase,
    round: state.round,
    you: me ? { id: me.id, name: me.name, gender: me.gender, isHost: me.isHost } : null,
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      isHost: p.isHost,
      connected: now - p.lastSeen < DISCONNECT_MS,
      hasVoted: p.vote != null,
    })),
    case: {
      id: c.id,
      title: c.title,
      theme: c.theme,
      difficulty: c.difficulty,
      description: c.description,
      victim: c.victim,
    },
    // Suspect roster for the voting screen — public info only, no secrets.
    // Only players who are actually in the game, and never yourself.
    suspects: c.characters
      .filter((ch) => assignedCharIds.has(ch.id) && ch.id !== myCharId)
      .map((ch) => ({
        id: ch.id,
        name: ch.name,
        age: ch.age,
        gender: ch.gender,
        occupation: ch.occupation,
      })),
    myCharacter: myChar ? { ...myChar, amICulprit: myChar.id === state.criminalId } : null,
    clues: revealed,
    revealedClues: state.revealedClues,
    totalClues,
    votesIn: state.players.filter((p) => p.vote != null).length,
    myVote: me?.vote ?? null,
    solution,
  };
}
