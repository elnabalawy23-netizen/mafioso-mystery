import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TEXT_SIZES } from '../game/useTextScale';
import type { Gender } from '../types';

type Variant = 'primary' | 'ghost' | 'danger' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-brass-300 to-brass-500 text-ink-950 font-bold shadow-glow hover:from-brass-300 hover:to-brass-400',
  danger:
    'bg-gradient-to-b from-blood-400 to-blood-600 text-white font-bold shadow-bloodglow hover:brightness-110',
  ghost: 'bg-ink-700/70 text-parchment border border-white/10 hover:bg-ink-600/70',
  outline: 'bg-transparent text-brass-300 border border-brass-500/50 hover:bg-brass-500/10',
};

export function Button({ variant = 'primary', full, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={`btn-press rounded-2xl px-6 py-3.5 text-base leading-none transition disabled:cursor-not-allowed disabled:opacity-40 ${
        variants[variant]
      } ${full ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export function ScreenShell({
  children,
  className = '',
  center = false,
}: {
  children: ReactNode;
  className?: string;
  center?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 ${
        center ? 'justify-center' : ''
      } pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-brass-500/40 bg-brass-500/10 px-3 py-1 text-xs font-semibold tracking-widest text-brass-300">
      {children}
    </span>
  );
}

export function Divider() {
  return <div className="hairline my-5" />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[0.78em] font-semibold text-muted">{label}</p>
      <p className="text-[1em] leading-relaxed text-parchment">{children}</p>
    </div>
  );
}

/** Easy font-size picker (عادي / كبير / أكبر) shown as growing "أ" glyphs. */
export function TextSizeControl({
  level,
  onChange,
}: {
  level: number;
  onChange: (level: number) => void;
}) {
  const labels = ['عادي', 'كبير', 'أكبر'];
  return (
    <div className="mb-3 flex items-center justify-center gap-2">
      <span className="text-xs text-muted">حجم الخط</span>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-brass-500/30 bg-ink-800/50">
        {TEXT_SIZES.map((px, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            aria-label={`حجم الخط ${labels[i]}`}
            aria-pressed={i === level}
            className={`btn-press flex h-9 w-12 items-center justify-center leading-none transition ${
              i > 0 ? 'border-s border-brass-500/20' : ''
            } ${i === level ? 'bg-brass-500/25 font-bold text-brass-200' : 'text-muted hover:text-parchment'}`}
            style={{ fontSize: `${px}px` }}
          >
            أ
          </button>
        ))}
      </div>
    </div>
  );
}

export function Stepper({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current ? 'w-6 bg-brass-400' : i < current ? 'w-2 bg-brass-600/70' : 'w-2 bg-white/15'
          }`}
        />
      ))}
    </div>
  );
}

/** Two-option picker used on the setup screens — symbol + a clear label. */
export function GenderToggle({ gender, onChange }: { gender: Gender; onChange: (g: Gender) => void }) {
  const opts: { g: Gender; sym: string; label: string; active: string }[] = [
    { g: 'male', sym: '♂', label: 'ولد', active: 'bg-sky-500/25 text-sky-300' },
    { g: 'female', sym: '♀', label: 'بنت', active: 'bg-pink-500/25 text-pink-300' },
  ];
  return (
    <div className="flex shrink-0 overflow-hidden rounded-xl border border-white/10">
      {opts.map((o) => (
        <button
          key={o.g}
          type="button"
          onClick={() => onChange(o.g)}
          aria-label={o.label}
          aria-pressed={gender === o.g}
          className={`flex h-12 w-12 flex-col items-center justify-center leading-none transition ${
            gender === o.g ? o.active : 'text-muted hover:text-parchment'
          }`}
        >
          <span className="text-lg">{o.sym}</span>
          <span className="mt-0.5 text-[10px] font-semibold">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
