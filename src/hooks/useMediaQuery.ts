import { useEffect, useState } from 'react';

function matchesQuery(query: string): boolean {
  return window.matchMedia?.(query)?.matches ?? false;
}

/** Reads a CSS media query from JS, for the few cases CSS alone cannot decide. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => matchesQuery(query));

  useEffect(() => {
    const list = window.matchMedia?.(query);
    if (!list) return;

    setMatches(list.matches);
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener('change', handleChange);
    return () => list.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
