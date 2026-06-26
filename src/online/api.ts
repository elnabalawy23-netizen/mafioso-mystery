import type { Gender } from '../types';
import type { RoomView } from '../server/roomEngine';

export type { RoomView };

export interface CreateResult {
  code: string;
  playerId: string;
  view: RoomView;
}
export interface JoinResult {
  playerId: string;
  view: RoomView;
}

async function post<T>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const err = new Error(data?.error || 'حصل خطأ في الاتصال') as Error & { status?: number; api?: string };
    err.status = res.status;
    err.api = data?.code;
    throw err;
  }
  return data as T;
}

const v = (action: string) => (code: string, playerId: string) =>
  post<{ view: RoomView }>({ action, code, playerId });

export const roomApi = {
  create: (caseId: string, name: string, gender: Gender) =>
    post<CreateResult>({ action: 'create', caseId, name, gender }),
  join: (code: string, name: string, gender: Gender) =>
    post<JoinResult>({ action: 'join', code, name, gender }),
  view: v('view'),
  start: v('start'),
  begin: v('begin'),
  revealClue: v('revealClue'),
  openVote: v('openVote'),
  vote: (code: string, playerId: string, characterId: string) =>
    post<{ view: RoomView }>({ action: 'vote', code, playerId, characterId }),
  resolve: v('resolve'),
  next: v('continue'),
  reveal: v('reveal'),
  again: v('again'),
  leave: (code: string, playerId: string) => post<{ ok: boolean }>({ action: 'leave', code, playerId }),
};
