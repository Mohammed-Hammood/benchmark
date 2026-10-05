import { useTranslation } from 'react-i18next';
import TestCard from './TestCard';
import { TEST_ORDER } from '../config';

export default function ConfigPanel() {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-teal-dark dark:text-white">{t('benchmarkConfig')}</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1 max-w-2xl">{t('intro')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {TEST_ORDER.map((test) => (
          <TestCard key={test} test={test} />
        ))}
      </div>
    </div>
  );
}
