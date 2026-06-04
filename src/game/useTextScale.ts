import { useEffect, useState } from 'react';

/** Body-text font sizes (px) for the readable card: عادي / كبير / أكبر. */
export const TEXT_SIZES = [16, 20, 25];
const KEY = 'mafioso.textScale';

function readLevel(): number {
  try {
    const v = parseInt(localStorage.getItem(KEY) ?? '', 10);
    if (Number.isFinite(v) && v >= 0 && v < TEXT_SIZES.length) return v;
  } catch {
    /* localStorage unavailable */
  }
  return 0;
}

/** Persisted text-size preference (an index into TEXT_SIZES). */
export function useTextScale(): [number, (level: number) => void] {
  const [level, setLevel] = useState<number>(readLevel);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, String(level));
    } catch {
      /* ignore */
    }
  }, [level]);

  return [level, setLevel];
}
