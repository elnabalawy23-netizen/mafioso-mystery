import { CASE_ICON } from '../data/caseArt';

// Auto-detect case images dropped into src/assets/cases/<id>.{webp,jpg,png}.
// Vite hashes & optimizes them; when a file is added it just appears — no code
// change needed. Until then, each case shows a themed placeholder.
const images = import.meta.glob('../assets/cases/*.{webp,jpg,jpeg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byId: Record<string, string> = {};
for (const path in images) {
  const m = path.match(/([^/]+)\.\w+$/);
  if (m) byId[m[1]] = images[path];
}

export function CaseArt({ caseId, className = '' }: { caseId: string; className?: string }) {
  const src = byId[caseId];
  if (src) {
    return <img src={src} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-brass-500/20 via-ink-800/50 to-ink-950 ${className}`}
    >
      <span className="text-4xl opacity-80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
        {CASE_ICON[caseId] ?? '🔍'}
      </span>
    </div>
  );
}
