import type { ReactNode } from 'react';

export type ActionButtonProps = {
  icon: ReactNode;
  label: string;
  ariaLabel?: string;
  pressed?: boolean;
  danger?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
  onClick: () => void;
};

export function ActionButton({
  icon,
  label,
  ariaLabel,
  pressed,
  danger,
  disabled,
  title,
  className = '',
  onClick,
}: ActionButtonProps) {
  const tone = pressed
    ? 'border-sky-600 bg-sky-600 text-white dark:border-sky-500 dark:bg-sky-600'
    : danger
      ? 'border-slate-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:border-rose-800 dark:hover:bg-rose-950/40'
      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel ?? label}
      {...(pressed === undefined ? {} : { 'aria-pressed': pressed })}
      className={[
        'flex min-h-[3rem] items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-[13px] font-semibold transition-colors sm:text-sm',
        'disabled:cursor-not-allowed disabled:opacity-50',
        tone,
        className,
      ].join(' ')}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
