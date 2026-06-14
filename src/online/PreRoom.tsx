import { useState } from 'react';
import { useOnline } from './OnlineContext';
import { casesByDifficulty, DIFFICULTIES, getCaseById, type CaseOrder } from '../data/cases';
import { Button, Eyebrow, GenderToggle, MuteButton, ScreenShell } from '../components/ui';
import { CaseCard, DIFFICULTY_STYLE } from '../components/CaseCard';
import type { Difficulty, Gender } from '../types';

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
      <div className="mt-6 flex justify-center">
        <MuteButton />
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
  const [active, setActive] = useState<Difficulty>('easy');
  const [order, setOrder] = useState<CaseOrder>('newest');
  const [caseId, setCaseId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const cases = casesByDifficulty(active, order);
  const selected = caseId ? getCaseById(caseId) : null;
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
      <p className="mb-3 text-sm text-muted">إنت المنظّم — اختار القضية واكتب اسمك.</p>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {DIFFICULTIES.map(({ key, label }) => {
          const isActive = key === active;
          const count = casesByDifficulty(key).length;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`btn-press rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? DIFFICULTY_STYLE[key].active : 'border-white/10 bg-white/5 text-muted hover:text-parchment'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${DIFFICULTY_STYLE[key].dot}`} />
                {label}
              </span>
              <span className="mt-0.5 block text-[11px] font-normal opacity-70">{count} قضايا</span>
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-muted">ترتيب القضايا</span>
        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-ink-800/50">
          {(
            [
              { key: 'newest', label: 'الأحدث الأول' },
              { key: 'oldest', label: 'الأقدم الأول' },
            ] as { key: CaseOrder; label: string }[]
          ).map((o) => (
            <button
              key={o.key}
              onClick={() => setOrder(o.key)}
              aria-pressed={order === o.key}
              className={`btn-press px-3 py-2 text-xs font-semibold transition ${
                order === o.key ? 'bg-brass-500/25 text-brass-200' : 'text-muted hover:text-parchment'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto scroll-thin pb-2">
        {cases.map((c, i) => (
          <CaseCard key={c.id} caseData={c} index={i} selected={caseId === c.id} onClick={() => setCaseId(c.id)} />
        ))}
      </div>

      <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
        {selected && (
          <p className="text-center text-xs text-muted">
            القضية: <span className="font-semibold text-brass-300">{selected.title}</span>
          </p>
        )}
        <NameAndGender name={name} gender={gender} onName={setName} onGender={setGender} />
        {error && <p className="text-center text-xs text-blood-400">{error}</p>}
        <Button full disabled={!ready || busy} onClick={() => caseId && create(caseId, name.trim(), gender)}>
          {busy ? 'لحظة…' : selected ? `اعمل غرفة — ${selected.title}` : 'اختار قضية الأول'}
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
