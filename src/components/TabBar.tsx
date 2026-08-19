export type Tab = { id: string; label: string };

type TabBarProps = {
  tabs: Tab[];
  activeId: string;
  /** id of the element these tabs control, for `aria-controls`. */
  panelId: string;
  label: string;
  onChange: (id: string) => void;
};

/**
 * Switches between the sub-modes *within* one learning surface. Moving between
 * surfaces is `SectionNav`'s job, which is a `<nav>` — so this stays the only
 * tablist on the page and ← / → keep one unambiguous meaning.
 *
 * Renders nothing for a single tab: a one-tab tablist is noise for screen
 * reader users, and three of the four surfaces start with exactly one sub-mode.
 */
// Tailwind only ships classes it can see in the source, so the column count
// has to be a literal rather than an interpolated `grid-cols-${n}`.
const COLUMNS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

export function TabBar({ tabs, activeId, panelId, label, onChange }: TabBarProps) {
  if (tabs.length < 2) return null;

  return (
    <div
      role="tablist"
      aria-label={label}
      className={[
        'grid gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800/70',
        COLUMNS[tabs.length] ?? 'grid-cols-2',
      ].join(' ')}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={panelId}
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
