import { useBenchmarkStore } from '../store/useBenchmarkStore';
import { useTranslation } from 'react-i18next';



export default function ConfigPanel() {
    const { t } = useTranslation()
    const {
        currentResult, loading, progress, progressPhase,
        caching, setCaching, limit, setLimit, concurrency, setConcurrency, runBenchmark, resetHistory } =
        useBenchmarkStore();

    const phaseLabel = {
        idle: '',
        django: t("running_django"),
        fastapi: t("running_fastapi"),
    }[progressPhase];


    return (
        <div className="p-6 rounded-xl shadow-md max-w-2xl mx-auto dark:bg-gray-700">
            <h2 className="text-xl font-bold text-teal-dark mb-4 dark:text-white">{t('benchmarkConfig')}</h2>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="font-medium dark:text-white">{t('caching')}</label>
                    <button
                        onClick={() => setCaching(!caching)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition ${caching ? 'bg-teal-light' : 'bg-gray-300'}`}
                    >
                        <div className={`bg-white w-4 h-4 rounded-full transition-transform ${caching ? 'translate-x-6' : ''}`} />
                    </button>

                </div>

                <div>
                    <label className="block font-medium mb-1 dark:text-white">{t('recordLimit')}</label>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                        {[100, 1000, 10000, 100000].map((n) => (
                            <option key={n} value={n}>{n.toLocaleString()}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block font-medium mb-1 dark:text-white">
                        {t('concurrentRequests')} ({concurrency})
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={concurrency}
                        onChange={(e) => setConcurrency(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
                <div className='flex gap-0.5'>

                    <button
                        onClick={runBenchmark}
                        disabled={loading}
                        className={`w-full py-2 rounded font-semibold text-white ${loading ? 'bg-gray-400' : 'bg-teal-dark hover:bg-teal-light'}`}
                    >
                        {loading ? t('running') : t('runBenchmark')}
                    </button>
                    <button
                        disabled={currentResult == null}
                        onClick={resetHistory}
                        className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-gray-500"
                    >
                        {t('resetHistory')}
                    </button>
                </div>
                {loading && (
                    <div className={`space-y-1 transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{phaseLabel}</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-teal-light rounded-full"
                                style={{ width: `${progress}%`, background:"teal" }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}