import { create } from 'zustand';
import { BACKENDS, BACKEND_ORDER, TESTS } from '../config';

export type Phase = 'idle' | BackendId;

interface BenchmarkState {
  /** Selected n for each test (kept separately because the ranges differ) */
  n: Record<TestType, number>;
  loading: boolean;
  runningTest: TestType | null;
  phase: Phase;
  startedAt: number | null;

  currentResult: BenchmarkResult | null;
  history: BenchmarkResult[];

  setN: (test: TestType, n: number) => void;
  runBenchmark: (test: TestType) => Promise<void>;
  cancel: () => void;
  resetHistory: () => void;
}

let controller: AbortController | null = null;

/** Pull a readable message out of a Gin ({detail: string}) or FastAPI ({detail: [...]}) error body. */
const extractDetail = (body: unknown): string | null => {
  if (!body || typeof body !== 'object' || !('detail' in body)) return null;
  const detail = (body as { detail: unknown }).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (d && typeof d === 'object' && 'msg' in d ? String(d.msg) : String(d)))
      .join('; ');
  }
  return null;
};

const isApiSuccess = (body: unknown): body is ApiSuccess =>
  !!body &&
  typeof body === 'object' &&
  (body as ApiSuccess).status === 'success' &&
  typeof (body as ApiSuccess).execution_time_ms === 'number';

const callBackend = async (
  backend: BackendId,
  test: TestType,
  n: number,
  signal: AbortSignal,
): Promise<BackendRun> => {
  const url = `${BACKENDS[backend].base}${TESTS[test].path}?n=${n}`;
  const start = performance.now();
  try {
    const res = await fetch(url, { signal });
    const body: unknown = await res.json().catch(() => null);
    const roundTripMs = performance.now() - start;

    if (res.ok && isApiSuccess(body)) {
      return { backend, ok: true, httpStatus: res.status, roundTripMs, data: body, error: null };
    }
    return {
      backend,
      ok: false,
      httpStatus: res.status,
      roundTripMs,
      data: null,
      error: extractDetail(body) ?? `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''}`,
    };
  } catch (err) {
    if (signal.aborted) throw err; // user cancelled; handled by the caller
    return {
      backend,
      ok: false,
      httpStatus: null,
      roundTripMs: performance.now() - start,
      data: null,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
};

export const useBenchmarkStore = create<BenchmarkState>((set, get) => ({
  n: { math: 1_000_000, generate: 10_000 },
  loading: false,
  runningTest: null,
  phase: 'idle',
  startedAt: null,
  currentResult: null,
  history: [],

  setN: (test, n) => set((s) => ({ n: { ...s.n, [test]: n } })),

  cancel: () => controller?.abort(),

  resetHistory: () => set({ history: [], currentResult: null }),

  runBenchmark: async (test) => {
    if (get().loading) return;
    const n = get().n[test];

    controller = new AbortController();
    const { signal } = controller;
    set({ loading: true, runningTest: test, phase: 'idle', startedAt: Date.now() });

    try {
      // Sequential on purpose: running both at once would make them compete
      // for CPU on the same machine and skew the comparison.
      const runs = {} as Record<BackendId, BackendRun>;
      for (const backend of BACKEND_ORDER) {
        set({ phase: backend });
        runs[backend] = await callBackend(backend, test, n, signal);
      }

      const result: BenchmarkResult = {
        id: Date.now(),
        testType: test,
        n,
        go: runs.go,
        python: runs.python,
        timestamp: Date.now(),
      };
      set((s) => ({
        currentResult: result,
        history: [...s.history, result],
      }));
    } catch {
      // Aborted by the user: nothing to record.
    } finally {
      controller = null;
      set({ loading: false, runningTest: null, phase: 'idle', startedAt: null });
    }
  },
}));
