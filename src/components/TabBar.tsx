import { TABS } from '../data/tabs';
import type { QuizMode } from '../types';

type TabBarProps = {
  activeMode: QuizMode;
  onChange: (mode: QuizMode) => void;
};

export function TabBar({ activeMode, onChange }: TabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Chế độ học"
      className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800/70"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeMode;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls="quiz-panel"
            onClick={() => onChange(tab.id)}
            className={[
              'rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors sm:text-base',
              isActive
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
            ].join(' ')}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
