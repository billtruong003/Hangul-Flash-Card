import { CATEGORY_LABELS, CATEGORY_ORDER, HANGUL_CHARACTERS } from '../data/hangul';
import type { HangulCategory } from '../types';

type SettingsPanelProps = {
  enabledCategories: string[];
  testMode: boolean;
  onToggleCategory: (category: HangulCategory) => void;
  onToggleTestMode: () => void;
};

const COUNT_BY_CATEGORY = CATEGORY_ORDER.reduce<Record<string, number>>((counts, category) => {
  counts[category] = HANGUL_CHARACTERS.filter((c) => c.category === category).length;
  return counts;
}, {});

export function SettingsPanel({
  enabledCategories,
  testMode,
  onToggleCategory,
  onToggleTestMode,
}: SettingsPanelProps) {
  const isLastEnabled = (category: HangulCategory) =>
    enabledCategories.length === 1 && enabledCategories[0] === category;

  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <legend className="px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        Bộ chữ đang học
      </legend>

      <div className="mt-1 grid grid-cols-2 gap-2">
        {CATEGORY_ORDER.map((category) => {
          const isEnabled = enabledCategories.includes(category);
          const isLocked = isLastEnabled(category);

          return (
            <label
              key={category}
              className={[
                'flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-2.5 py-2.5 transition-colors',
                isEnabled
                  ? 'border-sky-600 bg-sky-50 dark:border-sky-500 dark:bg-sky-950/40'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                isLocked ? 'cursor-not-allowed opacity-70' : '',
              ].join(' ')}
            >
              <input
                type="checkbox"
                checked={isEnabled}
                disabled={isLocked}
                onChange={() => onToggleCategory(category)}
                className="h-4 w-4 shrink-0 accent-sky-600 disabled:cursor-not-allowed dark:accent-sky-500"
              />
              <span className="min-w-0">
                <span className="block text-[13px] leading-tight font-semibold text-slate-800 dark:text-slate-100">
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  {COUNT_BY_CATEGORY[category]} chữ
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <p className="mt-2 px-1 text-[11px] text-slate-500 dark:text-slate-400">
        Phải giữ ít nhất một nhóm chữ. Đổi nhóm sẽ tạo lại câu hỏi kế tiếp.
      </p>

      <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border-2 border-slate-200 px-2.5 py-2.5 transition-colors hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600">
        <input
          type="checkbox"
          checked={testMode}
          onChange={onToggleTestMode}
          className="mt-0.5 h-4 w-4 shrink-0 accent-sky-600 dark:accent-sky-500"
        />
        <span className="min-w-0">
          <span className="block text-[13px] leading-tight font-semibold text-slate-800 dark:text-slate-100">
            Ẩn bảng trong chế độ kiểm tra
          </span>
          <span className="mt-0.5 block text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            Khóa bảng chữ Hangul trong suốt phiên học, nên mọi câu trả lời đều không có trợ giúp.
          </span>
        </span>
      </label>
    </fieldset>
  );
}
