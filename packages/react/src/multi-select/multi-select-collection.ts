import { moveIndex, revealWithin } from '@slotted/core/collection';
import type { MoveIntent } from '@slotted/core/collection';

import type { MultiSelectOptionValue } from './multi-select.types';

/**
 * The collection, read from the DOM of the open popup, for the reason
 * `combobox` reads it there: each option judges itself against the query, so
 * the rendered list *is* the result set and nothing else in the family knows
 * what matched.
 *
 * The same shape `select` and `combobox` use, deliberately. `moveIndex` in
 * `packages/core/src/collection` does the arithmetic; this module only says
 * what the arithmetic is about.
 */

export const OPTION_SELECTOR = "[data-part='item']";

export function options(content: HTMLElement | null): HTMLElement[] {
  return content === null ? [] : [...content.querySelectorAll<HTMLElement>(OPTION_SELECTOR)];
}

export const valueOf = (option: HTMLElement): MultiSelectOptionValue =>
  option.dataset['value'] ?? '';

/**
 * Whether the highlight may land on an option. A disabled one is out, and so
 * is any unchosen one while the set is full: the control refuses it, and a
 * highlight that could not be taken is a cursor pointing at nothing.
 */
export const isEnabled = (option: HTMLElement) =>
  option.dataset['disabled'] === undefined && option.getAttribute('aria-disabled') !== 'true';

export const labelOf = (option: HTMLElement): string =>
  option.dataset['textValue'] ??
  option.querySelector("[data-part='label']")?.textContent?.trim() ??
  option.textContent?.trim() ??
  '';

/** Whether the option holding `value` is the offer to add it rather than a member. */
export function isCreateRow(content: HTMLElement | null, value: string) {
  if (content === null) return false;
  const option = content.querySelector(`[data-part='item'][data-value="${CSS.escape(value)}"]`);
  return option?.hasAttribute('data-create') === true;
}

/**
 * The value the highlight moves to, or `null` when nothing is reachable. An
 * empty result set, a list still loading, a list whose every option is
 * disabled and a full control all answer the same way, and the caller writes
 * no `aria-activedescendant` for any of them.
 */
export function moveHighlight(
  content: HTMLElement | null,
  from: MultiSelectOptionValue | null,
  intent: MoveIntent,
  loop: boolean,
): MultiSelectOptionValue | null {
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

/** Where the highlight lands when the popup opens. */
export function entryHighlight(
  content: HTMLElement | null,
  entry: 'first' | 'last' | 'none',
  loop: boolean,
): MultiSelectOptionValue | null {
  if (entry === 'none') return null;
  return moveHighlight(content, null, entry, loop);
}

/**
 * Brings the highlighted option into view without moving the page: the nearest
 * scrolling box between the option and the popup is scrolled, by the least
 * distance that shows the whole row, and nothing past it. `scrollIntoView`
 * would scroll every ancestor too, and on the first open it runs before the
 * popup is positioned — a control far down a page sent the page to its top.
 */
export function revealOption(content: HTMLElement | null, value: MultiSelectOptionValue | null) {
  if (content === null || value === null) return;
  const option = options(content).find((candidate) => valueOf(candidate) === value);
  if (option !== undefined) revealWithin(option, content);
}

/** The chips in the control, in the order the row holds them. */
export const CHIP_SELECTOR = "[data-part='chips'] > [role='gridcell']:not([data-part='field'])";

export function chips(control: HTMLElement | null): HTMLElement[] {
  return control === null ? [] : [...control.querySelectorAll<HTMLElement>(CHIP_SELECTOR)];
}
