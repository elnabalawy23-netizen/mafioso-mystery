/* Standalone spec for the room engine. Bundled with esbuild and run under node. */
import {
  createRoom,
  joinRoom,
  startGame,
  beginInvestigation,
  revealNextClue,
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

    // everyone votes for a WRONG suspect (an assigned non-culprit, never themselves) -> wrong
    openVoting(state, ids[0], 3100);
    const assignedIds = Object.values(state.assignments);
    const wrongTargets: Record<string, string> = {};
    for (const id of ids) {
      const t = assignedIds.find((cid) => cid !== state.criminalId && cid !== state.assignments[id])!;
      wrongTargets[id] = t;
      castVote(state, id, t, 3200);
    }
    checkSecurity(state, ids, `${caseId}/voting`);
    // during voting, no one sees others' vote targets
    for (const id of ids) {
      const v = viewFor(state, id, 3200);
      ok(v.myVote === wrongTargets[id], `${caseId}: myVote wrong`);
      ok(v.votesIn === ids.length, `${caseId}: votesIn count wrong`);
      // you are never offered yourself, and every suspect is a real player
      ok(v.suspects.every((s) => s.id !== state.assignments[id]), `${caseId}: self in suspects`);
      ok(v.suspects.every((s) => assignedIds.includes(s.id)), `${caseId}: non-player in suspects`);
      ok(v.suspects.length === ids.length - 1, `${caseId}: suspect count wrong`);
    }
    resolveVoting(state, ids[0], 3300);
    ok(state.phase === 'wrong', `${caseId}: should be wrong after wrong accusation`);
    checkSecurity(state, ids, `${caseId}/wrong`);

    // continue -> next clue, then everyone votes for the REAL culprit -> solved
    continueAfterWrong(state, ids[0], 3400);
    ok(state.phase === 'clues' && state.revealedClues === 2, `${caseId}: second clue not shown`);
    openVoting(state, ids[0], 3500);
    for (const id of ids) {
      if (state.assignments[id] === state.criminalId) {
        // the culprit can't accuse themselves — they vote someone else (stays a minority)
        const other = assignedIds.find((cid) => cid !== state.criminalId)!;
        castVote(state, id, other, 3600);
      } else {
        castVote(state, id, state.criminalId!, 3600);
      }
    }
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

// 3) Voting target guards: only real players, never yourself.
console.log('voting target guards...');
{
  const { state, ids } = buildStarted('c1', ['male', 'female', 'male', 'female']); // 8-char case, 4 players
  beginInvestigation(state, ids[0], 100);
  openVoting(state, ids[0], 110);
  const c = getCaseById('c1')!;
  const assigned = new Set(Object.values(state.assignments));

  // a real case character that is NOT dealt to any player must be rejected
  const unassigned = c.characters.find((ch) => !assigned.has(ch.id));
  ok(!!unassigned, 'c1 with 4 players should leave some characters unassigned');
  if (unassigned) {
    let threw = false;
    try {
      castVote(state, ids[0], unassigned.id, 120);
    } catch {
      threw = true;
    }
    ok(threw, 'voting for a non-player character should throw');
  }

  // voting for your OWN character must be rejected
  let threwSelf = false;
  try {
    castVote(state, ids[0], state.assignments[ids[0]], 130);
  } catch {
    threwSelf = true;
  }
  ok(threwSelf, 'self-vote should throw');

  // a valid vote (another real player) is recorded
  const valid = Object.values(state.assignments).find((cid) => cid !== state.assignments[ids[0]])!;
  castVote(state, ids[0], valid, 140);
  ok(state.players.find((p) => p.id === ids[0])!.vote === valid, 'valid vote should be recorded');
}

// 4) Host can reveal the next clue during discussion without anyone voting.
console.log('reveal-next-clue...');
{
  const { state, ids } = buildStarted('c1', ['male', 'female', 'male', 'female']);
  beginInvestigation(state, ids[0], 100);
  ok(state.revealedClues === 1, 'discussion starts at clue 1');
  const cap = viewFor(state, ids[0], 105).totalClues;

  revealNextClue(state, ids[0], 110);
  ok(state.phase === 'clues' && state.revealedClues === 2, 'host revealed clue 2 without voting');

  let threw = false;
  try {
    revealNextClue(state, ids[1], 120); // not the host
  } catch {
    threw = true;
  }
  ok(threw, 'non-host revealNextClue should throw');

  for (let i = 0; i < cap + 5; i++) revealNextClue(state, ids[0], 130 + i);
  ok(state.revealedClues === cap, 'revealNextClue caps at totalClues');
  ok(state.phase === 'clues', 'stays in clues phase after capping');
}

console.log(failures === 0 ? '\nPASS — all engine flow + security checks green' : `\nFAIL — ${failures} check(s) failed`);
if (failures) process.exit(1);
