import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { MIN_PLAYERS, genderCounts, maxPlayersFor } from '../data/cases';
import { Button, Eyebrow, GenderToggle, ScreenShell } from '../components/ui';
import type { Gender, Player } from '../types';

const blank = (): Player => ({ name: '', gender: 'male' });

export default function AddPlayersScreen() {
  const { selectedCase, setPlayers, startGame, go } = useGame();
  const max = selectedCase ? maxPlayersFor(selectedCase) : 8;
  const [players, setPlayersState] = useState<Player[]>([blank(), blank(), blank(), blank()]);

  if (!selectedCase) return null;

  const update = (i: number, value: string) =>
    setPlayersState((arr) => arr.map((p, idx) => (idx === i ? { ...p, name: value } : p)));
  const setGender = (i: number, gender: Gender) =>
    setPlayersState((arr) => arr.map((p, idx) => (idx === i ? { ...p, gender } : p)));

  const addSlot = () => setPlayersState((arr) => (arr.length >= max ? arr : [...arr, blank()]));
  const removeSlot = (i: number) =>
    setPlayersState((arr) => (arr.length <= MIN_PLAYERS ? arr : arr.filter((_, idx) => idx !== i)));

  const trimmed = players.map((p) => ({ ...p, name: p.name.trim() }));
  const namesReady =
    trimmed.every((p) => p.name.length > 0) && trimmed.length >= MIN_PLAYERS;
  // Gender is a soft preference — it never blocks starting the game.
  const ready = namesReady;

  const caps = genderCounts(selectedCase);
  const pf = trimmed.filter((p) => p.gender === 'female').length;
  const overflow = pf > caps.female || trimmed.length - pf > caps.male;

  const onStart = () => {
    if (!ready) return;
    setPlayers(trimmed);
    startGame();
  };

  return (
    <ScreenShell>
      <div className="mb-5 flex items-center justify-between">
        <Button variant="ghost" onClick={() => go('selectCase')} className="px-4 py-2 text-sm">
          رجوع
        </Button>
        <Eyebrow>اللاعبين</Eyebrow>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-parchment">مين المحققين؟</h1>
      <p className="mb-3 text-sm text-muted">
        اكتبوا الأسامي واختاروا نوع كل لاعب (ولد/بنت)، واللعبة هتحاول تديله شخصية بنفس النوع قد ما تقدر.
      </p>
      <p className="mb-4 text-xs text-brass-300/90">
        القضية دي فيها {caps.male} شخصيات ولاد و{caps.female} {caps.female === 1 ? 'شخصية' : 'شخصيات'} بنات.
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto scroll-thin pb-2">
        <AnimatePresence initial={false}>
          {players.map((p, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="flex items-center gap-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass-500/15 text-sm font-bold text-brass-300">
                {i + 1}
              </span>
              <input
                value={p.name}
                onChange={(e) => update(i, e.target.value)}
                placeholder={`اسم اللاعب رقم ${i + 1}`}
                className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-800/80 px-3 text-parchment outline-none transition focus:border-brass-500/60 focus:bg-ink-700/80"
              />
              <GenderToggle gender={p.gender} onChange={(g) => setGender(i, g)} />
              {players.length > MIN_PLAYERS && (
                <button
                  onClick={() => removeSlot(i)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blood-500/15 text-blood-400 transition hover:bg-blood-500/25"
                  aria-label="حذف لاعب"
                >
                  ✕
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {players.length < max && (
          <button
            onClick={addSlot}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brass-500/40 py-3 text-sm text-brass-300 transition hover:bg-brass-500/5"
          >
            <span className="text-lg">＋</span> زوّد لاعب
          </button>
        )}
      </div>

      <div className="mt-5 space-y-2">
        <Button full onClick={onStart} disabled={!ready}>
          وزّع الشخصيات
        </Button>
        {!namesReady ? (
          <p className="text-center text-xs text-muted">اكتب كل الأسامي (٤ على الأقل) عشان تكمّل</p>
        ) : overflow ? (
          <p className="text-center text-xs text-muted">
            القضية دي فيها {caps.male} ولاد و{caps.female} بنات، فلو العدد زاد، اللي زيادة ممكن ياخد شخصية من النوع التاني.
          </p>
        ) : null}
      </div>
    </ScreenShell>
  );
}

