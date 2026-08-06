import { useRef, type ReactNode } from 'react';
import { useDialogBehavior } from '../hooks/useDialogBehavior';
import { CloseIcon } from './icons';

const TITLE = 'Bảng chữ Hangul';

type SurfaceProps = {
  onClose: () => void;
  children: ReactNode;
};

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Đóng bảng Hangul"
      className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      <CloseIcon />
    </button>
  );
}

/** Desktop: a plain collapsible column next to the quiz card, not a modal. */
export function ChartPanel({ onClose, children }: SurfaceProps) {
  return (
    <aside
      aria-label={TITLE}
      className="flex max-h-[calc(100dvh-3rem)] flex-col rounded-3xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-sm font-bold">{TITLE}</h2>
        <CloseButton onClose={onClose} />
      </div>
      {children}
    </aside>
  );
}

/** Mobile: a focus-trapped bottom sheet that leaves the quiz reachable behind it. */
export function ChartDrawer({ onClose, children }: SurfaceProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(true, onClose, panelRef);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Đóng bảng Hangul bằng cách chạm ra ngoài"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/40"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chart-drawer-title"
        className="animate-slide-up relative flex max-h-[82dvh] w-full flex-col rounded-t-3xl border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <h2 id="chart-drawer-title" className="text-sm font-bold">
            {TITLE}
          </h2>
          <CloseButton onClose={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}
