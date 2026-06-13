import { motion } from 'framer-motion';
import type { Difficulty, MysteryCase } from '../types';
import { DIFFICULTIES, MIN_PLAYERS } from '../data/cases';
import { CaseArt } from './CaseArt';

/** Shared per-difficulty accent styles (tabs + badges) used across screens. */
export const DIFFICULTY_STYLE: Record<Difficulty, { active: string; dot: string; badge: string }> = {
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

/**
 * The rich case card (art banner + number + difficulty badge + theme + title +
 * description + player/clue chips). Shared by the local select screen and the
 * online create-room screen so both look and feel identical. Pass `selected`
 * to show a picked state (used when choosing before a separate confirm step).
 */
export function CaseCard({
  caseData: c,
  index,
  selected = false,
  onClick,
}: {
  caseData: MysteryCase;
  index: number;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`panel block w-full overflow-hidden p-0 text-right transition ${
        selected ? 'border-brass-400 shadow-glow ring-1 ring-brass-400/60' : ''
      }`}
    >
      <div className="relative h-24 w-full">
        <CaseArt caseId={c.id} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/25 to-transparent" />
        <span className="absolute left-3 top-2 font-display text-2xl text-brass-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
          {index + 1}
        </span>
        <span
          className={`absolute right-3 top-2 rounded-full border px-2 py-0.5 text-[10px] font-bold ${DIFFICULTY_STYLE[c.difficulty].badge}`}
        >
          {DIFFICULTIES.find((d) => d.key === c.difficulty)?.label}
        </span>
        <p className="absolute bottom-1.5 right-3 text-[11px] font-semibold tracking-wider text-brass-300/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          {c.theme}
        </p>
        {selected && (
          <span className="absolute bottom-2 left-3 flex h-6 w-6 items-center justify-center rounded-full bg-brass-400 text-xs font-bold text-ink-950">
            ✓
          </span>
        )}
      </div>
      <div className="p-4 pt-3">
        <h3 className="text-lg font-bold leading-snug text-parchment">{c.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{c.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-brass-500/30 bg-brass-500/10 px-2.5 py-1 font-semibold text-brass-300">
            👥 {MIN_PLAYERS}–{c.characters.length} لاعبين
          </span>
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-parchment/80">🔍 {c.clues.length} أدلة</span>
        </div>
      </div>
    </motion.button>
  );
}
