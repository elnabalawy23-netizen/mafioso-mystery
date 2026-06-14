import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { useAppMode } from '../game/appMode';
import { Button, MuteButton, ScreenShell } from '../components/ui';

const howTo = [
  'اختاروا القضية، وبعدين اكتبوا أسامي اللاعبين (من ٤ لـ ٨ لاعبين).',
  'مرّروا الموبايل لكل لاعب لوحده عشان يشوف شخصيته السرية.',
  'واحد فيكم هو المجرم… والباقي كلهم أبرياء وكل واحد عارف قصته بس.',
  'الأدلة بتظهر واحد ورا التاني، اتناقشوا وبعدين صوّتوا على المتهم.',
  'لو غلطتوا يظهر دليل جديد، ولو صحّ تطلع الحقيقة كلها.',
];

export default function HomeScreen() {
  const { go } = useGame();
  const { goOnline } = useAppMode();

  return (
    <ScreenShell>
      <div className="flex justify-end">
        <MuteButton />
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 text-center"
        >
          <h1 className="font-display text-6xl gold-text leading-none">مفيوزو</h1>
          <p className="mt-2 font-serif text-base text-muted">مين فيكم بيخبّي الحقيقة؟</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="panel mt-6 p-5"
        >
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-brass-300">
            <span className="text-lg">◆</span> بتتلعب إزاي؟
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
            العبوا على موبايل واحد
          </Button>
          <Button full variant="outline" onClick={goOnline}>
            العبوا أونلاين — كل واحد على موبايله
          </Button>
          <p className="text-center text-xs text-muted">
            لعبة تحقيق جماعية — مع بعض في نفس المكان، أو كل واحد من مكانه
          </p>
        </motion.div>
      </div>
    </ScreenShell>
  );
}
