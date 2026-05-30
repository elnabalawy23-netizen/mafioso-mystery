import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { Button, Eyebrow, ScreenShell } from '../components/ui';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function DiscussionScreen() {
  const { selectedCase, clues: allClues, assignments, revealedClues, revealNextClue, goVote } =
    useGame();
  const [seconds, setSeconds] = useState(120);
  const [running, setRunning] = useState(false);
  const [showSuspects, setShowSuspects] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (running && seconds > 0) {
      timer.current = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    }
    if (seconds === 0) setRunning(false);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [running, seconds]);

  if (!selectedCase) return null;

  const clues = allClues.slice(0, revealedClues);
  const hasMore = revealedClues < allClues.length;
  const canVote = revealedClues > 0;

  return (
    <ScreenShell>
      <div className="mb-4 flex items-center justify-between">
        <Eyebrow>لوحة التحقيق</Eyebrow>
        <span className="text-xs text-muted">
          أدلة {revealedClues}/{allClues.length}
        </span>
      </div>

      {/* Discussion timer */}
      <div className="panel mb-4 flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted">مؤقّت النقاش</p>
          <p className={`font-display text-3xl ${seconds <= 10 ? 'text-blood-400' : 'gold-text'}`}>
            {fmt(seconds)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className="rounded-xl border border-brass-500/40 px-4 py-2 text-sm text-brass-300 transition hover:bg-brass-500/10"
          >
            {running ? 'إيقاف' : 'تشغيل'}
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setSeconds(120);
            }}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-muted transition hover:bg-white/5"
          >
            تصفير
          </button>
        </div>
      </div>

      {/* Suspects reference (collapsible) */}
      <button
        onClick={() => setShowSuspects((v) => !v)}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-ink-800/60 px-4 py-3 text-sm text-parchment"
      >
        <span>المشتبه بهم ({assignments.length})</span>
        <span className={`transition ${showSuspects ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {showSuspects && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-3 grid grid-cols-2 gap-2"
        >
          {assignments.map(({ player, character }) => (
            <div key={character.id} className="rounded-lg border border-white/8 bg-ink-800/50 px-3 py-2">
              <p className="text-[13px] font-bold text-parchment">{player}</p>
              <p className="mt-0.5 text-[11px] text-brass-300">{character.name}</p>
              <p className="text-[11px] text-muted">{character.occupation}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Clue board */}
      <div className="flex-1 overflow-y-auto scroll-thin">
        <p className="mb-2 text-sm font-bold text-brass-300">الأدلة المكتشَفة</p>
        {clues.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-muted">
            لم يُكشف أي دليل بعد. ناقشوا القضية ثم اكشفوا الدليل الأول.
          </div>
        ) : (
          <div className="space-y-3">
            {clues.map((clue, i) => (
              <motion.div
                key={clue.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative rounded-xl border border-brass-500/20 bg-ink-800/70 p-4 pr-6"
              >
                <span className="pin absolute -top-1.5 right-4" />
                <p className="text-xs font-bold text-brass-300/80">الدليل {i + 1} — {clue.title}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-parchment/90">{clue.text}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {hasMore && (
          <Button variant="outline" full onClick={revealNextClue}>
            🔍 اكشف الدليل {revealedClues === 0 ? 'الأول' : 'التالي'}
          </Button>
        )}
        <Button variant={canVote ? 'primary' : 'ghost'} full disabled={!canVote} onClick={goVote}>
          انتقلوا إلى التصويت
        </Button>
        {!canVote && (
          <p className="text-center text-xs text-muted">اكشفوا دليلًا واحدًا على الأقل قبل التصويت</p>
        )}
      </div>
    </ScreenShell>
  );
}
