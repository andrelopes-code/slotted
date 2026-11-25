import { useEffect, useState } from 'react';

/** Whether a media query matches; `false` until the browser has been asked. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof globalThis.matchMedia !== 'function') return;

    const list = globalThis.matchMedia(query);
    const read = () => setMatches(list.matches);
    read();
    list.addEventListener('change', read);

    return () => list.removeEventListener('change', read);
  }, [query]);

  return matches;
}
