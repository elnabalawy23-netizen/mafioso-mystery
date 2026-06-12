import { CASE_ICON } from '../data/caseArt';

// Case art lives in src/assets/cases/<id>.<ext>. Built-in hand-drawn SVG
// posters ship with the app; dropping a raster (webp/jpg/png) with the same
// case id overrides the SVG automatically — no code change needed.
const vectors = import.meta.glob('../assets/cases/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const rasters = import.meta.glob('../assets/cases/*.{webp,jpg,jpeg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byId: Record<string, string> = {};
const idOf = (path: string) => path.match(/([^/]+)\.\w+$/)?.[1];
for (const path in vectors) {
  const id = idOf(path);
  if (id) byId[id] = vectors[path];
}
for (const path in rasters) {
  const id = idOf(path);
  if (id) byId[id] = rasters[path]; // raster art wins over the built-in SVG
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
