import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { Button, ScreenShell } from '../components/ui';

export default function PlayAgainScreen() {
  const { selectedCase, players, playAgainSameCase, go, resetAll } = useGame();

  return (
    <ScreenShell center>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-brass-500/30 bg-brass-500/10 text-4xl">
          🎩
        </div>
        <h1 className="font-display text-4xl gold-text">خلصت القضية</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          برافو يا محققين. مستعدين لجريمة تانية؟
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-9 w-full space-y-3"
      >
        {selectedCase && players.length > 0 && (
          <Button full onClick={playAgainSameCase}>
            نفس القضية تاني (توزيع جديد)
          </Button>
        )}
        <Button variant="outline" full onClick={() => go('selectCase')}>
          اختاروا قضية تانية
        </Button>
        <Button variant="ghost" full onClick={resetAll}>
          ارجعوا للرئيسية
        </Button>
      </motion.div>
    </ScreenShell>
  );
}
