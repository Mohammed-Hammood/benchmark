import type { TFunction } from 'i18next';

export const formatN = (n: number) => n.toLocaleString();

export const formatMs = (ms: number, t: TFunction): string => {
  if (ms >= 60_000) {
    const m = Math.floor(ms / 60_000);
    const s = Math.round((ms % 60_000) / 1000);
    return `${m} ${t('min')} ${s} ${t('s')}`;
  }
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} ${t('s')}`;
  return `${ms.toFixed(2)} ${t('ms')}`;
};

/** Faster / slower comparison based on server execution time. */
export interface Comparison {
  winner: BackendId | 'tie';
  factor: number;
}

export const compare = (r: BenchmarkResult): Comparison | null => {
  if (!r.go.data || !r.python.data) return null;
  const g = Math.max(r.go.data.execution_time_ms, 0.01);
  const p = Math.max(r.python.data.execution_time_ms, 0.01);
  const factor = Math.max(g, p) / Math.min(g, p);
  if (factor < 1.05) return { winner: 'tie', factor };
  return { winner: g < p ? 'go' : 'python', factor };
};
