import { moveIndex, revealWithin } from '@slotted/core/collection';
import type { MoveIntent } from '@slotted/core/collection';

import type { SelectOptionValue } from './select.types';

/**
 * The collection, read from the DOM of the open popup.
 *
 * The options are the consumer's own JSX, so the list the reader sees is the
 * only place their order, their labels and their disabled set all exist at
 * once. `menu` reads its items the same way, and the alternative — every option
 * registering itself into a context on mount — re-renders the whole popup once
 * per option on the first open and gets the order wrong the moment a consumer
 * renders one conditionally.
 *
 * Nothing here decides anything. `moveIndex` in `packages/core/src/collection`
 * does the arithmetic; this module only says what the arithmetic is about.
 */

export const OPTION_SELECTOR = "[data-part='item']";

export function options(content: HTMLElement | null): HTMLElement[] {
  return content === null ? [] : [...content.querySelectorAll<HTMLElement>(OPTION_SELECTOR)];
}

export const valueOf = (option: HTMLElement): SelectOptionValue => option.dataset['value'] ?? '';

export const isEnabled = (option: HTMLElement) => option.dataset['disabled'] === undefined;

/** What typeahead matches on: what the option says instead, or what it reads as. */
export const labelOf = (option: HTMLElement): string =>
  option.dataset['textValue'] ??
  option.querySelector("[data-part='label']")?.textContent?.trim() ??
  option.textContent?.trim() ??
  '';

/**
 * The options typeahead searches: the enabled ones, and only those.
 *
 * Arrow movement already steps over a disabled option, so a typeahead that
 * landed on one would let a reader reach by typing what they cannot reach by
 * arrowing — and then refuse to commit it. Radix and React Aria both skip them
 * here for the same reason. `menu` does not, because its pattern requires a
 * disabled command to stay reachable; the listbox pattern says nothing, and
 * consistency inside this family is what settles it.
 */
export function searchable(content: HTMLElement | null) {
  const list = options(content).filter(isEnabled);
  return { elements: list, labels: list.map(labelOf) };
}

/**
 * The value the highlight moves to, or `null` when nothing is reachable — an
 * empty list, a list still loading, and a list whose every option is disabled
 * all answer the same way, and the caller's response to all three is the same:
 * write no `aria-activedescendant`.
 */
export function moveHighlight(
  content: HTMLElement | null,
  from: SelectOptionValue | null,
  intent: MoveIntent,
  loop: boolean,
): SelectOptionValue | null {
  const list = options(content);
  if (list.length === 0) return null;

  const index = moveIndex({
    enabled: list.map(isEnabled),
    from: from === null ? -1 : list.findIndex((option) => valueOf(option) === from),
    intent,
    loop,
  });
  return index === -1 ? null : valueOf(list[index] as HTMLElement);
}

/** Where the highlight lands when the popup opens, given what is selected. */
export function entryHighlight(
  content: HTMLElement | null,
  selection: readonly SelectOptionValue[],
  entry: 'selected' | 'first' | 'last' | 'none',
  loop: boolean,
): SelectOptionValue | null {
  if (entry === 'none') return null;
  if (entry === 'selected') {
    const list = options(content);
    const chosen = list.find((option) => selection.includes(valueOf(option)) && isEnabled(option));
    if (chosen !== undefined) return valueOf(chosen);
    return moveHighlight(content, null, 'first', loop);
  }
  return moveHighlight(content, null, entry, loop);
}

/**
 * Brings the highlighted option into view without moving the page: the nearest
 * scrolling box between the option and the popup is scrolled, by the least
 * distance that shows the whole row, and nothing past it. `scrollIntoView`
 * would scroll every ancestor too, and on the first open it runs before the
 * popup is positioned — a select far down a page sent the page to its top.
 *
 * A browser scrolls a *focused* element into view on its own; nothing here is
 * focused, which is the price of the `aria-activedescendant` model and the
 * reason this exists.
 */
export function revealOption(content: HTMLElement | null, value: SelectOptionValue | null) {
  if (content === null || value === null) return;
  const option = options(content).find((candidate) => valueOf(candidate) === value);
  if (option !== undefined) revealWithin(option, content);
}
