import type { ReactNode } from 'react';
import { SettingsIcon } from './icons';

type AppShellProps = {
  hint: string;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  settings: ReactNode;
  children: ReactNode;
  nav: ReactNode;
  footer: ReactNode;
  /** Widens the page when the desktop reference chart is showing beside it. */
  wide: boolean;
};

export function AppShell({
  hint,
  settingsOpen,
  onToggleSettings,
  settings,
  children,
  nav,
  footer,
  wide,
}: AppShellProps) {
  return (
    <div
      className={[
        'mx-auto flex min-h-dvh w-full flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-5 sm:py-6',
        // Room for the fixed bottom nav on phones; it becomes a static rail at lg.
        'pb-24 lg:pb-6',
        wide ? 'max-w-5xl' : 'max-w-xl',
      ].join(' ')}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
            Hangul Flashcards
          </h1>
          <p className="truncate text-xs text-slate-500 sm:text-sm dark:text-slate-400">{hint}</p>
        </div>
        <button
          type="button"
          onClick={onToggleSettings}
          aria-expanded={settingsOpen}
          aria-controls="settings-panel"
          aria-label={settingsOpen ? 'Đóng bảng cài đặt' : 'Mở bảng cài đặt bộ chữ'}
          className={[
            'shrink-0 rounded-xl border p-2.5 transition-colors',
            settingsOpen
              ? 'border-sky-600 bg-sky-600 text-white dark:border-sky-500 dark:bg-sky-600'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
          ].join(' ')}
        >
          <SettingsIcon />
        </button>
      </header>

      {/* Rendered once. On phones SectionNav pins itself to the bottom of the
          viewport, so its position here does not matter; on desktop it becomes
          a static rail and lands directly under the header. Rendering it twice
          for the two layouts would duplicate the landmark and every button
          name in it. */}
      {nav}

      {settingsOpen && (
        <div id="settings-panel" className="animate-fade-up">
          {settings}
        </div>
      )}

      {children}

      <footer className="mt-auto pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
        {footer}
      </footer>
    </div>
  );
}
