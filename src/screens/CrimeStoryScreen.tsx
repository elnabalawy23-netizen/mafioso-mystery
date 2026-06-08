import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { Button, Eyebrow, ScreenShell } from '../components/ui';
import { CaseArt } from '../components/CaseArt';

export default function CrimeStoryScreen() {
  const { selectedCase, beginInvestigation } = useGame();
  if (!selectedCase) return null;

  return (
    <ScreenShell>
      <div className="mb-3 text-center">
        <Eyebrow>ملف القضية</Eyebrow>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-44 shrink-0 overflow-hidden rounded-2xl border border-white/10"
      >
        <CaseArt caseId={selectedCase.id} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
        <h1 className="absolute inset-x-0 bottom-0 p-4 text-center font-display text-3xl gold-text leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          {selectedCase.title}
        </h1>
      </motion.div>

      <div className="flex-1 overflow-y-auto scroll-thin py-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="panel mb-4 border-blood-500/30 p-5"
        >
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-blood-400">
            <span className="text-lg">⚰</span> الضحية
          </p>
          <p className="text-[15px] leading-relaxed text-parchment">{selectedCase.victim}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="panel p-5"
        >
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-brass-300">
            <span className="text-lg">📖</span> تفاصيل الجريمة
          </p>
          <p className="text-[15px] leading-relaxed text-parchment/95">{selectedCase.description}</p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 text-center font-serif text-base italic text-muted"
        >
          القاتل وسطيكم دلوقتي… دوّروا على الحقيقة.
        </motion.p>
      </div>

      <Button full onClick={beginInvestigation}>
        يلا نبدأ التحقيق والنقاش
      </Button>
    </ScreenShell>
  );
}
