import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ScreenShell } from '../components/ui';

export default function SplashScreen() {
  const { go } = useGame();

  useEffect(() => {
    const t = setTimeout(() => go('home'), 3200);
    return () => clearTimeout(t);
  }, [go]);

  return (
    <ScreenShell center>
      <button onClick={() => go('home')} className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="relative mb-8 flex h-32 w-32 items-center justify-center"
        >
          <div className="absolute inset-0 animate-floaty rounded-full border border-brass-500/30 bg-brass-500/5 blur-[1px]" />
          <svg viewBox="0 0 100 100" className="h-24 w-24 text-brass-400 drop-shadow-[0_0_18px_rgba(212,175,55,0.5)]">
            <circle cx="42" cy="42" r="26" fill="none" stroke="currentColor" strokeWidth="5" />
            <circle cx="42" cy="42" r="26" fill="rgba(212,175,55,0.08)" />
            <line x1="62" y1="62" x2="86" y2="86" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            <circle cx="36" cy="36" r="6" fill="currentColor" opacity="0.7" />
          </svg>
        </motion.div>

        <motion.h1
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="font-display text-7xl gold-text animate-flicker"
        >
          مفيوزو
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-3 font-serif text-lg text-muted"
        >
          لعبة الجريمة والاستنتاج الغامضة
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0.3, 0.8] }}
          transition={{ delay: 1.6, duration: 2, repeat: Infinity }}
          className="mt-12 text-xs tracking-widest text-brass-300/70"
        >
          اضغط للمتابعة
        </motion.p>
      </button>
    </ScreenShell>
  );
}
