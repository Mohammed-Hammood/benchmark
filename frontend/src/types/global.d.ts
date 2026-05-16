interface BenchmarkConfig {
  caching: boolean;
  limit: number;
  concurrency: number;
}

interface BackendMetrics {
  avg: number;
  median: number;
  min: number;
  max: number;
  successRate: number;
  cacheHitRatio?: number;
  rawTimings: number[];
}

interface BenchmarkResult {
  django: BackendMetrics;
  fastapi: BackendMetrics;
  config: BenchmarkConfig;
  timestamp: number;  
}