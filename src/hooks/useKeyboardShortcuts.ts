import { useEffect, useRef } from 'react';

export type ShortcutHandlers = {
  /** `1`–`4`. Return true if the key was consumed. */
  onNumber?: (index: number) => boolean | void;
  /** ← / → with no modifier. Owned by whichever surface is on screen. */
  onArrow?: (direction: -1 | 1) => void;
  /** Shift + ← / →. Always moves between surfaces. */
  onSectionArrow?: (direction: -1 | 1) => void;
  onReview?: () => void;
};

/**
 * Binds the app's keyboard shortcuts to `window`.
 *
 * Still `window` and not a container, so a key press works wherever focus
 * happens to be — including immediately after the page loads, before the
 * learner has clicked anything.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers, disabled: boolean): void {
  // Kept in a ref so re-rendering with new closures does not detach and
  // reattach the listener on every keystroke.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      // Never steal a key from someone typing.
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.isContentEditable) return;

      const current = handlersRef.current;

      if (event.key >= '1' && event.key <= '4') {
        if (current.onNumber?.(Number(event.key) - 1) !== false) event.preventDefault();
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        if (event.shiftKey) {
          event.preventDefault();
          current.onSectionArrow?.(direction);
          return;
        }
        event.preventDefault();
        current.onArrow?.(direction);
        return;
      }

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        current.onReview?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled]);
}
