import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { casesByDifficulty, DIFFICULTIES, MIN_PLAYERS } from '../data/cases';
import { Button, Eyebrow, ScreenShell } from '../components/ui';
import type { Difficulty } from '../types';

const TAB_STYLE: Record<Difficulty, { active: string; dot: string; badge: string }> = {
  easy: {
    active: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200',
    dot: 'bg-emerald-400',
    badge: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  },
  medium: {
    active: 'bg-amber-500/20 border-amber-400/50 text-amber-200',
    dot: 'bg-amber-400',
    badge: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
  },
  hard: {
    active: 'bg-blood-500/20 border-blood-400/50 text-blood-400',
    dot: 'bg-blood-400',
    badge: 'border-blood-400/40 bg-blood-500/10 text-blood-400',
  },
};

export default function SelectCaseScreen() {
  const { chooseCase, go } = useGame();
  const [active, setActive] = useState<Difficulty>('easy');

  const cases = casesByDifficulty(active);

  return (
    <ScreenShell>
      <div className="mb-5 flex items-center justify-between">
        <Button variant="ghost" onClick={() => go('home')} className="px-4 py-2 text-sm">
          رجوع
        </Button>
        <Eyebrow>اختر القضية</Eyebrow>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-parchment">ملفات القضايا</h1>
      <p className="mb-4 text-sm text-muted">اختر مستوى الصعوبة، ثم القضية التي تريد حلّها.</p>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {DIFFICULTIES.map(({ key, label }) => {
          const isActive = key === active;
          const count = casesByDifficulty(key).length;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`btn-press rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? TAB_STYLE[key].active
                  : 'border-white/10 bg-white/5 text-muted hover:text-parchment'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${TAB_STYLE[key].dot}`} />
                {label}
              </span>
              <span className="mt-0.5 block text-[11px] font-normal opacity-70">{count} قضايا</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto scroll-thin pb-2">
        {cases.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted">لا توجد قضايا في هذا المستوى بعد.</p>
        )}
        {cases.map((c, i) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => chooseCase(c)}
            className="panel block w-full overflow-hidden p-0 text-right"
          >
            <div className="flex items-stretch">
              <div className="flex w-14 shrink-0 items-center justify-center bg-gradient-to-b from-brass-500/20 to-transparent font-display text-3xl text-brass-300">
                {i + 1}
              </div>
              <div className="flex-1 p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold tracking-wider text-brass-300/80">
                    {c.theme}
                  </p>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${TAB_STYLE[c.difficulty].badge}`}
                  >
                    {DIFFICULTIES.find((d) => d.key === c.difficulty)?.label}
                  </span>
                </div>
                <h3 className="text-lg font-bold leading-snug text-parchment">{c.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                  {c.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full border border-brass-500/30 bg-brass-500/10 px-2.5 py-1 font-semibold text-brass-300">
                    👥 {MIN_PLAYERS}–{c.characters.length} لاعبين
                  </span>
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-parchment/80">
                    🔍 {c.clues.length} أدلة
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </ScreenShell>
  );
}
