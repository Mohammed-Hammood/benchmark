const csvCell = (v: string | number | undefined) => {
  const s = v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const download = (content: string, mime: string, ext: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `benchmark_${Date.now()}.${ext}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const runCells = (run: BackendRun) => [
  run.ok ? 'success' : run.error ?? 'failed',
  run.data?.execution_time_ms,
  Math.round(run.roundTripMs * 100) / 100,
  run.data?.result ?? run.data?.file_saved,
];

export const exportToCSV = (history: BenchmarkResult[]) => {
  const head = ['Timestamp', 'Test', 'n'];
  for (const b of ['Go', 'Python']) {
    head.push(`${b} status`, `${b} server (ms)`, `${b} round trip (ms)`, `${b} result / file`);
  }
  const rows = history.map((r) => [
    new Date(r.timestamp).toISOString(),
    r.testType,
    r.n,
    ...runCells(r.go),
    ...runCells(r.python),
  ]);
  const csv = [head, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  download(csv, 'text/csv;charset=utf-8;', 'csv');
};

export const exportToJSON = (history: BenchmarkResult[]) => {
  download(JSON.stringify(history, null, 2), 'application/json', 'json');
};
