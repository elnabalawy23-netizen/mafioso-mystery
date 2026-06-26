import type { RoomStore } from './store';
import * as E from './roomEngine';

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

/**
 * Framework-agnostic room API. Both the Vite dev middleware and the production
 * serverless function call this with the parsed JSON payload. Every successful
 * mutation returns the caller's fresh per-player view.
 */
export async function handleRoom(store: RoomStore, payload: Record<string, any>): Promise<ApiResult> {
  const now = Date.now();
  const action = String(payload?.action ?? '');

  const okView = async (state: E.RoomState, playerId: string): Promise<ApiResult> => {
    await store.save(state);
    return { status: 200, body: { view: E.viewFor(state, playerId, now) } };
  };

  try {
    if (action === 'create') {
      const { state, playerId } = E.createRoom(payload.caseId, payload.name, payload.gender, now);
      await store.save(state);
      return { status: 200, body: { code: state.code, playerId, view: E.viewFor(state, playerId, now) } };
    }

    const code = String(payload.code ?? '').toUpperCase();
    const state = await store.get(code);
    if (!state) return { status: 404, body: { error: 'الغرفة مش موجودة', code: 'ROOM_NOT_FOUND' } };

    const pid = String(payload.playerId ?? '');

    switch (action) {
      case 'join': {
        const { playerId } = E.joinRoom(state, payload.name, payload.gender, now);
        await store.save(state);
        return { status: 200, body: { playerId, view: E.viewFor(state, playerId, now) } };
      }
      case 'view':
        E.heartbeat(state, pid, now);
        return okView(state, pid);
      case 'update':
        E.updatePlayer(state, pid, { name: payload.name, gender: payload.gender }, now);
        return okView(state, pid);
      case 'leave':
        E.leaveRoom(state, pid, now);
        await store.save(state);
        return { status: 200, body: { ok: true } };
      case 'start':
        E.startGame(state, pid, now);
        return okView(state, pid);
      case 'showRoles':
        E.showRoles(state, pid, now);
        return okView(state, pid);
      case 'begin':
        E.beginInvestigation(state, pid, now);
        return okView(state, pid);
      case 'revealClue':
        E.revealNextClue(state, pid, now);
        return okView(state, pid);
      case 'openVote':
        E.openVoting(state, pid, now);
        return okView(state, pid);
      case 'vote':
        E.castVote(state, pid, payload.characterId, now);
        return okView(state, pid);
      case 'resolve':
        E.resolveVoting(state, pid, now);
        return okView(state, pid);
      case 'continue':
        E.continueAfterWrong(state, pid, now);
        return okView(state, pid);
      case 'reveal':
        E.revealTruth(state, pid, now);
        return okView(state, pid);
      case 'again':
        E.playAgain(state, pid, now);
        return okView(state, pid);
      default:
        return { status: 400, body: { error: 'طلب مش معروف', code: 'BAD_ACTION' } };
    }
  } catch (e) {
    if (e instanceof E.RoomError) return { status: 400, body: { error: e.message, code: e.code } };
    return { status: 500, body: { error: 'حصل خطأ في السيرفر', code: 'SERVER_ERROR' } };
  }
}
