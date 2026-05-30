import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { Button, Eyebrow, ScreenShell } from '../components/ui';

export default function ClueRevealScreen() {
  const { selectedCase, revealedClues, go } = useGame();
  if (!selectedCase) return null;

  const clue = selectedCase.clues[revealedClues - 1];
  if (!clue) return null;

  return (
    <ScreenShell center>
      <div className="mb-6 text-center">
        <Eyebrow>دليل جديد</Eyebrow>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 140, damping: 14 }}
        className="panel relative overflow-hidden p-6"
      >
        {/* shimmering sweep */}
        <motion.div
          initial={{ x: '-120%' }}
          animate={{ x: '120%' }}
          transition={{ delay: 0.2, duration: 0.9, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-brass-300/20 to-transparent"
        />

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brass-500/40 bg-brass-500/10 text-2xl">
            🔍
          </div>
          <div>
            <p className="text-xs text-muted">
              الدليل رقم {revealedClues} من {selectedCase.clues.length}
            </p>
            <h2 className="text-xl font-bold text-brass-300">{clue.title}</h2>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-[16px] leading-loose text-parchment"
        >
          {clue.text}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8"
      >
        <Button full onClick={() => go('discussion')}>
          أضِف الدليل إلى اللوحة
        </Button>
        <p className="mt-3 text-center text-xs text-muted">
          ناقشوا ما يعنيه هذا الدليل قبل التصويت
        </p>
      </motion.div>
    </ScreenShell>
  );
}
