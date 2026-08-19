import { useCallback, useState } from 'react';

type UseChartArgs = {
  /** Test mode locks the chart away for the whole session. */
  locked: boolean;
  onOpened: () => void;
};

/** Owns whether the reference chart is showing. Every surface can open it. */
export function useChart({ locked, onOpened }: UseChartArgs) {
  const [chartOpen, setChartOpen] = useState(false);

  const closeChart = useCallback(() => setChartOpen(false), []);

  const toggleChart = useCallback(() => {
    if (locked) return;
    if (chartOpen) {
      setChartOpen(false);
      return;
    }
    setChartOpen(true);
    // Deliberately outside the state updater: React may invoke an updater more
    // than once, which would report the chart as opened twice.
    onOpened();
  }, [chartOpen, locked, onOpened]);

  return { chartOpen, toggleChart, closeChart };
}
