import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { MIN_PLAYERS, maxPlayersFor } from '../data/cases';
import { Button, Eyebrow, ScreenShell } from '../components/ui';

export default function AddPlayersScreen() {
  const { selectedCase, setPlayers, startGame, go } = useGame();
  const max = selectedCase ? maxPlayersFor(selectedCase) : 8;
  const [names, setNames] = useState<string[]>(['', '', '', '']);

  if (!selectedCase) return null;

  const update = (i: number, value: string) =>
    setNames((arr) => arr.map((n, idx) => (idx === i ? value : n)));

  const addSlot = () => setNames((arr) => (arr.length >= max ? arr : [...arr, '']));
  const removeSlot = (i: number) =>
    setNames((arr) => (arr.length <= MIN_PLAYERS ? arr : arr.filter((_, idx) => idx !== i)));

  const filled = names.map((n) => n.trim()).filter(Boolean);
  const ready = filled.length === names.length && filled.length >= MIN_PLAYERS;

  const onStart = () => {
    if (!ready) return;
    setPlayers(filled);
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
      <p className="mb-5 text-sm text-muted">
        اكتبوا أسامي اللاعبين — من {MIN_PLAYERS} لـ {max} لاعبين للقضية دي.
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto scroll-thin pb-2">
        <AnimatePresence initial={false}>
          {names.map((name, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="flex items-center gap-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass-500/15 text-sm font-bold text-brass-300">
                {i + 1}
              </span>
              <input
                value={name}
                onChange={(e) => update(i, e.target.value)}
                placeholder={`اسم اللاعب رقم ${i + 1}`}
                className="h-12 flex-1 rounded-xl border border-white/10 bg-ink-800/80 px-4 text-parchment outline-none transition focus:border-brass-500/60 focus:bg-ink-700/80"
              />
              {names.length > MIN_PLAYERS && (
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

        {names.length < max && (
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
        {!ready && (
          <p className="text-center text-xs text-muted">
            اكتب كل الأسامي (٤ على الأقل) عشان تكمّل
          </p>
        )}
      </div>
    </ScreenShell>
  );
}
