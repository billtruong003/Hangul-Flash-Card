import type { ReactNode } from 'react';
import { ChartIcon, RefreshIcon, ReviewIcon, SoundOffIcon, SoundOnIcon, TrashIcon } from './icons';

type ActionBarProps = {
  chartOpen: boolean;
  chartLocked: boolean;
  reviewMode: boolean;
  soundEnabled: boolean;
  speechSupported: boolean;
  onToggleChart: () => void;
  onRestartSession: () => void;
  onToggleReview: () => void;
  onToggleSound: () => void;
  onRequestClearProgress: () => void;
};

type ActionButtonProps = {
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

function ActionButton({
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

export function ActionBar({
  chartOpen,
  chartLocked,
  reviewMode,
  soundEnabled,
  speechSupported,
  onToggleChart,
  onRestartSession,
  onToggleReview,
  onToggleSound,
  onRequestClearProgress,
}: ActionBarProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <ActionButton
        icon={<ChartIcon />}
        label={chartOpen ? 'Ẩn bảng Hangul' : 'Hiện bảng Hangul'}
        title={chartLocked ? 'Chế độ kiểm tra đang bật' : undefined}
        pressed={chartOpen}
        disabled={chartLocked}
        className="col-span-2 sm:col-span-1"
        onClick={onToggleChart}
      />
      <ActionButton
        icon={<RefreshIcon />}
        label="Bắt đầu lại phiên"
        ariaLabel="Bắt đầu lại phiên học, giữ nguyên tiến độ dài hạn"
        onClick={onRestartSession}
      />
      <ActionButton
        icon={<ReviewIcon />}
        label="Ôn chữ sai"
        ariaLabel={reviewMode ? 'Tắt chế độ ôn chữ sai' : 'Bật chế độ ôn chữ sai'}
        title="Phím tắt: R"
        pressed={reviewMode}
        onClick={onToggleReview}
      />
      <ActionButton
        icon={soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
        label={soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
        ariaLabel={soundEnabled ? 'Tắt âm thanh phát âm' : 'Bật âm thanh phát âm'}
        title={speechSupported ? undefined : 'Trình duyệt này không hỗ trợ đọc phát âm'}
        pressed={soundEnabled}
        disabled={!speechSupported}
        onClick={onToggleSound}
      />
      <ActionButton
        icon={<TrashIcon />}
        label="Xóa toàn bộ tiến độ"
        danger
        onClick={onRequestClearProgress}
      />
    </div>
  );
}
