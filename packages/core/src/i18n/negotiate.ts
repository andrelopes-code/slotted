/** The locale every lookup ends on: its catalog is complete by construction. */
export const BASE_LOCALE = 'en-US';

/**
 * The available locale a request resolves to, by RFC 4647 lookup: the tag as
 * requested, then with subtags dropped from the right — a single-letter
 * extension singleton goes with the subtag before it — and `en-US` when none
 * of them is available. Comparison ignores case; the result is spelled as
 * `available` spells it.
 */
export function negotiateLocale(requested: string, available: readonly string[]): string {
  const byLower = new Map(available.map((tag) => [tag.toLowerCase(), tag]));
  const subtags = requested.toLowerCase().split('-').filter(Boolean);
  while (subtags.length > 0) {
    const match = byLower.get(subtags.join('-'));
    if (match !== undefined) return match;
    subtags.pop();
    if (subtags.length > 0 && subtags[subtags.length - 1]!.length === 1) subtags.pop();
  }
  return BASE_LOCALE;
}
