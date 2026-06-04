import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { Button, Field, ScreenShell, Stepper, TextSizeControl } from '../components/ui';
import { TEXT_SIZES, useTextScale } from '../game/useTextScale';

export default function CharacterRevealScreen() {
  const { assignments, criminalId, revealIndex, nextReveal } = useGame();
  const [revealed, setRevealed] = useState(false);
  const [sizeLevel, setSizeLevel] = useTextScale();
  const bodyPx = TEXT_SIZES[sizeLevel];

  useEffect(() => {
    setRevealed(false);
  }, [revealIndex]);

  const current = assignments[revealIndex];
  if (!current) return null;

  const { player, character } = current;
  const isLast = revealIndex === assignments.length - 1;

  return (
    <ScreenShell>
      <div className="mb-4 pt-2">
        <Stepper total={assignments.length} current={revealIndex} />
      </div>

      {!revealed ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-1 flex-col items-center justify-center text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-brass-500/30 bg-brass-500/10 text-4xl">
            🤫
          </div>
          <p className="text-sm text-muted">سلّم الموبايل لـ</p>
          <h2 className="my-2 text-3xl font-bold gold-text">{player}</h2>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            اتأكد إن مفيش حد تاني شايف الشاشة. دي شخصيتك السرية إنت بس.
          </p>
          <div className="mt-8 w-full">
            <Button full onClick={() => setRevealed(true)}>
              أنا {player} — اكشف شخصيتي
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-1 flex-col">
          <TextSizeControl level={sizeLevel} onChange={setSizeLevel} />
          <motion.div
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="panel flex-1 overflow-y-auto scroll-thin p-5"
            style={{ fontSize: `${bodyPx}px` }}
          >
            {character.id === criminalId && (
              <div className="mb-4 rounded-xl border border-blood-500/50 bg-blood-500/12 p-3 text-center shadow-bloodglow">
                <p className="text-[0.92em] font-bold text-blood-400">إنت المجرم</p>
                <p className="mt-1 text-[0.82em] leading-relaxed text-parchment/85">
                  إنت اللي عملت الجريمة. اتصرّف كأنك بريء، أنكر بذكا، وما تخليش حد يكتشفك لحد آخر تصويت.
                </p>
              </div>
            )}

            <div className="mb-1 flex items-baseline justify-between gap-2">
              <h2 className="text-[1.55em] font-bold leading-tight text-parchment">{character.name}</h2>
              <span className="shrink-0 text-[0.82em] text-muted">{character.age} سنة</span>
            </div>
            <p className="mb-4 text-[0.95em] font-semibold text-brass-300">{character.occupation}</p>

            <div className="space-y-3.5">
              <Field label="علاقتك بالضحية">{character.relationship}</Field>
              <Field label="شخصيتك">{character.personality}</Field>
              <Field label="قصتك">{character.story}</Field>
              <Field label="كلامك قدام الكل">«{character.statement}»</Field>
              <div className="rounded-xl border border-brass-500/25 bg-ink-900/60 p-3">
                <p className="mb-1 text-[0.8em] font-bold text-brass-300">سرّك (ما تقولهوش لحد)</p>
                <p className="text-[1.05em] leading-relaxed text-parchment">{character.secret}</p>
              </div>
            </div>
          </motion.div>

          <div className="mt-4">
            <Button variant="danger" full onClick={nextReveal}>
              {isLast ? 'اقفل وابدأ القضية' : 'اقفل وسلّم للي بعده'}
            </Button>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}
