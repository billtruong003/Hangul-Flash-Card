import { useCallback, useRef, useState } from 'react';

type UseChartArgs = {
  /** Test mode locks the chart away for the whole session. */
  locked: boolean;
  onOpened: () => void;
};

/**
 * Owns whether the reference chart is showing.
 *
 * The chart is global — writing and syllable building want it too — but only
 * the letters quiz treats consulting it as assistance. Rather than have the
 * shell import quiz internals, a surface registers a callback here and gets
 * told when the chart is touched.
 */
export function useChart({ locked, onOpened }: UseChartArgs) {
  const [chartOpen, setChartOpen] = useState(false);
  const consumerRef = useRef<(() => void) | null>(null);

  /** Returns an unsubscribe, so a surface can clean up when it unmounts. */
  const registerConsumer = useCallback((onConsult: () => void) => {
    consumerRef.current = onConsult;
    return () => {
      if (consumerRef.current === onConsult) consumerRef.current = null;
    };
  }, []);

  const notifyConsult = useCallback(() => {
    consumerRef.current?.();
  }, []);

  const closeChart = useCallback(() => setChartOpen(false), []);

  const toggleChart = useCallback(() => {
    if (locked) return;
    if (chartOpen) {
      setChartOpen(false);
      return;
    }
    // Consulting the chart taints the card that is already on screen.
    consumerRef.current?.();
    setChartOpen(true);
    onOpened();
  }, [chartOpen, locked, onOpened]);

  return { chartOpen, toggleChart, closeChart, setChartOpen, registerConsumer, notifyConsult };
}
