import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { Button, ScreenShell } from '../components/ui';

const howTo = [
  'اختاروا قضية، ثم أدخلوا أسماء اللاعبين (٤ إلى ٨ لاعبين).',
  'يوزّع الهاتف على كل لاعب ليرى شخصيته السرّية بمفرده.',
  'أحدكم هو المجرم… والبقية أبرياء لا يعرفون سوى قصصهم.',
  'تُكشف الأدلة تدريجيًّا، ناقشوا ثم صوّتوا على المتّهم.',
  'إن أخطأتم يُكشف دليل جديد، وإن أصبتم تُروى الحقيقة كاملة.',
];

export default function HomeScreen() {
  const { go } = useGame();

  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 text-center"
        >
          <h1 className="font-display text-6xl gold-text leading-none">مفيوزو</h1>
          <p className="mt-2 font-serif text-base text-muted">من منكم يخفي الحقيقة؟</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="panel mt-6 p-5"
        >
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-brass-300">
            <span className="text-lg">◆</span> كيف تُلعب؟
          </h2>
          <ol className="space-y-2.5">
            {howTo.map((line, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-parchment/90">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brass-500/20 text-xs font-bold text-brass-300">
                  {i + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-7 space-y-3"
        >
          <Button full onClick={() => go('selectCase')}>
            ابدأ التحقيق
          </Button>
          <p className="text-center text-xs text-muted">
            لعبة استنتاج جماعية على هاتف واحد — بلا إنترنت
          </p>
        </motion.div>
      </div>
    </ScreenShell>
  );
}
