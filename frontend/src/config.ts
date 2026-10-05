/**
 * Single source of truth for the backends and the two tests.
 * The min/max values mirror the validation rules in main.go and main.py,
 * so the UI can never send a value the servers would reject.
 */

export const BACKENDS: Record<
  BackendId,
  { label: string; base: string; color: string }
> = {
  // Requests go through the Vite dev proxy / nginx, which strip the prefix
  // and forward to Gin (:8081) and FastAPI (:8080). This avoids CORS entirely.
  go: { label: 'Go / Gin', base: '/go', color: '#02afaf' },
  python: { label: 'Python / FastAPI', base: '/python', color: '#e0a526' },
};

export const BACKEND_ORDER: BackendId[] = ['go', 'python'];

export const TESTS: Record<
  TestType,
  { path: string; min: number; max: number; apiName: ApiSuccess['test_type'] }
> = {
  math: {
    path: '/api/math',
    min: 1_000,
    max: 1_000_000_000,
    apiName: 'math_calculation',
  },
  generate: {
    path: '/api/generate',
    min: 1_000,
    max: 1_000_000,
    apiName: 'data_generation',
  },
};

export const TEST_ORDER: TestType[] = ['math', 'generate'];

/** Quick-pick values; each test only shows the ones within its own range. */
export const PRESETS = [
  1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000,
];

/** Above this n the math loop can take minutes on Python. */
export const SLOW_THRESHOLD: Record<TestType, number> = {
  math: 100_000_000,
  generate: 500_000,
};
