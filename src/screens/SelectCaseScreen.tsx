import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { casesByDifficulty, DIFFICULTIES, MIN_PLAYERS, type CaseOrder } from '../data/cases';
import { Button, Eyebrow, ScreenShell } from '../components/ui';
import { CaseArt } from '../components/CaseArt';
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
          <motion.button
            key={c.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => chooseCase(c)}
            className="panel block w-full overflow-hidden p-0 text-right"
          >
            <div className="relative h-24 w-full">
              <CaseArt caseId={c.id} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/25 to-transparent" />
              <span className="absolute left-3 top-2 font-display text-2xl text-brass-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                {i + 1}
              </span>
              <span
                className={`absolute right-3 top-2 rounded-full border px-2 py-0.5 text-[10px] font-bold ${TAB_STYLE[c.difficulty].badge}`}
              >
                {DIFFICULTIES.find((d) => d.key === c.difficulty)?.label}
              </span>
              <p className="absolute bottom-1.5 right-3 text-[11px] font-semibold tracking-wider text-brass-300/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                {c.theme}
              </p>
            </div>
            <div className="p-4 pt-3">
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
          </motion.button>
        ))}
      </div>
    </ScreenShell>
  );
}
