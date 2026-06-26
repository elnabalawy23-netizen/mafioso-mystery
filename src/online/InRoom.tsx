import { useEffect, useState } from 'react';
import { useOnline } from './OnlineContext';
import { Button, Eyebrow, Field, ScreenShell, TextSizeControl } from '../components/ui';
import { CaseArt } from '../components/CaseArt';
import { TEXT_SIZES, useTextScale } from '../game/useTextScale';
import { play } from '../audio/sound';

export function InRoom() {
  const { view } = useOnline();
  if (!view) return null;
  switch (view.phase) {
    case 'lobby':
      return <Lobby />;
    case 'roles':
      return <Roles />;
    case 'clues':
      return <Clues />;
    case 'voting':
      return <Voting />;
    case 'wrong':
      return <Wrong />;
    case 'solved':
    case 'final':
      return <Result />;
    default:
      return null;
  }
}

function Lobby() {
  const { view, start, leave, busy } = useOnline();
  const v = view!;
  const isHost = !!v.you?.isHost;
  const enough = v.players.length >= 4;
  return (
    <ScreenShell>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={leave} className="px-4 py-2 text-sm">
          اخرج
        </Button>
        <Eyebrow>غرفة اللعب</Eyebrow>
      </div>
      <div className="relative mb-4 h-24 shrink-0 overflow-hidden rounded-2xl border border-white/10">
        <CaseArt caseId={v.case.id} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/25 to-transparent" />
        <p className="absolute bottom-2 right-3 font-bold text-parchment drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
          {v.case.title}
        </p>
      </div>
      <div className="mb-5 rounded-2xl border border-brass-500/40 bg-brass-500/10 p-4 text-center">
        <p className="text-xs text-muted">كود الغرفة</p>
        <p className="text-4xl font-bold tracking-[0.3em] text-brass-200">{v.code}</p>
        <p className="mt-1 text-xs text-muted">ابعت الكود لأصحابك عشان يدخلوا من موبايلهم</p>
      </div>
      <p className="mb-2 text-sm text-muted">اللاعبين ({v.players.length}):</p>
      <div className="flex-1 space-y-2 overflow-y-auto scroll-thin">
        {v.players.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-800/60 px-4 py-3">
            <span className={`h-2 w-2 shrink-0 rounded-full ${p.connected ? 'bg-emerald-400' : 'bg-white/20'}`} />
            <span className="flex-1 text-parchment">
              {p.name}
              {p.id === v.you?.id ? ' (إنت)' : ''}
            </span>
            {p.isHost && <span className="text-xs text-brass-300">المنظّم</span>}
            <span className="text-sm text-muted">{p.gender === 'female' ? '♀' : '♂'}</span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        {isHost ? (
          <>
            <Button full disabled={!enough || busy} onClick={start}>
              {busy ? 'لحظة…' : 'ابدأ اللعبة'}
            </Button>
            {!enough && <p className="mt-2 text-center text-xs text-muted">محتاجين ٤ لاعبين على الأقل</p>}
          </>
        ) : (
          <p className="text-center text-sm text-muted">مستنيين المنظّم يبدأ اللعبة…</p>
        )}
      </div>
    </ScreenShell>
  );
}

function MyCharacterCard() {
  const { view } = useOnline();
  const [lvl, setLvl] = useTextScale();
  const ch = view!.myCharacter;
  if (!ch) return null;
  return (
    <>
      <TextSizeControl level={lvl} onChange={setLvl} />
      <div className="panel flex-1 overflow-y-auto scroll-thin p-5" style={{ fontSize: `${TEXT_SIZES[lvl]}px` }}>
        {ch.amICulprit && (
          <div className="mb-4 rounded-xl border border-blood-500/50 bg-blood-500/12 p-3 text-center shadow-bloodglow">
            <p className="text-[0.92em] font-bold text-blood-400">إنت المجرم</p>
            <p className="mt-1 text-[0.82em] leading-relaxed text-parchment/85">
              اتصرّف كأنك بريء، أنكر بذكا، وما تخليش حد يكتشفك لحد آخر تصويت.
            </p>
          </div>
        )}
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <h2 className="text-[1.55em] font-bold leading-tight text-parchment">{ch.name}</h2>
          <span className="shrink-0 text-[0.82em] text-muted">{ch.age} سنة</span>
        </div>
        <p className="mb-4 text-[0.95em] font-semibold text-brass-300">{ch.occupation}</p>
        <div className="space-y-3.5">
          <Field label="علاقتك بالضحية">{ch.relationship}</Field>
          <Field label="شخصيتك">{ch.personality}</Field>
          <Field label="قصتك">{ch.story}</Field>
          <Field label="كلامك قدام الكل">«{ch.statement}»</Field>
          <div className="rounded-xl border border-brass-500/25 bg-ink-900/60 p-3">
            <p className="mb-1 text-[0.8em] font-bold text-brass-300">سرّك (ما تقولهوش لحد)</p>
            <p className="text-[1.05em] leading-relaxed text-parchment">{ch.secret}</p>
          </div>
        </div>
      </div>
    </>
  );
}

function Roles() {
  const { view, begin, busy } = useOnline();
  const isHost = !!view!.you?.isHost;
  useEffect(() => {
    play(view!.myCharacter?.amICulprit ? 'culprit' : 'reveal');
  }, []);
  return (
    <ScreenShell>
      <div className="mb-3 text-center">
        <Eyebrow>دي شخصيتك السرية</Eyebrow>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <MyCharacterCard />
      </div>
      <div className="mt-4">
        {isHost ? (
          <Button full variant="danger" disabled={busy} onClick={begin}>
            {busy ? 'لحظة…' : 'ابدأوا التحقيق'}
          </Button>
        ) : (
          <p className="text-center text-sm text-muted">احفظ شخصيتك كويس… مستنيين المنظّم يبدأ التحقيق.</p>
        )}
      </div>
    </ScreenShell>
  );
}

/** A persistent strip of who's already been voted out (all innocent). */
function EjectedStrip() {
  const { view } = useOnline();
  const ejected = view?.ejected ?? [];
  if (ejected.length === 0) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-ink-800/40 px-3 py-2">
      <span className="text-[11px] font-semibold text-muted">طلعوا (أبرياء):</span>
      {ejected.map((e, i) => (
        <span key={i} className="rounded-full bg-blood-500/12 px-2 py-0.5 text-[11px] text-blood-300/90">
          💀 {e.playerName} <span className="text-muted">({e.characterName})</span>
        </span>
      ))}
    </div>
  );
}

function Clues() {
  const { view, revealClue, openVote, busy } = useOnline();
  const v = view!;
  const moreClues = v.revealedClues < v.totalClues;
  const isHost = !!v.you?.isHost;
  const [showChar, setShowChar] = useState(false);
  useEffect(() => {
    play('clue');
  }, [v.revealedClues]);
  return (
    <ScreenShell>
      <div className="mb-3 flex items-center justify-between">
        <Eyebrow>الأدلة</Eyebrow>
        <button onClick={() => setShowChar((s) => !s)} className="text-xs text-brass-300 hover:text-brass-200">
          {showChar ? '× إخفاء' : 'افتكر شخصيتي'}
        </button>
      </div>
      {!showChar && <EjectedStrip />}
      {showChar ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <MyCharacterCard />
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto scroll-thin">
          {v.clues.map((cl, i) => (
            <div
              key={cl.id}
              className={`rounded-xl border p-4 ${
                i === v.clues.length - 1 ? 'border-brass-500/50 bg-brass-500/8' : 'border-white/10 bg-ink-800/50'
              }`}
            >
              <p className="mb-1 text-xs text-muted">
                دليل {i + 1} من {v.totalClues}
              </p>
              <h3 className="mb-1 font-bold text-brass-300">{cl.title}</h3>
              <p className="text-[15px] leading-loose text-parchment">{cl.text}</p>
            </div>
          ))}
          <p className="pt-1 text-center text-xs text-muted">اتناقشوا على المكالمة… مين المشتبه فيه؟</p>
        </div>
      )}
      <div className="mt-4 space-y-2">
        {isHost ? (
          <>
            {moreClues && (
              <Button full variant="outline" disabled={busy} onClick={revealClue}>
                🔍 اكشف الدليل اللي بعده
              </Button>
            )}
            <Button full disabled={busy} onClick={openVote}>
              يلا نصوّت على المتهم
            </Button>
          </>
        ) : (
          <p className="text-center text-sm text-muted">
            {moreClues ? 'مستنيين المنظّم يكشف أدلة أكتر أو يفتح التصويت…' : 'مستنيين المنظّم يفتح التصويت…'}
          </p>
        )}
      </div>
    </ScreenShell>
  );
}

function Voting() {
  const { view, vote, resolve, busy } = useOnline();
  const v = view!;
  const isHost = !!v.you?.isHost;
  const iAmOut = !!v.you?.eliminated;
  const allVoted = v.eligibleVoters > 0 && v.votesIn >= v.eligibleVoters;
  return (
    <ScreenShell>
      <div className="mb-2 text-center">
        <Eyebrow>التصويت</Eyebrow>
      </div>
      <p className="mb-3 text-center text-sm text-muted">
        مين المجرم؟ أكتر حد تصوّتوا عليه يطلع من اللعبة. ({v.votesIn} من {v.eligibleVoters} صوّتوا)
      </p>
      <EjectedStrip />
      {iAmOut ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-muted">
          <div className="mb-3 text-5xl">💀</div>
          <p className="text-sm">إنت طلعت من اللعبة — اتفرّج على باقي التصويت.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto scroll-thin">
          {v.suspects.map((s) => (
            <button
              key={s.id}
              onClick={() => vote(s.id)}
              disabled={busy}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-right transition ${
                v.myVote === s.id
                  ? 'border-blood-500/70 bg-blood-500/15 text-parchment'
                  : 'border-white/10 bg-ink-800/60 text-parchment/90 hover:border-blood-500/30'
              }`}
            >
              <span>
                <span className="text-sm font-semibold">{s.name}</span>{' '}
                <span className="text-xs text-muted">— {s.occupation}</span>
              </span>
              <span className="shrink-0 text-sm text-muted">
                {s.gender === 'female' ? '♀' : '♂'}
                {v.myVote === s.id ? ' ✓' : ''}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-4">
        {isHost ? (
          <Button full variant="danger" disabled={busy || !allVoted} onClick={resolve}>
            {allVoted ? 'اعرفوا مين طلع' : `مستنيين الكل يصوّت (${v.votesIn}/${v.eligibleVoters})`}
          </Button>
        ) : (
          <p className="text-center text-sm text-muted">
            {iAmOut
              ? 'إنت برّه — مستنيين الباقيين.'
              : v.myVote
                ? 'صوتك اتسجّل… لازم كل واحد يصوّت قبل ما تظهر النتيجة.'
                : 'اختار مين المتهم.'}
          </p>
        )}
      </div>
    </ScreenShell>
  );
}

function Wrong() {
  const { view, next, busy } = useOnline();
  const v = view!;
  const isHost = !!v.you?.isHost;
  const ej = v.lastEjected;
  const iWasOut = !!v.you?.eliminated;
  useEffect(() => {
    play('wrong');
  }, []);
  return (
    <ScreenShell center>
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-blood-500/40 bg-blood-500/10 text-4xl">
          💀
        </div>
        <h1 className="mb-2 text-2xl font-bold text-blood-400">طلع بريء!</h1>
        {ej && (
          <p className="text-base text-parchment">
            <span className="font-bold">{ej.playerName}</span> طلع من اللعبة — وطلع إنه كان{' '}
            <span className="text-brass-300">{ej.characterName}</span> البريء.
          </p>
        )}
        <p className="mt-2 text-sm text-muted">
          {iWasOut ? 'إنت اللي طلعت! اتفرّج وانتوا بتكملوا.' : 'المجرم لسه معاكم… كمّلوا التحقيق وصوّتوا تاني.'}
        </p>
      </div>
      <div className="mt-8 w-full">
        {isHost ? (
          <Button full disabled={busy} onClick={next}>
            كمّلوا الجولة الجاية
          </Button>
        ) : (
          <p className="text-center text-sm text-muted">مستنيين المنظّم…</p>
        )}
      </div>
    </ScreenShell>
  );
}

function Result() {
  const { view, again, leave, busy } = useOnline();
  const v = view!;
  const isHost = !!v.you?.isHost;
  const sol = v.solution;
  const solved = v.phase === 'solved';
  const escaped = !!sol?.escaped;
  useEffect(() => {
    play(solved ? 'correct' : 'wrong');
  }, []);
  return (
    <ScreenShell>
      <div className="mb-4 text-center">
        <div
          className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border text-3xl ${
            solved ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-blood-500/40 bg-blood-500/10'
          }`}
        >
          {solved ? '🎉' : escaped ? '🏃' : '🔍'}
        </div>
        <h1 className={`text-2xl font-bold ${solved ? 'text-emerald-400' : 'text-blood-400'}`}>
          {solved ? 'برافو! مسكتوا المجرم' : escaped ? 'المجرم هرب منكم!' : 'الحقيقة اتكشفت'}
        </h1>
        {!solved && escaped && (
          <p className="mt-1 text-sm text-muted">طلّعتوا كل الأبرياء وفضل هو لوحده… المرة الجاية ركّزوا أكتر.</p>
        )}
      </div>
      {sol && (
        <div className="flex-1 space-y-4 overflow-y-auto scroll-thin">
          <div className="rounded-2xl border border-blood-500/40 bg-blood-500/10 p-4 text-center">
            <p className="text-xs text-muted">المجرم كان</p>
            <p className="text-xl font-bold text-blood-300">{sol.criminalName}</p>
            {sol.culpritPlayerName && <p className="mt-1 text-sm text-parchment">({sol.culpritPlayerName})</p>}
          </div>
          <div className="rounded-xl border border-white/10 bg-ink-800/50 p-4">
            <p className="mb-1 text-xs font-bold text-brass-300">الحكاية كاملة</p>
            <p className="text-[15px] leading-loose text-parchment/95">{sol.explanation}</p>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted">مين كان مين:</p>
            <div className="space-y-1">
              {sol.cast.map((c, i) => (
                <div key={i} className="flex justify-between rounded-lg bg-ink-800/40 px-3 py-2 text-sm">
                  <span className="text-parchment">{c.playerName}</span>
                  <span className="text-muted">
                    {c.characterName}
                    {c.characterId === sol.criminalId ? ' — المجرم' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="mt-4 space-y-2">
        {isHost ? (
          <Button full disabled={busy} onClick={again}>
            نلعب تاني (نفس اللاعبين)
          </Button>
        ) : (
          <p className="text-center text-sm text-muted">مستنيين المنظّم لو هتلعبوا تاني…</p>
        )}
        <Button full variant="ghost" onClick={leave}>
          اخرج من الغرفة
        </Button>
      </div>
    </ScreenShell>
  );
}
