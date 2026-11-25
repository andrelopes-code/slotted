/** Under this width, on a finger, a panel anchored to a control is a sheet. */
export const SHEET_QUERY = '(max-width: 480px) and (pointer: coarse)';

/** Reports whether a media query matches, now and on every change. */
export function watchMedia(query: string, onChange: (matches: boolean) => void): () => void {
  if (typeof globalThis.matchMedia !== 'function') return () => undefined;

  const list = globalThis.matchMedia(query);
  const read = () => onChange(list.matches);
  read();
  list.addEventListener('change', read);

  return () => list.removeEventListener('change', read);
}
