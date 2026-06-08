import { useState } from 'react';
import { useOnline } from './OnlineContext';
import { casesByDifficulty, DIFFICULTIES, difficultyLabel } from '../data/cases';
import { Button, Eyebrow, GenderToggle, ScreenShell } from '../components/ui';
import type { Gender } from '../types';

export function PreRoom({ onExit }: { onExit: () => void }) {
  const { screen } = useOnline();
  if (screen === 'create') return <CreateRoom />;
  if (screen === 'join') return <JoinRoom />;
  return <Menu onExit={onExit} />;
}

function Menu({ onExit }: { onExit: () => void }) {
  const { setScreen } = useOnline();
  return (
    <ScreenShell center>
      <div className="mb-8 text-center">
        <h1 className="font-display text-5xl gold-text leading-none">أونلاين</h1>
        <p className="mt-3 text-sm text-muted">كل واحد يلعب من موبايله، وتتكلموا على مكالمة عادية جنبها.</p>
      </div>
      <div className="space-y-3">
        <Button full onClick={() => setScreen('create')}>
          اعمل غرفة جديدة
        </Button>
        <Button full variant="ghost" onClick={() => setScreen('join')}>
          ادخل بكود
        </Button>
        <button onClick={onExit} className="mt-2 w-full text-center text-sm text-muted hover:text-parchment">
          ← رجوع للّعب على موبايل واحد
        </button>
      </div>
    </ScreenShell>
  );
}

function NameAndGender({
  name,
  gender,
  onName,
  onGender,
}: {
  name: string;
  gender: Gender;
  onName: (v: string) => void;
  onGender: (g: Gender) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        placeholder="اسمك"
        className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-800/80 px-3 text-parchment outline-none transition focus:border-brass-500/60"
      />
      <GenderToggle gender={gender} onChange={onGender} />
    </div>
  );
}

function CreateRoom() {
  const { setScreen, create, busy, error } = useOnline();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const ready = !!caseId && name.trim().length > 0;

  return (
    <ScreenShell>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setScreen('menu')} className="px-4 py-2 text-sm">
          رجوع
        </Button>
        <Eyebrow>غرفة جديدة</Eyebrow>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-parchment">اختار القضية</h1>
      <p className="mb-4 text-sm text-muted">إنت المنظّم — اختار القضية واكتب اسمك.</p>

      <div className="flex-1 space-y-4 overflow-y-auto scroll-thin pb-2">
        {DIFFICULTIES.map((d) => (
          <div key={d.key}>
            <p className="mb-2 text-xs font-bold tracking-widest text-brass-300">{difficultyLabel(d.key)}</p>
            <div className="space-y-2">
              {casesByDifficulty(d.key).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCaseId(c.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-right transition ${
                    caseId === c.id
                      ? 'border-brass-500/70 bg-brass-500/15 text-parchment'
                      : 'border-white/10 bg-ink-800/60 text-parchment/90 hover:border-brass-500/30'
                  }`}
                >
                  <span className="text-sm font-semibold">{c.title}</span>
                  {caseId === c.id && <span className="text-brass-300">✓</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <NameAndGender name={name} gender={gender} onName={setName} onGender={setGender} />
        {error && <p className="text-center text-xs text-blood-400">{error}</p>}
        <Button full disabled={!ready || busy} onClick={() => caseId && create(caseId, name.trim(), gender)}>
          {busy ? 'لحظة…' : 'اعمل الغرفة'}
        </Button>
      </div>
    </ScreenShell>
  );
}

function JoinRoom() {
  const { setScreen, join, busy, error } = useOnline();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const ready = code.trim().length >= 4 && name.trim().length > 0;

  return (
    <ScreenShell>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setScreen('menu')} className="px-4 py-2 text-sm">
          رجوع
        </Button>
        <Eyebrow>دخول بكود</Eyebrow>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-parchment">ادخل الغرفة</h1>
      <p className="mb-5 text-sm text-muted">اكتب الكود اللي وصلك من المنظّم.</p>

      <div className="space-y-4">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
          placeholder="الكود"
          inputMode="text"
          autoCapitalize="characters"
          className="h-16 w-full rounded-2xl border border-brass-500/40 bg-ink-800/80 text-center text-3xl font-bold tracking-[0.4em] text-brass-200 outline-none focus:border-brass-500/80"
        />
        <NameAndGender name={name} gender={gender} onName={setName} onGender={setGender} />
        {error && <p className="text-center text-xs text-blood-400">{error}</p>}
        <Button full disabled={!ready || busy} onClick={() => join(code.trim(), name.trim(), gender)}>
          {busy ? 'لحظة…' : 'ادخل'}
        </Button>
      </div>
    </ScreenShell>
  );
}
