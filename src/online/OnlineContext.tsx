import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Gender } from '../types';
import { roomApi, type RoomView } from './api';

type Screen = 'menu' | 'create' | 'join';
const LS_KEY = 'mafioso.online';
const POLL_MS = 1500;

interface OnlineState {
  screen: Screen;
  code: string | null;
  playerId: string | null;
  view: RoomView | null;
  error: string | null;
  busy: boolean;
}

interface OnlineCtx extends OnlineState {
  setScreen: (s: Screen) => void;
  clearError: () => void;
  create: (caseId: string, name: string, gender: Gender) => Promise<void>;
  join: (code: string, name: string, gender: Gender) => Promise<void>;
  leave: () => Promise<void>;
  start: () => Promise<void>;
  begin: () => Promise<void>;
  openVote: () => Promise<void>;
  vote: (characterId: string) => Promise<void>;
  resolve: () => Promise<void>;
  next: () => Promise<void>;
  reveal: () => Promise<void>;
  again: () => Promise<void>;
}

const Ctx = createContext<OnlineCtx | null>(null);

function loadSaved(): { code: string; playerId: string } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && typeof p.code === 'string' && typeof p.playerId === 'string') return p;
  } catch {
    /* ignore */
  }
  return null;
}
function save(code: string | null, playerId: string | null) {
  try {
    if (code && playerId) localStorage.setItem(LS_KEY, JSON.stringify({ code, playerId }));
    else localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

export function OnlineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnlineState>({
    screen: 'menu',
    code: null,
    playerId: null,
    view: null,
    error: null,
    busy: false,
  });
  const polling = useRef(false);

  // Resume an existing room after a refresh.
  useEffect(() => {
    const saved = loadSaved();
    if (!saved) return;
    roomApi
      .view(saved.code, saved.playerId)
      .then((r) => setState((s) => ({ ...s, code: saved.code, playerId: saved.playerId, view: r.view })))
      .catch(() => save(null, null));
  }, []);

  // Keep in sync with the server while in a room.
  useEffect(() => {
    const { code, playerId } = state;
    if (!code || !playerId) return;
    const id = setInterval(async () => {
      if (polling.current) return;
      polling.current = true;
      try {
        const r = await roomApi.view(code, playerId);
        setState((s) => (s.code === code ? { ...s, view: r.view } : s));
      } catch (e) {
        if ((e as { status?: number })?.status === 404) {
          save(null, null);
          setState((s) => ({ ...s, code: null, playerId: null, view: null, screen: 'menu' }));
        }
      } finally {
        polling.current = false;
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [state.code, state.playerId]);

  const run = useCallback(async (fn: () => Promise<{ view: RoomView }>) => {
    setState((s) => ({ ...s, busy: true, error: null }));
    try {
      const r = await fn();
      setState((s) => ({ ...s, view: r.view, busy: false }));
    } catch (e) {
      setState((s) => ({ ...s, busy: false, error: (e as Error)?.message || 'حصل خطأ' }));
    }
  }, []);

  const create = useCallback(async (caseId: string, name: string, gender: Gender) => {
    setState((s) => ({ ...s, busy: true, error: null }));
    try {
      const r = await roomApi.create(caseId, name, gender);
      save(r.code, r.playerId);
      setState((s) => ({ ...s, busy: false, code: r.code, playerId: r.playerId, view: r.view }));
    } catch (e) {
      setState((s) => ({ ...s, busy: false, error: (e as Error)?.message || 'حصل خطأ' }));
    }
  }, []);

  const join = useCallback(async (code: string, name: string, gender: Gender) => {
    const c = code.trim().toUpperCase();
    setState((s) => ({ ...s, busy: true, error: null }));
    try {
      const r = await roomApi.join(c, name, gender);
      save(c, r.playerId);
      setState((s) => ({ ...s, busy: false, code: c, playerId: r.playerId, view: r.view }));
    } catch (e) {
      setState((s) => ({ ...s, busy: false, error: (e as Error)?.message || 'حصل خطأ' }));
    }
  }, []);

  const leave = useCallback(async () => {
    setState((s) => {
      if (s.code && s.playerId) roomApi.leave(s.code, s.playerId).catch(() => {});
      save(null, null);
      return { screen: 'menu', code: null, playerId: null, view: null, error: null, busy: false };
    });
  }, []);

  const act = useCallback(
    (fn: (code: string, pid: string) => Promise<{ view: RoomView }>) => () =>
      new Promise<void>((resolve) => {
        setState((s) => {
          if (s.code && s.playerId) run(() => fn(s.code!, s.playerId!)).then(resolve);
          else resolve();
          return s;
        });
      }),
    [run],
  );

  const value: OnlineCtx = {
    ...state,
    setScreen: (screen) => setState((s) => ({ ...s, screen, error: null })),
    clearError: () => setState((s) => ({ ...s, error: null })),
    create,
    join,
    leave,
    start: act(roomApi.start),
    begin: act(roomApi.begin),
    openVote: act(roomApi.openVote),
    vote: (characterId: string) =>
      act((c, p) => roomApi.vote(c, p, characterId))(),
    resolve: act(roomApi.resolve),
    next: act(roomApi.next),
    reveal: act(roomApi.reveal),
    again: act(roomApi.again),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnline(): OnlineCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useOnline must be used inside OnlineProvider');
  return c;
}
