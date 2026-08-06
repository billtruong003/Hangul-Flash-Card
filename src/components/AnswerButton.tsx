import { AssistIcon, CheckIcon, CrossIcon } from './icons';

export type AnswerState = 'idle' | 'correct' | 'assisted' | 'incorrect' | 'dimmed';

type AnswerButtonProps = {
  label: string;
  state: AnswerState;
  disabled: boolean;
  isHangul: boolean;
  shortcut: number;
  ariaLabel: string;
  onSelect: () => void;
};

const STATE_CLASSES: Record<AnswerState, string> = {
  idle: 'border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500 dark:hover:bg-slate-800',
  correct:
    'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-100',
  assisted:
    'border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-100',
  incorrect:
    'border-rose-500 bg-rose-50 text-rose-900 animate-shake dark:border-rose-500 dark:bg-rose-950/60 dark:text-rose-100',
  dimmed: 'border-slate-200 bg-white opacity-50 dark:border-slate-800 dark:bg-slate-900',
};

export function AnswerButton({
  label,
  state,
  disabled,
  isHangul,
  shortcut,
  ariaLabel,
  onSelect,
}: AnswerButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        'relative flex min-h-[4.5rem] items-center justify-center rounded-2xl border-2 px-3 py-3 text-center',
        'transition-[background-color,border-color,opacity,transform] duration-150 disabled:cursor-default',
        'sm:min-h-[5.25rem]',
        STATE_CLASSES[state],
      ].join(' ')}
    >
      {/* Shortcut hints are desktop-only; touch users never see a keyboard. */}
      <span
        aria-hidden="true"
        className="absolute top-1.5 left-2 hidden text-[11px] font-semibold text-slate-400 sm:block dark:text-slate-500"
      >
        {shortcut}
      </span>

      <span
        className={
          isHangul
            ? 'font-hangul text-4xl leading-none font-medium sm:text-5xl'
            : 'text-lg leading-snug font-semibold break-words sm:text-xl'
        }
      >
        {label}
      </span>

      {state === 'correct' && (
        <CheckIcon className="absolute top-2 right-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      )}
      {state === 'assisted' && (
        <AssistIcon className="absolute top-2 right-2 h-5 w-5 text-amber-600 dark:text-amber-400" />
      )}
      {state === 'incorrect' && (
        <CrossIcon className="absolute top-2 right-2 h-5 w-5 text-rose-600 dark:text-rose-400" />
      )}
    </button>
  );
}
