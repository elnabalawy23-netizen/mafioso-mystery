import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { Button, Eyebrow, ScreenShell } from '../components/ui';

export default function FinalExplanationScreen() {
  const { selectedCase, assignments, go } = useGame();
  if (!selectedCase) return null;

  const criminal = selectedCase.characters.find((c) => c.id === selectedCase.criminalId);
  const playerByCharacter = new Map(assignments.map((a) => [a.character.id, a.player]));

  return (
    <ScreenShell>
      <div className="mb-4 text-center">
        <Eyebrow>الحل الكامل</Eyebrow>
        <h1 className="mt-3 font-display text-3xl gold-text leading-tight">{selectedCase.title}</h1>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin pb-2">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel mb-4 border-blood-500/30 p-5"
        >
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-blood-400">
            <span className="text-lg">🔪</span> المجرم: {criminal?.name}
          </p>
          <p className="text-[15px] leading-loose text-parchment/95">{selectedCase.finalExplanation}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="panel p-5"
        >
          <p className="mb-3 text-sm font-bold text-brass-300">أسرار جميع الشخصيات</p>
          <div className="space-y-3">
            {selectedCase.characters.map((c) => (
              <div
                key={c.id}
                className={`rounded-xl border p-3 ${
                  c.isCriminal
                    ? 'border-blood-500/40 bg-blood-500/8'
                    : 'border-white/8 bg-ink-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-bold text-parchment">
                    {c.name}
                    {playerByCharacter.has(c.id) && (
                      <span className="mr-2 text-[11px] font-normal text-brass-300">
                        ({playerByCharacter.get(c.id)})
                      </span>
                    )}
                  </p>
                  {c.isCriminal ? (
                    <span className="rounded-full bg-blood-500/25 px-2 py-0.5 text-[10px] font-bold text-blood-400">
                      المجرم
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-muted">
                      بريء
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{c.secret}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="mt-4">
        <Button full onClick={() => go('again')}>
          إنهاء القضية
        </Button>
      </div>
    </ScreenShell>
  );
}
