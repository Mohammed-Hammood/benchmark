import { useTranslation } from 'react-i18next';

const TECH_STACK = [
    { name: 'React 19', icon: '⚛️', url: 'https://github.com/facebook/react' },
    { name: 'TypeScript', icon: '🔷', url: 'https://github.com/microsoft/TypeScript' },
    { name: 'Vite', icon: '⚡', url: 'https://github.com/vitejs/vite' },
    { name: 'Tailwind v4', icon: '🎨', url: 'https://github.com/tailwindlabs/tailwindcss' },
    { name: 'Recharts', icon: '📊', url: 'https://github.com/recharts/recharts' },
    { name: 'Zustand', icon: '🐻', url: 'https://github.com/pmndrs/zustand' },
    { name: 'i18next', icon: '🌐', url: 'https://github.com/i18next/i18next' },
];

const BACKENDS = [
    {
        name: 'Django / DRF',
        color: 'bg-teal-dark',
        descKey: 'about.django.description',
        url: 'https://github.com/encode/django-rest-framework',
    },
    {
        name: 'FastAPI',
        color: 'bg-teal-light',
        descKey: 'about.fastapi.description',
        url: 'https://github.com/fastapi/fastapi',
    },
];

const cardClass = `
  bg-white dark:bg-gray-800 rounded-2xl p-6
  shadow-[0_4px_12px_rgba(0,0,0,0.08)]
  dark:shadow-[0_4px_16px_rgba(255,255,255,0.06)]
`.trim();

const sectionTitleClass =
    'text-xs font-semibold uppercase tracking-widest text-teal-dark dark:text-teal-light mb-4';

export default function About() {
    const { t } = useTranslation();

    return (
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

            {/* ── Hero card ── */}
            <div className="rounded-2xl bg-teal-dark text-white p-8 shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-teal-light opacity-20" />
                <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white opacity-5" />
                <p className="text-xs font-semibold uppercase tracking-widest text-teal-light mb-2">
                    Django vs FastAPI
                </p>
                <h1 className="text-3xl font-bold leading-tight mb-3">
                    {t('about.headline')}
                </h1>
                <p className="text-gray-300 text-sm leading-relaxed max-w-xl">
                    {t('about.subheading')}
                </p>
            </div>

            {/* ── Backends compared ── */}
            <div className={cardClass}>
                <h2 className={sectionTitleClass}>{t('about.backendsLabel')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {BACKENDS.map((b) => (
                        <a
                            key={b.name}
                            href={b.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 p-3 rounded-xl
                         hover:bg-gray-50 dark:hover:bg-gray-700
                         transition-colors group"
                        >
                            <div className={`mt-1.5 w-3 h-3 rounded-full flex-shrink-0 ${b.color}`} />
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-white group-hover:text-teal-dark dark:group-hover:text-teal-light transition-colors">
                                    {b.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t(b.descKey)}</p>
                            </div>
                            <svg
                                className="w-3.5 h-3.5 ml-auto mt-1 text-gray-300 dark:text-gray-600 group-hover:text-teal-light transition-colors flex-shrink-0"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    ))}
                </div>
            </div>

            {/* ── Tech stack ── */}
            <div className={cardClass}>
                <h2 className={sectionTitleClass}>{t('about.stackLabel')}</h2>
                <div className="flex flex-wrap gap-2">
                    {TECH_STACK.map((tech) => (
                        <a
                            key={tech.name}
                            href={tech.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                         bg-gray-100 dark:bg-gray-700
                         text-gray-700 dark:text-gray-200
                         hover:bg-teal-dark hover:text-white
                         dark:hover:bg-teal-dark dark:hover:text-white
                         transition-colors"
                        >
                            <span>{tech.icon}</span>
                            {tech.name}
                        </a>
                    ))}
                </div>
            </div>

            {/* ── Author / links ── */}
            <div className={`${cardClass} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
                <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
                        {t('about.builtByLabel')}
                    </p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{t("about.Mohammed")}</p>
                </div>
                <a
                    href="https://github.com/Mohammed-Hammood/benchmark"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                     bg-teal-dark text-white hover:bg-teal-light transition-colors"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18
              6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343
              -3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07
              1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338
              -2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272
              .098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337
              c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595
              1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012
              2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                            clipRule="evenodd"
                        />
                    </svg>
                    {t('about.sourceLabel')}
                </a>
            </div>

        </div>
    );
}