
export const exportToCSV = (result: BenchmarkResult) => {
  const rows = [
    ['Backend', 'Avg (ms)', 'Min (ms)', 'Max (ms)', 'Success Rate (%)', 'Cache Hit Ratio (%)'],
    [
      'Django',
      result.django.avg,
      result.django.min,
      result.django.max,
      result.django.successRate,
      result.django.cacheHitRatio ?? ''
    ],
    [
      'FastAPI',
      result.fastapi.avg,
      result.fastapi.min,
      result.fastapi.max,
      result.fastapi.successRate,
      result.fastapi.cacheHitRatio ?? ''
    ]
  ];

  const csvContent = rows.map(e => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `benchmark_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (result: BenchmarkResult) => {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `benchmark_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};