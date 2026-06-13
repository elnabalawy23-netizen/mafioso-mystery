import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { casesByDifficulty, DIFFICULTIES, type CaseOrder } from '../data/cases';
import { Button, Eyebrow, ScreenShell } from '../components/ui';
import { CaseCard, DIFFICULTY_STYLE } from '../components/CaseCard';
import type { Difficulty } from '../types';

export default function SelectCaseScreen() {
  const { chooseCase, go } = useGame();
  const [active, setActive] = useState<Difficulty>('easy');
  const [order, setOrder] = useState<CaseOrder>('newest');

  const cases = casesByDifficulty(active, order);

  const surpriseMe = () => {
    if (cases.length === 0) return;
    const pick = cases[Math.floor(Math.random() * cases.length)];
    chooseCase(pick);
  };

  return (
    <ScreenShell>
      <div className="mb-5 flex items-center justify-between">
        <Button variant="ghost" onClick={() => go('home')} className="px-4 py-2 text-sm">
          رجوع
        </Button>
        <Eyebrow>اختار القضية</Eyebrow>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-parchment">ملفات القضايا</h1>
      <p className="mb-4 text-sm text-muted">اختار مستوى الصعوبة، وبعدين القضية اللي عايز تحلّها.</p>

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
                  ? DIFFICULTY_STYLE[key].active
                  : 'border-white/10 bg-white/5 text-muted hover:text-parchment'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${DIFFICULTY_STYLE[key].dot}`} />
                {label}
              </span>
              <span className="mt-0.5 block text-[11px] font-normal opacity-70">{count} قضايا</span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-muted">ترتيب القضايا</span>
        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-ink-800/50">
          {(
            [
              { key: 'newest', label: 'الأحدث الأول' },
              { key: 'oldest', label: 'الأقدم الأول' },
            ] as { key: CaseOrder; label: string }[]
          ).map((o) => (
            <button
              key={o.key}
              onClick={() => setOrder(o.key)}
              aria-pressed={order === o.key}
              className={`btn-press px-3 py-2 text-xs font-semibold transition ${
                order === o.key
                  ? 'bg-brass-500/25 text-brass-200'
                  : 'text-muted hover:text-parchment'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <motion.button
        onClick={surpriseMe}
        disabled={cases.length === 0}
        whileTap={{ scale: 0.97 }}
        className="btn-press group mb-4 flex w-full items-center justify-center gap-2.5 rounded-2xl border border-brass-500/40 bg-gradient-to-r from-brass-500/15 via-brass-500/10 to-brass-500/15 px-4 py-3 text-sm font-bold text-brass-300 shadow-glow transition hover:from-brass-500/25 hover:to-brass-500/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="text-lg transition-transform group-hover:rotate-[20deg]">🎲</span>
        فاجئني — قضية عشوائية
      </motion.button>

      <div className="flex-1 space-y-4 overflow-y-auto scroll-thin pb-2">
        {cases.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted">مفيش قضايا في المستوى ده لسه.</p>
        )}
        {cases.map((c, i) => (
          <CaseCard key={c.id} caseData={c} index={i} onClick={() => chooseCase(c)} />
        ))}
      </div>
    </ScreenShell>
  );
}
