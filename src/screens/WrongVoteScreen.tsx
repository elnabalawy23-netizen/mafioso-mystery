import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { Button, ScreenShell } from '../components/ui';
import { play } from '../audio/sound';

export default function WrongVoteScreen() {
  const { selectedCase, clues, assignments, lastAccusedId, revealedClues, wrongAttempts, continueAfterWrong } =
    useGame();
  useEffect(() => {
    play('wrong');
  }, []);
  if (!selectedCase) return null;

  const accusedAssignment = assignments.find((a) => a.character.id === lastAccusedId);
  const accused = accusedAssignment?.character;
  const accusedPlayer = accusedAssignment?.player;
  const hasMore = revealedClues < clues.length;

  return (
    <ScreenShell center>
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, -10, 10, -8, 8, 0] }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-blood-500/50 bg-blood-500/10 text-5xl text-blood-400">
          ✕
        </div>
        <p className="text-sm tracking-widest text-muted">اتهام غلط</p>
        <h1 className="my-2 text-3xl font-bold text-parchment">
          {accusedPlayer ? `${accusedPlayer} بريء` : 'غلطتوا'}
        </h1>
        {accused && (
          <p className="-mt-1 mb-2 text-sm text-brass-300">كان بيلعب دور: {accused.name}</p>
        )}
        <p className="max-w-xs text-sm leading-relaxed text-muted">
          المجرم الحقيقي لسه بينكم… وفلت من العقاب المرة دي.
        </p>
      </motion.div>

      {accused && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="panel mt-6 w-full p-4"
        >
          <p className="mb-1 text-xs font-bold text-brass-300">ليه {accused.name} كان شكله مريب؟</p>
          <p className="text-[14px] leading-relaxed text-parchment/90">{accused.secret}</p>
          <p className="mt-2 text-[13px] italic text-muted">
            سر حقيقي… بس مش دافع للقتل. الخيوط ساعات بتضحك عليك.
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 w-full space-y-2"
      >
        <Button full onClick={continueAfterWrong}>
          {hasMore ? '🔍 اكشفوا دليل جديد' : 'ارجعوا للنقاش وصوّتوا تاني'}
        </Button>
        <p className="text-center text-xs text-muted">
          محاولات غلط: {wrongAttempts}
          {!hasMore && ' — الأدلة خلصت، اعتمدوا على ذكاؤكم'}
        </p>
      </motion.div>
    </ScreenShell>
  );
}
