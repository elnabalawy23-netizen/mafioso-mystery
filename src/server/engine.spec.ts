/* Standalone spec for the room engine. Bundled with esbuild and run under node. */
import {
  createRoom,
  joinRoom,
  startGame,
  beginInvestigation,
  openVoting,
  castVote,
  resolveVoting,
  continueAfterWrong,
  playAgain,
  viewFor,
  type RoomState,
} from './roomEngine';
import { getCaseById } from '../data/cases';

let failures = 0;
function ok(cond: boolean, msg: string) {
  if (!cond) {
    failures++;
    console.log('  ✗ ' + msg);
  }
}

function buildStarted(caseId: string, genders: ('male' | 'female')[]): { state: RoomState; ids: string[] } {
  const now = 1000;
  const { state, playerId } = createRoom(caseId, 'Host', genders[0], now);
  const ids = [playerId];
  for (let i = 1; i < genders.length; i++) {
    const r = joinRoom(state, 'P' + i, genders[i], now + i);
    ids.push(r.playerId);
  }
  startGame(state, ids[0], now + 100);
  return { state, ids };
}

// ---- Security invariant: no view leaks the culprit or others' secrets ----
function checkSecurity(state: RoomState, ids: string[], label: string) {
  const over = state.phase === 'solved' || state.phase === 'final';
  for (const id of ids) {
    const v = viewFor(state, id, 2000);
    const blob = JSON.stringify(v);
    const isCulprit = state.assignments[id] === state.criminalId;

    if (!over) {
      // No solution and no top-level culprit signal before the reveal.
      ok(v.solution === null, `${label}: solution leaked pre-reveal to ${id}`);
      ok(!('criminalId' in (v as Record<string, unknown>)), `${label}: criminalId field exposed to ${id}`);
      // A non-culprit is never told (via their own character) that they're guilty.
      if (!isCulprit) {
        ok(
          v.myCharacter == null || v.myCharacter.id !== state.criminalId,
          `${label}: non-culprit ${id} given the culprit character`,
        );
        ok(v.myCharacter == null || v.myCharacter.amICulprit === false, `${label}: amICulprit true for innocent ${id}`);
      }
    }
    // A player only ever sees their OWN full character.
    if (v.myCharacter) {
      ok(v.myCharacter.id === state.assignments[id], `${label}: wrong character handed to ${id}`);
      ok(v.myCharacter.amICulprit === isCulprit, `${label}: amICulprit wrong for ${id}`);
    }
    // Suspect roster exposes public fields only (no secret / no guilt flag).
    ok(
      v.suspects.every(
        (s) =>
          !('secret' in s) && !('story' in s) && !('statement' in s) && !('isCriminal' in s) && !('guilt' in s),
      ),
      `${label}: suspect roster leaked a secret/guilt flag`,
    );
    // Player list never carries character or vote target.
    ok(
      v.players.every((p) => !('character' in p) && !('vote' in p)),
      `${label}: player list leaked character/vote`,
    );
    // No other player's secret text appears anywhere in my view.
    const c = getCaseById(state.caseId)!;
    for (const ch of c.characters) {
      if (ch.id === state.assignments[id]) continue; // my own is allowed
      ok(!blob.includes(ch.secret), `${label}: ${ch.id} secret leaked to ${id}`);
    }
  }
}

// 1) Full flow across every case, many gender mixes.
console.log('flow + security across all cases...');
const cases = ['c1', 'c5', 'e1', 'h2', 'm1'];
for (const caseId of cases) {
  for (let trial = 0; trial < 50; trial++) {
    const n = 4 + (trial % 3); // 4..6 players
    const genders = Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 'male' : 'female')) as (
      | 'male'
      | 'female'
    )[];
    const { state, ids } = buildStarted(caseId, genders);

    // roles phase
    ok(state.phase === 'roles', `${caseId}: phase should be roles after start`);
    checkSecurity(state, ids, `${caseId}/roles`);
    // gender match where feasible
    const c = getCaseById(caseId)!;
    const fCount = c.characters.filter((x) => x.gender === 'female').length;
    const mCount = c.characters.length - fCount;
    const pf = genders.filter((g) => g === 'female').length;
    const fits = pf <= fCount && n - pf <= mCount;
    if (fits) {
      for (const id of ids) {
        const v = viewFor(state, id, 2000);
        const me = state.players.find((p) => p.id === id)!;
        ok(v.myCharacter?.gender === me.gender, `${caseId}: gender mismatch for ${id}`);
      }
    }
    // exactly one culprit, and it's assigned to a player
    ok(
      Object.values(state.assignments).filter((cid) => cid === state.criminalId).length === 1,
      `${caseId}: culprit not assigned exactly once`,
    );

    // begin clues
    beginInvestigation(state, ids[0], 3000);
    ok(state.phase === 'clues' && state.revealedClues === 1, `${caseId}: first clue not shown`);
    checkSecurity(state, ids, `${caseId}/clues`);

    // everyone votes for a WRONG suspect (a non-culprit), resolve -> wrong
    openVoting(state, ids[0], 3100);
    const wrongSuspect = c.characters.find((x) => x.id !== state.criminalId)!.id;
    for (const id of ids) castVote(state, id, wrongSuspect, 3200);
    checkSecurity(state, ids, `${caseId}/voting`);
    // during voting, no one sees others' vote targets
    for (const id of ids) {
      const v = viewFor(state, id, 3200);
      ok(v.myVote === wrongSuspect, `${caseId}: myVote wrong`);
      ok(v.votesIn === ids.length, `${caseId}: votesIn count wrong`);
    }
    resolveVoting(state, ids[0], 3300);
    ok(state.phase === 'wrong', `${caseId}: should be wrong after wrong accusation`);
    checkSecurity(state, ids, `${caseId}/wrong`);

    // continue -> next clue, then everyone votes for the REAL culprit -> solved
    continueAfterWrong(state, ids[0], 3400);
    ok(state.phase === 'clues' && state.revealedClues === 2, `${caseId}: second clue not shown`);
    openVoting(state, ids[0], 3500);
    for (const id of ids) castVote(state, id, state.criminalId!, 3600);
    resolveVoting(state, ids[0], 3700);
    ok(state.phase === 'solved', `${caseId}: should be solved after correct accusation`);

    // now the solution IS revealed to everyone
    for (const id of ids) {
      const v = viewFor(state, id, 3800);
      ok(v.solution != null, `${caseId}: solution missing after solve`);
      ok(v.solution!.criminalId === state.criminalId, `${caseId}: wrong solution culprit`);
      ok(v.solution!.cast.length === ids.length, `${caseId}: cast incomplete`);
    }

    // play again -> fresh roles, secrets hidden again
    playAgain(state, ids[0], 3900);
    ok(state.phase === 'roles', `${caseId}: playAgain should return to roles`);
    checkSecurity(state, ids, `${caseId}/replay-roles`);
  }
}

// 2) Guards
console.log('guard checks...');
{
  const now = 1;
  const { state, playerId } = createRoom('c1', 'A', 'male', now);
  let threw = false;
  try {
    startGame(state, playerId, now); // only 1 player
  } catch {
    threw = true;
  }
  ok(threw, 'start with <4 players should throw');

  // non-host cannot start
  joinRoom(state, 'B', 'male', now);
  joinRoom(state, 'C', 'male', now);
  const r = joinRoom(state, 'D', 'male', now);
  let threw2 = false;
  try {
    startGame(state, r.playerId, now); // not host
  } catch {
    threw2 = true;
  }
  ok(threw2, 'non-host start should throw');
}

console.log(failures === 0 ? '\nPASS — all engine flow + security checks green' : `\nFAIL — ${failures} check(s) failed`);
if (failures) process.exit(1);
