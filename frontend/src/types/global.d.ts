type BackendId = 'go' | 'python';
type TestType = 'math' | 'generate';

/** Successful JSON body returned by both /api/math and /api/generate. */
interface ApiSuccess {
  status: 'success';
  test_type: 'math_calculation' | 'data_generation';
  n: number;
  /** /api/math only */
  result?: number;
  /** /api/generate only */
  file_saved?: string;
  /** Time measured inside the server, in milliseconds */
  execution_time_ms: number;
}

/** Outcome of one request to one backend. */
interface BackendRun {
  backend: BackendId;
  ok: boolean;
  httpStatus: number | null;
  /** Browser-measured time from sending the request to receiving the response */
  roundTripMs: number;
  data: ApiSuccess | null;
  error: string | null;
}

interface BenchmarkResult {
  id: number;
  testType: TestType;
  n: number;
  go: BackendRun;
  python: BackendRun;
  timestamp: number;
}
