import { SECTIONS } from '../data/sections';
import type { LearningSection } from '../types';
import { BlocksIcon, CardsIcon, EarIcon, PenIcon } from './icons';

type SectionNavProps = {
  active: LearningSection;
  onChange: (section: LearningSection) => void;
};

const ICONS: Record<LearningSection, typeof CardsIcon> = {
  letters: CardsIcon,
  writing: PenIcon,
  syllables: BlocksIcon,
  listening: EarIcon,
};

/**
 * Moves between the four learning surfaces.
 *
 * Deliberately a `<nav>` and not a second tablist. The four surfaces are
 * different activities rather than four views of one thing, and the app already
 * spends ← / → on switching direction *within* the letters quiz — nesting two
 * tablists would make those arrows ambiguous for keyboard users.
 *
 * A bottom bar on phones (thumb reach) and a horizontal rail on desktop.
 */
export function SectionNav({ active, onChange }: SectionNavProps) {
  return (
    <nav
      aria-label="Khu vực học"
      className={[
        'fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur',
        'pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-950/95',
        'lg:static lg:z-auto lg:rounded-2xl lg:border lg:bg-white lg:pb-0 lg:backdrop-blur-none',
        'lg:dark:bg-slate-900',
      ].join(' ')}
    >
      <ul className="mx-auto flex max-w-xl lg:max-w-none lg:gap-1 lg:p-1">
        {SECTIONS.map((section) => {
          const Icon = ICONS[section.id];
          const isActive = section.id === active;

          return (
            <li key={section.id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(section.id)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex w-full flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-semibold transition-colors',
                  'lg:flex-row lg:justify-center lg:gap-2 lg:rounded-xl lg:py-2.5 lg:text-sm',
                  isActive
                    ? 'text-sky-700 lg:bg-sky-600 lg:text-white dark:text-sky-400 lg:dark:bg-sky-600 lg:dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100',
                ].join(' ')}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{section.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
