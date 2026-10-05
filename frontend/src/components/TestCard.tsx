import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import NSelector from './NSelector';
import { BACKENDS, BACKEND_ORDER, SLOW_THRESHOLD, TESTS } from '../config';
import { useBenchmarkStore } from '../store/useBenchmarkStore';
import { formatMs } from '../utils/format';

/** Mounted only while a run is active, so its state starts at 0 every time. */
function Elapsed({ startedAt }: { startedAt: number }) {
  const { t } = useTranslation();
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMs(Date.now() - startedAt), 250);
    return () => clearInterval(id);
  }, [startedAt]);
  return <span>{t('elapsed', { time: formatMs(ms, t) })}</span>;
}

export default function TestCard({ test }: { test: TestType }) {
  const { t } = useTranslation();
  const { n, setN, loading, runningTest, phase, startedAt, runBenchmark, cancel } =
    useBenchmarkStore();

  const { min, max } = TESTS[test];
  const value = n[test];
  const active = runningTest === test;
  const slow = value >= SLOW_THRESHOLD[test];

  return (
    <section
      aria-labelledby={`${test}-title`}
      className="p-6 rounded-xl shadow-md bg-white dark:bg-gray-700 flex flex-col gap-5"
    >
      <div>
        <h2 id={`${test}-title`} className="text-xl font-bold text-teal-dark dark:text-white">
          {t(`tests.${test}.title`)}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
          {t(`tests.${test}.description`)}
        </p>
        <code className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          GET {TESTS[test].path}?n=…
        </code>
      </div>

      <NSelector
        label={t(`tests.${test}.nLabel`)}
        min={min}
        max={max}
        value={value}
        onChange={(v) => setN(test, v)}
        disabled={loading}
      />

      {slow && (
        <p className="text-sm rounded-md px-3 py-2 bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
          {t('slowWarning')}
        </p>
      )}

      <div className="mt-auto space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => runBenchmark(test)}
            disabled={loading}
            className={`flex-1 py-2 rounded font-semibold text-white transition-colors
              ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-dark hover:bg-teal-light cursor-pointer'}`}
          >
            {active ? t('running') : t(`tests.${test}.run`)}
          </button>
          {active && (
            <button
              type="button"
              onClick={cancel}
              className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 cursor-pointer"
            >
              {t('cancel')}
            </button>
          )}
        </div>

        {active && startedAt !== null && (
          <div className="space-y-1" role="status" aria-live="polite">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-300">
              <span>{t(`phase.${phase === 'idle' ? 'go' : phase}`)}</span>
              <Elapsed startedAt={startedAt} />
            </div>
            <div className="flex gap-1">
              {BACKEND_ORDER.map((b) => {
                const done = phase === 'python' && b === 'go';
                const current = phase === b;
                return (
                  <div
                    key={b}
                    className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden"
                    title={BACKENDS[b].label}
                  >
                    <div
                      className={`h-full rounded-full ${current ? 'motion-safe:animate-pulse' : ''}`}
                      style={{
                        width: done || current ? '100%' : '0%',
                        background: BACKENDS[b].color,
                        opacity: done ? 1 : 0.8,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
