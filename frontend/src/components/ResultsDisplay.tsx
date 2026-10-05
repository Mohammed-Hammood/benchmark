import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend, CartesianGrid,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useBenchmarkStore } from '../store/useBenchmarkStore';
import { useTheme } from '../contexts/ThemeContext';
import { BACKENDS, BACKEND_ORDER } from '../config';
import { exportToCSV, exportToJSON } from '../utils/exportResults';
import { compare, formatMs, formatN } from '../utils/format';

const cardClass = 'bg-white dark:bg-gray-800 p-5 rounded-lg shadow';
const titleClass = 'text-lg font-bold text-teal-dark dark:text-teal-light mb-3';

// ── One backend's response, printed field by field ──────────────────────────
function BackendCard({ run }: { run: BackendRun }) {
    const { t } = useTranslation();
    const { label, color } = BACKENDS[run.backend];
    const d = run.data;

    const rows: [string, string][] = [];
    if (d) {
        rows.push([t('testType'), d.test_type]);
        rows.push(['n', formatN(d.n)]);
        if (d.result !== undefined) rows.push([t('result'), formatN(d.result)]);
        if (d.file_saved) rows.push([t('fileSaved'), d.file_saved]);
        rows.push([t('serverTime'), formatMs(d.execution_time_ms, t)]);
        rows.push([t('roundTrip'), formatMs(run.roundTripMs, t)]);
        rows.push([t('overhead'), formatMs(Math.max(run.roundTripMs - d.execution_time_ms, 0), t)]);
    } else {
        rows.push([t('httpStatus'), run.httpStatus !== null ? String(run.httpStatus) : t('noResponse')]);
        rows.push([t('roundTrip'), formatMs(run.roundTripMs, t)]);
    }

    return (
        <div className={cardClass} style={{ borderTop: `4px solid ${color}` }}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{label}</h3>
                <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        run.ok
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                >
                    {run.ok ? t('success') : t('failed')}
                </span>
            </div>

            {run.error && (
                <p className="mb-3 text-sm text-red-700 dark:text-red-300 break-words">{run.error}</p>
            )}

            <dl className="text-sm">
                {rows.map(([k, v]) => (
                    <div
                        key={k}
                        className="flex justify-between gap-4 py-1 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                        <dt className="text-gray-600 dark:text-gray-400">{k}</dt>
                        <dd className="font-mono font-medium text-right break-all dark:text-gray-100">{v}</dd>
                    </div>
                ))}
            </dl>

            {d && (
                <details className="mt-3 text-sm">
                    <summary className="cursor-pointer text-teal-dark dark:text-teal-light font-medium">
                        {t('rawResponse')}
                    </summary>
                    <pre className="mt-2 p-3 rounded bg-gray-100 dark:bg-gray-900 text-xs overflow-x-auto dark:text-gray-100">
                        {JSON.stringify(d, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    );
}

export default function ResultsDisplay() {
    const { t } = useTranslation();
    const { currentResult, history, resetHistory } = useBenchmarkStore();
    const { theme } = useTheme();

    if (!currentResult) return null;

    const axisColor = theme === 'dark' ? '#9ca3af' : '#374151';
    const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
    const tooltipBg = theme === 'dark' ? '#1f2937' : '#ffffff';
    const tooltipBorder = theme === 'dark' ? '#374151' : '#e5e7eb';
    const tooltipStyle = { backgroundColor: tooltipBg, borderColor: tooltipBorder };

    const { testType, n } = currentResult;
    const cmp = compare(currentResult);

    // ── Bar chart: server time vs browser round trip ──
    const barData = BACKEND_ORDER.map((b) => ({
        name: BACKENDS[b].label,
        server: currentResult[b].data ? currentResult[b].data!.execution_time_ms : 0,
        roundTrip: currentResult[b].ok ? Math.round(currentResult[b].roundTripMs * 100) / 100 : 0,
    }));

    // ── Line chart: server time vs n, for runs of the same test type ──
    // Runs with the same n are averaged so repeated runs don't stack on one x.
    const grouped = history
        .filter((r) => r.testType === testType && r.go.data && r.python.data)
        .reduce((acc, r) => {
            const g = (acc[r.n] ??= { n: r.n, go: 0, python: 0, count: 0 });
            g.go += r.go.data!.execution_time_ms;
            g.python += r.python.data!.execution_time_ms;
            g.count += 1;
            return acc;
        }, {} as Record<number, { n: number; go: number; python: number; count: number }>);

    // Floor at 0.01 ms: the servers round to 2 decimals and a log axis can't show 0.
    const lineData = Object.values(grouped)
        .map((g) => ({
            n: g.n,
            go: Math.max(g.go / g.count, 0.01),
            python: Math.max(g.python / g.count, 0.01),
        }))
        .sort((a, b) => a.n - b.n);

    return (
        <div className="max-w-5xl mx-auto space-y-6 mt-10">
            {/* ── Heading + verdict ── */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-teal-dark dark:text-white">
                        {t('latestRun')}: {t(`tests.${testType}.title`)}, n = {formatN(n)}
                    </h2>
                    <p className="text-gray-700 dark:text-gray-200 mt-1" role="status">
                        {cmp === null && t('comparisonUnavailable')}
                        {cmp?.winner === 'tie' && t('similar')}
                        {cmp && cmp.winner !== 'tie' &&
                            t('fasterBy', {
                                winner: BACKENDS[cmp.winner].label,
                                factor: cmp.factor >= 10 ? cmp.factor.toFixed(0) : cmp.factor.toFixed(1),
                            })}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={resetHistory}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer"
                >
                    {t('resetHistory')}
                </button>
            </div>

            {/* ── Response data per backend ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {BACKEND_ORDER.map((b) => (
                    <BackendCard key={b} run={currentResult[b]} />
                ))}
            </div>

            {/* ── Bar chart ── */}
            {cmp && (
                <div className={cardClass}>
                    <h3 className={titleClass}>{t('latencyComparison')}</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} barCategoryGap="30%">
                                <CartesianGrid stroke={gridColor} vertical={false} />
                                <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor }} />
                                <YAxis
                                    stroke={axisColor}
                                    tick={{ fill: axisColor }}
                                    label={{ value: t('ms'), angle: -90, position: 'insideLeft', fill: axisColor }}
                                />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    labelStyle={{ color: axisColor }}
                                    formatter={(value) => `${Number(value).toLocaleString()} ${t('ms')}`}
                                />
                                <Legend wrapperStyle={{ color: axisColor }} />
                                <Bar dataKey="server" name={t('serverTime')} fill="#02afaf" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="roundTrip" name={t('roundTrip')} fill="#64748b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ── Line chart: time vs n ── */}
            {lineData.length > 1 && (
                <div className={cardClass}>
                    <h3 className={titleClass}>
                        {t('timeVsN')} ({t(`tests.${testType}.title`)})
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData} margin={{ left: 8, right: 16, bottom: 8 }}>
                                <CartesianGrid stroke={gridColor} />
                                <XAxis
                                    dataKey="n"
                                    type="number"
                                    scale="log"
                                    domain={['dataMin', 'dataMax']}
                                    stroke={axisColor}
                                    tick={{ fill: axisColor }}
                                    tickFormatter={(v) => formatN(Number(v))}
                                    label={{ value: 'n', position: 'insideBottomRight', offset: -2, fill: axisColor }}
                                />
                                <YAxis
                                    scale="log"
                                    domain={['auto', 'auto']}
                                    allowDataOverflow
                                    stroke={axisColor}
                                    tick={{ fill: axisColor }}
                                    tickFormatter={(v) => Number(v).toLocaleString()}
                                    label={{ value: t('ms'), angle: -90, position: 'insideLeft', fill: axisColor }}
                                />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    labelStyle={{ color: axisColor }}
                                    formatter={(value) => `${Number(value).toLocaleString()} ${t('ms')}`}
                                    labelFormatter={(v) => `n = ${formatN(Number(v))}`}
                                />
                                <Legend wrapperStyle={{ color: axisColor }} />
                                {BACKEND_ORDER.map((b) => (
                                    <Line
                                        key={b}
                                        type="monotone"
                                        dataKey={b}
                                        name={BACKENDS[b].label}
                                        stroke={BACKENDS[b].color}
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">{t('timeVsNHint')}</p>
                </div>
            )}

            {/* ── History table ── */}
            <div className={cardClass}>
                <h3 className={titleClass}>
                    {t('history')} ({history.length})
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <th className="py-2 pr-4 font-medium">{t('time')}</th>
                                <th className="py-2 pr-4 font-medium">{t('test')}</th>
                                <th className="py-2 pr-4 font-medium text-right">n</th>
                                <th className="py-2 pr-4 font-medium text-right">{BACKENDS.go.label}</th>
                                <th className="py-2 pr-4 font-medium text-right">{BACKENDS.python.label}</th>
                                <th className="py-2 font-medium text-right">{t('faster')}</th>
                            </tr>
                        </thead>
                        <tbody className="dark:text-gray-100">
                            {[...history].reverse().slice(0, 50).map((r) => {
                                const c = compare(r);
                                return (
                                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                                        <td className="py-1.5 pr-4 whitespace-nowrap">
                                            {new Date(r.timestamp).toLocaleTimeString()}
                                        </td>
                                        <td className="py-1.5 pr-4 whitespace-nowrap">{t(`tests.${r.testType}.title`)}</td>
                                        <td className="py-1.5 pr-4 text-right font-mono">{formatN(r.n)}</td>
                                        {BACKEND_ORDER.map((b) => (
                                            <td key={b} className="py-1.5 pr-4 text-right font-mono whitespace-nowrap">
                                                {r[b].data ? formatMs(r[b].data!.execution_time_ms, t) : t('failed')}
                                            </td>
                                        ))}
                                        <td className="py-1.5 text-right whitespace-nowrap">
                                            {!c ? '—' : c.winner === 'tie' ? '≈' : `${BACKENDS[c.winner].label} ×${c.factor.toFixed(1)}`}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Export ── */}
            <div className="flex justify-center gap-3 pb-4">
                <button
                    type="button"
                    onClick={() => exportToCSV(history)}
                    className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-dark transition cursor-pointer"
                >
                    {t('exportCsv')}
                </button>
                <button
                    type="button"
                    onClick={() => exportToJSON(history)}
                    className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-dark transition cursor-pointer"
                >
                    {t('exportJson')}
                </button>
            </div>
        </div>
    );
}
