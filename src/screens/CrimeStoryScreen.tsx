import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { Button, Eyebrow, ScreenShell } from '../components/ui';

export default function CrimeStoryScreen() {
  const { selectedCase, beginInvestigation } = useGame();
  if (!selectedCase) return null;

  return (
    <ScreenShell>
      <div className="mb-4 text-center">
        <Eyebrow>ملف القضية</Eyebrow>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-display text-4xl gold-text leading-tight"
      >
        {selectedCase.title}
      </motion.h1>

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
