import ConfigPanel from '../components/ConfigPanel';
import ResultsDisplay from '../components/ResultsDisplay';
import { useBenchmarkStore } from '../store/useBenchmarkStore';

export default function Home() {
  const { currentResult } = useBenchmarkStore();

  return (
    <div className="py-8 px-4">
      <ConfigPanel />
      {currentResult && <ResultsDisplay />}
    </div>
  );
}