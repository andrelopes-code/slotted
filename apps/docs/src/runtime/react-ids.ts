/**
 * Every preview is its own React root, and each root counts `useId` from the
 * same start: without a prefix two examples on one page wrote the same ids,
 * and a label could name another example's control. The server and the client
 * render with the same prefix, so hydration matches.
 */
export function exampleIdPrefix(id: string): string {
  return `${id.replace(/[^a-z0-9]+/gi, '-')}-`;
}
