import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { Button, Eyebrow, ScreenShell } from '../components/ui';

export default function VotingScreen() {
  const { selectedCase, assignments, revealedClues, accuse } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!selectedCase) return null;
  const selected = assignments.find((a) => a.character.id === selectedId) ?? null;

  const submit = () => {
    if (!selected) return;
    setConfirming(true);
    setTimeout(() => accuse(selected.character.id), 1500);
  };

  return (
    <ScreenShell>
      <div className="mb-3 flex items-center justify-between">
        <Eyebrow>التصويت</Eyebrow>
        <span className="text-xs text-muted">بعد {revealedClues} أدلة</span>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-parchment">مين المجرم؟</h1>
      <p className="mb-4 text-sm text-muted">اتفقوا على لاعب واحد وبعدين اتهموه.</p>

      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="grid grid-cols-2 gap-3">
          {assignments.map(({ player, character }, i) => {
            const active = selectedId === character.id;
            return (
              <motion.button
                key={character.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedId(character.id)}
                className={`relative rounded-2xl border p-4 text-right transition ${
                  active
                    ? 'border-brass-400 bg-brass-500/15 shadow-glow'
                    : 'border-white/10 bg-ink-800/70 hover:border-white/25'
                }`}
              >
                <div className="relative mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-ink-900/70 text-xl">
                  🕵
                  {active && (
                    <span className="absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brass-400 text-xs font-bold text-ink-950">
                      ✓
                    </span>
                  )}
                </div>

                <p className="text-[16px] font-bold leading-tight text-parchment">{player}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brass-500/12 px-2 py-0.5">
                  <span className="text-[11px] font-semibold text-brass-300">{character.name}</span>
                </div>
                <p className="mt-1 text-[12px] text-muted">{character.occupation}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <Button variant="danger" full disabled={!selected} onClick={submit}>
          {selected ? `اتهموا ${selected.player}` : 'اختاروا المتهم'}
        </Button>
      </div>

      {/* Accusation animation overlay */}
      <AnimatePresence>
        {confirming && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-950/92 px-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.1, 1], opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-6 flex h-28 w-28 items-center justify-center rounded-full border-2 border-blood-500/60 bg-blood-500/10 text-5xl shadow-bloodglow"
            >
              🕵
            </motion.div>
            <p className="text-sm tracking-widest text-muted">قرار المجموعة النهائي</p>
            <motion.h2
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="my-2 text-3xl font-bold text-blood-400"
            >
              {selected.player}
            </motion.h2>
            <p className="text-sm text-parchment/70">بدور: {selected.character.name}</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.4, 1] }}
              transition={{ delay: 0.5, duration: 1, repeat: Infinity }}
              className="mt-3 text-sm text-parchment/80"
            >
  بنكشف الحقيقة…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </ScreenShell>
  );
}
