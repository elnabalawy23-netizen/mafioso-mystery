import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { Button, Field, ScreenShell, Stepper } from '../components/ui';

export default function CharacterRevealScreen() {
  const { assignments, revealIndex, nextReveal } = useGame();
  const [revealed, setRevealed] = useState(false);

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
          <p className="text-sm text-muted">سلّم الهاتف إلى</p>
          <h2 className="my-2 text-3xl font-bold gold-text">{player}</h2>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            تأكّد أن لا أحد غيرك يرى الشاشة. هذه شخصيتك السرّية وحدك.
          </p>
          <div className="mt-8 w-full">
            <Button full onClick={() => setRevealed(true)}>
              أنا {player} — اكشف شخصيتي
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-1 flex-col">
          <motion.div
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="panel flex-1 overflow-y-auto scroll-thin p-5"
          >
            {character.isCriminal && (
              <div className="mb-4 rounded-xl border border-blood-500/50 bg-blood-500/12 p-3 text-center shadow-bloodglow">
                <p className="text-sm font-bold text-blood-400">أنت المجرم</p>
                <p className="mt-1 text-xs leading-relaxed text-parchment/85">
                  أنت من ارتكب الجريمة. تصرّف كبريء، أنكر بذكاء، ولا تدع أحدًا يكتشفك حتى آخر تصويت.
                </p>
              </div>
            )}

            <div className="mb-1 flex items-baseline justify-between">
              <h2 className="text-2xl font-bold text-parchment">{character.name}</h2>
              <span className="text-sm text-muted">{character.age} سنة</span>
            </div>
            <p className="mb-4 text-sm font-semibold text-brass-300">{character.occupation}</p>

            <div className="space-y-3.5">
              <Field label="علاقتك بالضحية">{character.relationship}</Field>
              <Field label="شخصيتك">{character.personality}</Field>
              <Field label="قصتك">{character.story}</Field>
              <Field label="تصريحك العلني">«{character.statement}»</Field>
              <div className="rounded-xl border border-brass-500/25 bg-ink-900/60 p-3">
                <p className="mb-1 text-xs font-bold text-brass-300">سرّك (لا تُفصح عنه)</p>
                <p className="text-[15px] leading-relaxed text-parchment">{character.secret}</p>
              </div>
            </div>
          </motion.div>

          <div className="mt-4">
            <Button variant="danger" full onClick={nextReveal}>
              {isLast ? 'أخفِ الشخصية — ابدأ القضية' : 'أخفِ وسلّم للاعب التالي'}
            </Button>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}
