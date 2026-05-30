import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

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
      <p className="mb-1 text-xs font-semibold text-muted">{label}</p>
      <p className="text-[15px] leading-relaxed text-parchment">{children}</p>
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
