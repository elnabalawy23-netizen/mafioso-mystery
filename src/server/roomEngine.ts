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
  /** playerIds voted out so far (Mafia-style elimination). */
  eliminated: string[];
  /** True once only the culprit is left standing — the group lost. */
  escaped: boolean;
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

// ---- Elimination helpers (Mafia-style voting) ----
/** Players still in the game (not voted out). */
function livePlayers(state: RoomState): RoomPlayer[] {
  return state.players.filter((p) => !state.eliminated.includes(p.id));
}
/** Characters of players still in the game — the valid vote targets. */
function liveChars(state: RoomState): Set<string> {
  return new Set(livePlayers(state).map((p) => state.assignments[p.id]));
}
/** Players who still get to vote this round (in the game + connected). */
function activeVoters(state: RoomState, now: number): RoomPlayer[] {
  return livePlayers(state).filter((p) => now - p.lastSeen < DISCONNECT_MS);
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
    eliminated: [],
    escaped: false,
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
  state.eliminated = [];
  state.escaped = false;
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
  if (state.eliminated.includes(playerId)) throw new RoomError('إنت طلعت من اللعبة، بتتفرّج بس', 'ELIMINATED');
  // The target must be a player who is still in the game…
  if (!liveChars(state).has(characterId)) throw new RoomError('المشتبه ده مش من اللاعبين', 'BAD_TARGET');
  // …and you can't accuse yourself.
  if (state.assignments[playerId] === characterId) throw new RoomError('مش هتقدر تصوّت على نفسك', 'SELF_VOTE');
  p.vote = characterId;
  p.lastSeen = now;
  state.updatedAt = now;
  return state;
}

/** Tally votes (still-in players only) to a single accusation; ties broken at random. */
function tally(state: RoomState): string | null {
  const counts = new Map<string, number>();
  for (const p of state.players) {
    if (p.vote && !state.eliminated.includes(p.id)) counts.set(p.vote, (counts.get(p.vote) ?? 0) + 1);
  }
  if (!counts.size) return null;
  const max = Math.max(...counts.values());
  const top = [...counts.entries()].filter(([, n]) => n === max).map(([id]) => id);
  return top[Math.floor(Math.random() * top.length)];
}

export function resolveVoting(state: RoomState, playerId: string, now: number): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'voting') throw new RoomError('مفيش تصويت يتقفل', 'BAD_PHASE');
  // Everyone still in the game (and connected) has to vote first.
  if (activeVoters(state, now).some((p) => p.vote == null)) {
    throw new RoomError('لسه في حد ماصوّتش', 'NOT_ALL_VOTED');
  }
  const accused = tally(state);
  if (!accused) throw new RoomError('محدش صوّت لسه', 'NO_VOTES');
  state.lastAccusedId = accused;
  if (accused === state.criminalId) {
    state.phase = 'solved'; // caught the killer — the group wins
  } else {
    // Most-voted player is ejected, even though they're innocent.
    const ejected = state.players.find((p) => state.assignments[p.id] === accused);
    if (ejected && !state.eliminated.includes(ejected.id)) state.eliminated.push(ejected.id);
    state.wrongAttempts += 1;
    if (livePlayers(state).length <= 1) {
      // only the culprit is left — they got away
      state.phase = 'final';
      state.escaped = true;
    } else {
      state.phase = 'wrong';
    }
  }
  state.updatedAt = now;
  return state;
}

export function continueAfterWrong(state: RoomState, playerId: string, now: number): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'wrong') throw new RoomError('مش وقتها', 'BAD_PHASE');
  const c = requireCase(state.caseId);
  const total = cluesFor(c, state.criminalId ?? c.criminalId).length;
  if (state.revealedClues < total) state.revealedClues += 1;
  // Back to discussion for another round; the ejected player stays out.
  state.phase = 'clues';
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
  /** Voted out of the game. */
  eliminated: boolean;
}
export interface RoomView {
  code: string;
  phase: RoomPhase;
  round: number;
  you: { id: string; name: string; gender: Gender; isHost: boolean; eliminated: boolean } | null;
  players: PublicPlayer[];
  case: { id: string; title: string; theme: string; difficulty: string; description: string; victim: string };
  suspects: { id: string; name: string; age: number; gender: Gender; occupation: string }[];
  myCharacter: (Character & { amICulprit: boolean }) | null;
  clues: Clue[];
  revealedClues: number;
  totalClues: number;
  votesIn: number;
  /** How many players still have to vote this round. */
  eligibleVoters: number;
  myVote: string | null;
  /** The player just voted out (shown on the wrong-guess screen). */
  lastEjected: { playerName: string; characterName: string } | null;
  /** Everyone voted out so far (in order) — all innocent, with their revealed role. */
  ejected: { playerName: string; characterName: string }[];
  /** Only present once the case is over. */
  solution: {
    criminalId: string;
    criminalName: string;
    culpritPlayerName: string | null;
    accusedId: string | null;
    /** True when the culprit got away (group lost). */
    escaped: boolean;
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
  // Real suspects = players still in the game.
  const liveCharSet = liveChars(state);

  // Everyone voted out so far (all innocent) — name + their now-revealed role.
  const ejected = state.eliminated
    .map((pid) => state.players.find((p) => p.id === pid))
    .filter((p): p is RoomPlayer => !!p)
    .map((p) => ({ playerName: p.name, characterName: charById.get(state.assignments[p.id])?.name ?? '—' }));

  // The player just voted out, surfaced on the wrong-guess screen.
  let lastEjected: RoomView['lastEjected'] = null;
  if (state.phase === 'wrong' && state.lastAccusedId) {
    const ej = state.players.find((p) => state.assignments[p.id] === state.lastAccusedId);
    const ch = ej ? charById.get(state.assignments[ej.id]) : undefined;
    if (ej && ch) lastEjected = { playerName: ej.name, characterName: ch.name };
  }

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
      escaped: state.escaped,
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
    you: me
      ? { id: me.id, name: me.name, gender: me.gender, isHost: me.isHost, eliminated: state.eliminated.includes(me.id) }
      : null,
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      isHost: p.isHost,
      connected: now - p.lastSeen < DISCONNECT_MS,
      hasVoted: p.vote != null,
      eliminated: state.eliminated.includes(p.id),
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
    // Only players still in the game, and never yourself.
    suspects: c.characters
      .filter((ch) => liveCharSet.has(ch.id) && ch.id !== myCharId)
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
    votesIn: state.players.filter((p) => p.vote != null && !state.eliminated.includes(p.id)).length,
    eligibleVoters: activeVoters(state, now).length,
    myVote: me?.vote ?? null,
    lastEjected,
    ejected,
    solution,
  };
}
