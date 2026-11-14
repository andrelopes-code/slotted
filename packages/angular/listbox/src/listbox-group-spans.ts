import type { GroupSpan } from '@slotted/core/collection';

/**
 * The runs of options that share a group, in document order, each with the
 * column count it is drawn in: the group's own `data-columns`, or the
 * listbox's. `null` when no group states a count of its own, so a listbox
 * keeps its one arrangement for the arrow keys.
 */
export function groupSpans(
  root: HTMLElement,
  options: readonly (HTMLElement | null)[],
  columns: number,
): GroupSpan[] | null {
  if (root.querySelector('[data-part="group"][data-columns]') === null) return null;

  const spans: GroupSpan[] = [];
  let current: Element | null | undefined;

  for (const [index, option] of options.entries()) {
    const group = option?.closest('[data-part="group"]') ?? null;

    if (spans.length > 0 && group === current) {
      spans[spans.length - 1]!.count += 1;
      continue;
    }

    current = group;
    spans.push({ start: index, count: 1, columns: ownColumns(group) ?? columns });
  }

  return spans;
}

function ownColumns(group: Element | null) {
  const value = Number(group?.getAttribute('data-columns'));

  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : undefined;
}
