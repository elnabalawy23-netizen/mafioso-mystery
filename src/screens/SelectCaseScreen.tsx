import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { CASES } from '../data/cases';
import { Button, Eyebrow, ScreenShell } from '../components/ui';

export default function SelectCaseScreen() {
  const { chooseCase, go } = useGame();

  return (
    <ScreenShell>
      <div className="mb-5 flex items-center justify-between">
        <Button variant="ghost" onClick={() => go('home')} className="px-4 py-2 text-sm">
          رجوع
        </Button>
        <Eyebrow>اختر القضية</Eyebrow>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-parchment">ملفات القضايا</h1>
      <p className="mb-5 text-sm text-muted">خمس جرائم غامضة بانتظار من يحلّها.</p>

      <div className="flex-1 space-y-4 overflow-y-auto scroll-thin pb-2">
        {CASES.map((c, i) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => chooseCase(c)}
            className="panel block w-full overflow-hidden p-0 text-right"
          >
            <div className="flex items-stretch">
              <div className="flex w-14 shrink-0 items-center justify-center bg-gradient-to-b from-brass-500/20 to-transparent font-display text-3xl text-brass-300">
                {i + 1}
              </div>
              <div className="flex-1 p-4">
                <p className="mb-1 text-[11px] font-semibold tracking-wider text-brass-300/80">
                  {c.theme}
                </p>
                <h3 className="text-lg font-bold leading-snug text-parchment">{c.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                  {c.description}
                </p>
                <div className="mt-3 flex gap-2 text-[11px]">
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-parchment/80">
                    {c.characters.length} شخصيات
                  </span>
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-parchment/80">
                    {c.clues.length} أدلة
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </ScreenShell>
  );
}
