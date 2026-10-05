import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PRESETS } from '../config';
import { formatN } from '../utils/format';

interface Props {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}

const SLIDER_STEPS = 1000;
const compact = new Intl.NumberFormat('en', { notation: 'compact' });

// The ranges span 3–6 orders of magnitude, so the slider is logarithmic.
const toSlider = (n: number, min: number, max: number) =>
  Math.round(((Math.log10(n) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))) * SLIDER_STEPS);

const fromSlider = (pos: number, min: number, max: number) => {
  if (pos <= 0) return min;
  if (pos >= SLIDER_STEPS) return max;
  const raw = 10 ** (Math.log10(min) + (pos / SLIDER_STEPS) * (Math.log10(max) - Math.log10(min)));
  // Keep two significant digits so the values stay readable (e.g. 3,200,000)
  const p = 10 ** (Math.floor(Math.log10(raw)) - 1);
  return Math.min(max, Math.max(min, Math.round(raw / p) * p));
};

export default function NSelector({ label, min, max, value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const id = useId();
  // null = not editing, show the committed value
  const [draft, setDraft] = useState<string | null>(null);

  const draftNumber = draft === null ? null : Number(draft.replace(/[\s,]/g, ''));
  const invalid =
    draftNumber !== null &&
    (!Number.isInteger(draftNumber) || draftNumber < min || draftNumber > max);

  const handleInput = (raw: string) => {
    if (!/^[\d\s,]*$/.test(raw)) return;
    setDraft(raw);
    const num = Number(raw.replace(/[\s,]/g, ''));
    if (raw.trim() !== '' && Number.isInteger(num) && num >= min && num <= max) onChange(num);
  };

  const presets = PRESETS.filter((p) => p >= min && p <= max);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="font-medium dark:text-white">
          {label}
        </label>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t('range', { min: formatN(min), max: formatN(max) })}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('quickPicks')}>
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => {
              setDraft(null);
              onChange(p);
            }}
            aria-pressed={value === p}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors cursor-pointer
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-light
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                value === p
                  ? 'bg-teal-dark border-teal-dark text-white dark:bg-teal-light dark:border-teal-light'
                  : 'border-gray-300 text-gray-700 hover:border-teal-light dark:border-gray-500 dark:text-gray-200'
              }`}
          >
            {compact.format(p)}
          </button>
        ))}
      </div>

      <input
        type="range"
        min={0}
        max={SLIDER_STEPS}
        value={toSlider(value, min, max)}
        disabled={disabled}
        onChange={(e) => {
          setDraft(null);
          onChange(fromSlider(Number(e.target.value), min, max));
        }}
        aria-label={`${label} (${t('logScale')})`}
        className="w-full accent-teal-light disabled:opacity-50"
      />

      <div>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={draft ?? formatN(value)}
          onFocus={(e) => {
            setDraft(String(value));
            e.currentTarget.select();
          }}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={() => setDraft(null)}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-err` : undefined}
          className={`w-full border rounded p-2 font-mono dark:bg-gray-800 dark:text-white
            ${invalid ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
        />
        {invalid && (
          <p id={`${id}-err`} className="mt-1 text-sm text-red-600 dark:text-red-400">
            {t('outOfRange', { min: formatN(min), max: formatN(max) })}
          </p>
        )}
      </div>
    </div>
  );
}
