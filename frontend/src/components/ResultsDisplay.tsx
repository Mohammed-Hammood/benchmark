import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useBenchmarkStore } from '../store/useBenchmarkStore';
import { exportToCSV, exportToJSON } from '../utils/exportResults';
import { useTheme } from '../contexts/ThemeContext';

export default function ResultsDisplay() {

    const { t } = useTranslation();
    const { currentResult, history, error } = useBenchmarkStore();
    const { theme } = useTheme();

    if (!currentResult) return null;

    const { django, fastapi, config } = currentResult;

    // ── Dark-mode chart colours ────────────────────────────────────────────────
    const axisColor = theme === 'dark' ? '#9ca3af' : '#374151';
    const tooltipBg = theme === 'dark' ? '#1f2937' : '#ffffff';
    const tooltipBorder = theme === 'dark' ? '#374151' : '#e5e7eb';

    // ── Bar chart data ─────────────────────────────────────────────────────────
    const barData = [
        { name: 'Django', avg: parseFloat(django.avg.toFixed(2)), median: parseFloat(django.median.toFixed(2)) },
        { name: 'FastAPI', avg: parseFloat(fastapi.avg.toFixed(2)), median: parseFloat(fastapi.median.toFixed(2)) },
    ];


    // ── Line chart: latency vs record limit (Option B) ─────────────────────────
    // Group history by limit and average the runs so same-limit entries don't collapse
    const lineData = Object.values(
        history.reduce((acc, r) => {
            const key = r.config.limit;
            if (!acc[key]) {
                acc[key] = { limit: key, djangoSum: 0, fastapiSum: 0, count: 0 };
            }
            acc[key].djangoSum += r.django.avg;
            acc[key].fastapiSum += r.fastapi.avg;
            acc[key].count += 1;
            return acc;
        }, {} as Record<number, { limit: number; djangoSum: number; fastapiSum: number; count: number }>)
    )
        .map(({ limit, djangoSum, fastapiSum, count }) => ({
            limit,
            django: parseFloat((djangoSum / count).toFixed(2)),
            fastapi: parseFloat((fastapiSum / count).toFixed(2)),
        }))
        .sort((a, b) => a.limit - b.limit);

    // ── Shared class shortcuts ─────────────────────────────────────────────────
    const cardClass = 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow';
    const titleClass = 'text-lg font-bold text-teal-dark dark:text-teal-light mb-3';

    // ── Metrics rows ───────────────────────────────────────────────────────────
    const metricRows = (backend: 'django' | 'fastapi') => {
        const m = currentResult[backend];
        const rows: [string, string][] = [
            [t('avgMs'), m.avg.toFixed(2)],
            [t('medianMs'), m.median.toFixed(2)],
            [t('minMs'), m.min.toFixed(2)],
            [t('maxMs'), m.max.toFixed(2)],
            [t('successRate'), `${m.successRate.toFixed(1)}%`],
        ];
        if (config.caching && m.cacheHitRatio !== undefined) {
            rows.push([t('cacheHitRatio'), `${m.cacheHitRatio.toFixed(1)}%`]);
        }
        return rows;
    };

    return (
        <div className="space-y-8 mt-8">

            {/* Error banner */}
            {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* ── Metrics cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(['django', 'fastapi'] as const).map((backend) => (
                    <div key={backend} className={cardClass}>
                        <h3 className={`${titleClass} capitalize`}>
                            {backend === 'django' ? 'Django / DRF' : 'FastAPI'}
                        </h3>
                        <table className="w-full text-sm">
                            <tbody>
                                {metricRows(backend).map(([label, value]) => (
                                    <tr
                                        key={label}
                                        className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                                    >
                                        <td className="py-1 text-gray-600 dark:text-gray-400">{label}</td>
                                        <td className="py-1 text-right font-mono font-medium dark:text-gray-100">
                                            {value}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {/* ── Bar chart: avg vs median ── */}
            <div className={cardClass}>
                <h3 className={titleClass}>{t('latencyComparison')}</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} barCategoryGap="30%">
                            <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor }} />
                            <YAxis
                                stroke={axisColor}
                                tick={{ fill: axisColor }}
                                label={{ value: t('ms'), angle: -90, position: 'insideLeft', fill: axisColor }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
                                labelStyle={{ color: axisColor }}
                                formatter={(value) => [`${Number(value).toFixed(2)} ${t('ms')}`, '']}
                            />
                            <Legend wrapperStyle={{ color: axisColor }} />
                            <Bar dataKey="avg" name={t('avgMs')} fill="#02afaf" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="median" name={t('medianMs')} fill="#004b4b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Line chart: latency vs record count ── */}
            {lineData.length > 1 && (
                <div className={cardClass}>
                    <h3 className={titleClass}>{t('latencyVsRecordCount')}</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData}>
                                <XAxis
                                    dataKey="limit"
                                    type="number"
                                    scale="log"
                                    domain={['dataMin', 'dataMax']}
                                    stroke={axisColor}
                                    tick={{ fill: axisColor }}
                                    tickFormatter={(v) => Number(v).toLocaleString()}
                                    label={{
                                        value: t('recordLimit'),
                                        position: 'insideBottomRight',
                                        offset: -5,
                                        fill: axisColor,
                                    }}
                                />
                                <YAxis
                                    stroke={axisColor}
                                    tick={{ fill: axisColor }}
                                    label={{ value: t('ms'), angle: -90, position: 'insideLeft', fill: axisColor }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
                                    labelStyle={{ color: axisColor }}
                                    formatter={(value) => [`${value} ${t('ms')}`, '']}
                                    labelFormatter={(limit) =>
                                        `${t('recordLimit')}: ${Number(limit).toLocaleString()}`
                                    }
                                />
                                <Legend wrapperStyle={{ color: axisColor }} />
                                <Line
                                    type="monotone"
                                    dataKey="django"
                                    name="Django / DRF"
                                    stroke="#004b4b"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="fastapi"
                                    name="FastAPI"
                                    stroke="#02afaf"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                        {t('lineChartHint') /* "Run benchmarks with different record limits to populate this chart" */}
                    </p>
                </div>
            )}

            {/* ── Export buttons ── */}
            <div className="flex justify-center gap-3 pb-4">
                <button
                    onClick={() => exportToCSV(currentResult)}
                    className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-dark transition"
                >
                    {t('exportCsv')}
                </button>
                <button
                    onClick={() => exportToJSON(currentResult)}
                    className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-dark transition"
                >
                    {t('exportJson')}
                </button>
            </div>
        </div>
    );
}