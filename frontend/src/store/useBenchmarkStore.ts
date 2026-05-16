import { create } from "zustand";

interface BenchmarkState {
  currentResult: BenchmarkResult | null;
  history: BenchmarkResult[];
  loading: boolean;
  error: string | null;
  limit: number;
  caching: boolean;
  concurrency: number;

  // ── Progress ──────────────────────────────────────────────────────────────
  progress: number; // 0–100 percentage
  progressPhase: "idle" | "django" | "fastapi";

  setLimit: (limit: number) => void;
  setCaching: (caching: boolean) => void;
  setConcurrency: (concurrency: number) => void;
  runBenchmark: () => Promise<void>;
  resetHistory: () => void;
  setError: (error: string | null) => void;
}

const BACKENDS = {
  fastapi: "http://localhost:8000/api/users",
  django: "http://localhost:8001/api/users",
};

const fetchWithTiming = async (
  url: string,
): Promise<{ time: number; success: boolean; cacheHit?: boolean }> => {
  const start = performance.now();
  try {
    const res = await fetch(url);
    const end = performance.now();
    return {
      time: end - start,
      success: res.ok,
      cacheHit: res.headers.get("X-Cache-Hit") === "true",
    };
  } catch {
    return { time: performance.now() - start, success: false };
  }
};

const calcMedian = (sorted: number[]): number => {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

// ── Progress-aware backend test ───────────────────────────────────────────────
// onRequestDone is called after each individual request completes
const runBackendTest = async (
  url: string,
  config: BenchmarkConfig,
  onRequestDone: (success: boolean) => void, // ✅ callback per request
): Promise<BackendMetrics> => {
  const params = new URLSearchParams({
    limit: config.limit.toString(),
    cache: config.caching.toString(),
  });

  // Fire all requests but track each one individually as it completes
  const results = await Promise.all(
    Array(config.concurrency)
      .fill(0)
      .map(async () => {
        const result = await fetchWithTiming(`${url}?${params}`);
        onRequestDone(result.success); // ✅ notify after each request
        return result;
      }),
  );

  const successful = results.filter((r) => r.success);
  const timings = successful.map((r) => r.time).sort((a, b) => a - b);
  const cacheHits = successful.filter((r) => r.cacheHit).length;

  if (timings.length === 0) {
    return {
      avg: 0,
      median: 0,
      min: 0,
      max: 0,
      successRate: 0,
      cacheHitRatio: config.caching ? 0 : undefined,
      rawTimings: [],
    };
  }

  return {
    avg: timings.reduce((a, b) => a + b, 0) / timings.length,
    median: calcMedian(timings),
    min: timings[0],
    max: timings[timings.length - 1],
    successRate: (successful.length / results.length) * 100,
    cacheHitRatio: config.caching
      ? (cacheHits / successful.length) * 100
      : undefined,
    rawTimings: timings,
  };
};

export const useBenchmarkStore = create<BenchmarkState>((set, get) => ({
  currentResult: null,
  history: [],
  loading: false,
  error: null,
  limit: 1000,
  caching: true,
  concurrency: 5,

  // ── Progress initial state ────────────────────────────────────────────────
  progress: 0,
  progressPhase: "idle",

  setLimit: (limit) => set({ limit }),
  setCaching: (caching) => set({ caching }),
  setConcurrency: (concurrency) => set({ concurrency }),
  setError: (error) => set({ error }),

  resetHistory: () =>
    set({
      history: [],
      currentResult: null,
      error: null,
      progress: 0,
      progressPhase: "idle",
    }),

  runBenchmark: async () => {
    const { limit, caching, concurrency } = get();
    const config: BenchmarkConfig = { limit, caching, concurrency };

    // Total requests = concurrency × 2 backends
    const totalRequests = concurrency * 2;
    let completedRequests = 0;

    const onRequestDone = () => {
      completedRequests += 1;
      // percentage = completed / total × 100
      const progress = Math.round((completedRequests / totalRequests) * 100);
      set({ progress });
    };

    set({ loading: true, error: null, progress: 0, progressPhase: "idle" });


    try {
      set({ progressPhase: "django" });
      const django: BackendMetrics = await runBackendTest(
        BACKENDS.django,
        config,
        onRequestDone,
      );

      set({ progressPhase: "fastapi" });
      const fastapi: BackendMetrics = await runBackendTest(
        BACKENDS.fastapi,
        config,
        onRequestDone,
      );

      const result: BenchmarkResult = {
        django,
        fastapi,
        config,
        timestamp: Date.now(),
      };

      set((state) => ({
        currentResult: result,
        history: [...state.history, result],
        loading: false,
        progress: 100,
        progressPhase: "idle",
      }));
    } catch (err) {
      set({
        loading: false,
        progress: 0,
        progressPhase: "idle",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
}));
