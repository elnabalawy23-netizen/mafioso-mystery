import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { Button, ScreenShell } from '../components/ui';

export default function CorrectVoteScreen() {
  const { selectedCase, criminalId, assignments, revealTruth, wrongAttempts } = useGame();
  if (!selectedCase) return null;

  const criminal = selectedCase.characters.find((c) => c.id === criminalId);
  if (!criminal) return null;
  const criminalPlayer = assignments.find((a) => a.character.id === criminal.id)?.player;

  return (
    <ScreenShell center>
      {/* red flash burst */}
      <motion.div
        initial={{ opacity: 0.7, scale: 0 }}
        animate={{ opacity: 0, scale: 3 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
        className="pointer-events-none fixed left-1/2 top-1/3 -z-0 h-40 w-40 -translate-x-1/2 rounded-full bg-blood-500/40 blur-2xl"
      />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center"
      >
        <p className="text-sm tracking-[0.3em] text-brass-300">القضية حُلّت</p>
        <h1 className="mt-1 font-display text-4xl gold-text">أُمسك المجرم</h1>
      </motion.div>

      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotateY: 90 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 13, delay: 0.2 }}
        className="panel mt-5 w-full border-blood-500/50 p-6 text-center shadow-bloodglow"
      >
        <motion.div
          animate={{ boxShadow: ['0 0 0 rgba(231,76,60,0)', '0 0 40px rgba(231,76,60,0.6)', '0 0 0 rgba(231,76,60,0)'] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-blood-500 bg-blood-500/15 text-5xl"
        >
          🔪
        </motion.div>
        {criminalPlayer && (
          <p className="text-sm tracking-widest text-brass-300">{criminalPlayer}</p>
        )}
        <h2 className="mt-1 text-3xl font-bold text-blood-400">{criminal.name}</h2>
        <p className="mt-1 text-sm text-parchment/80">{criminal.occupation}</p>

        <div className="hairline my-4" />

        <p className="mb-1 text-xs font-bold text-brass-300">الدافع</p>
        <p className="text-[14px] leading-relaxed text-parchment/90">{criminal.secret}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 w-full"
      >
        <p className="mb-3 text-center text-sm text-muted">
          {wrongAttempts === 0
            ? 'أداء مذهل! حللتم القضية من أول محاولة.'
            : `حللتم القضية بعد ${wrongAttempts} اتهام خاطئ.`}
        </p>
        <Button full onClick={revealTruth}>
          اعرفوا الحقيقة كاملة
        </Button>
      </motion.div>
    </ScreenShell>
  );
}
