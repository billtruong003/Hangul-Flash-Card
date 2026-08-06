type StatsPanelProps = {
  correct: number;
  assisted: number;
  incorrect: number;
  currentStreak: number;
  bestStreak: number;
  masteredCount: number;
  studyingCount: number;
};

type Tone = 'correct' | 'assisted' | 'incorrect' | 'neutral';

const TONE_CLASSES: Record<Tone, string> = {
  correct: 'text-emerald-700 dark:text-emerald-400',
  assisted: 'text-amber-700 dark:text-amber-400',
  incorrect: 'text-rose-700 dark:text-rose-400',
  neutral: 'text-slate-900 dark:text-slate-100',
};

function StatCell({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: Tone;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-0.5 py-2">
      <span className={`text-lg font-bold tabular-nums sm:text-2xl ${TONE_CLASSES[tone]}`}>
        {value}
      </span>
      <span className="text-center text-[10px] leading-tight font-medium text-slate-500 sm:text-xs dark:text-slate-400">
        {label}
      </span>
    </div>
  );
}

export function StatsPanel({
  correct,
  assisted,
  incorrect,
  currentStreak,
  bestStreak,
  masteredCount,
  studyingCount,
}: StatsPanelProps) {
  const percent = studyingCount === 0 ? 0 : Math.round((masteredCount / studyingCount) * 100);

  return (
    <section
      aria-label="Thống kê phiên học"
      className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="grid grid-cols-5 divide-x divide-slate-200 dark:divide-slate-800">
        <StatCell label="Đúng" value={correct} tone="correct" />
        <StatCell label="Có trợ giúp" value={assisted} tone="assisted" />
        <StatCell label="Sai" value={incorrect} tone="incorrect" />
        <StatCell label="Chuỗi hiện tại" value={currentStreak} />
        <StatCell label="Chuỗi cao nhất" value={bestStreak} />
      </div>

      <div className="mt-1 border-t border-slate-200 px-2 pt-2.5 pb-1 dark:border-slate-800">
        <div className="flex items-baseline justify-between gap-2 text-xs sm:text-sm">
          <span className="font-medium text-slate-600 dark:text-slate-300">
            Đã thuộc {masteredCount} / {studyingCount} chữ
          </span>
          <span className="tabular-nums text-slate-500 dark:text-slate-400">{percent}%</span>
        </div>
        <div
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          role="progressbar"
          aria-valuenow={masteredCount}
          aria-valuemin={0}
          aria-valuemax={studyingCount}
          aria-label={`Đã thuộc ${masteredCount} trên tổng số ${studyingCount} chữ đang học`}
        >
          <div
            className="h-full rounded-full bg-sky-600 transition-[width] duration-500 dark:bg-sky-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </section>
  );
}
