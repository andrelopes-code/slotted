import { watchMedia } from '@slotted/core/extent';
import { useEffect, useState } from 'react';

/** Whether a media query matches; `false` until the browser has been asked, and for no query. */
export function useMediaQuery(query: string | null): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (query === null) {
      setMatches(false);
      return;
    }

    return watchMedia(query, setMatches);
  }, [query]);

  return matches;
}
