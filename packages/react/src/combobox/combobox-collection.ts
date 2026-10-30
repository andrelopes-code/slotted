import { moveIndex, revealWithin } from '@slotted/core/collection';
import type { MoveIntent } from '@slotted/core/collection';

import type { ComboboxOptionValue } from './combobox.types';

/**
 * The collection, read from the DOM of the open popup — and here that is more
 * than a convenience. The options a combobox holds are the ones that survived
 * the filter, each one having judged itself, so the rendered list *is* the
 * result set. Nothing else in the family knows what matched.
 *
 * The same shape `select` uses, deliberately: the two families are a pair, and
 * a reader who has read one should recognize the other. `moveIndex` in
 * `packages/core/src/collection` does the arithmetic; this module only says
 * what the arithmetic is about.
 */

export const OPTION_SELECTOR = "[data-part='item']";

export function options(content: HTMLElement | null): HTMLElement[] {
  return content === null ? [] : [...content.querySelectorAll<HTMLElement>(OPTION_SELECTOR)];
}

export const valueOf = (option: HTMLElement): ComboboxOptionValue => option.dataset['value'] ?? '';

export const isEnabled = (option: HTMLElement) => option.dataset['disabled'] === undefined;

export const labelOf = (option: HTMLElement): string =>
  option.dataset['textValue'] ??
  option.querySelector("[data-part='label']")?.textContent?.trim() ??
  option.textContent?.trim() ??
  '';

/**
 * The value the highlight moves to, or `null` when nothing is reachable. An
 * empty result set, a list still loading and a list whose every option is
 * disabled all answer the same way, and the caller writes no
 * `aria-activedescendant` for all three.
 */
export function moveHighlight(
  content: HTMLElement | null,
  from: ComboboxOptionValue | null,
  intent: MoveIntent,
  loop: boolean,
): ComboboxOptionValue | null {
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

/** Where the highlight lands when the popup opens, given what was committed. */
export function entryHighlight(
  content: HTMLElement | null,
  value: ComboboxOptionValue | null,
  entry: 'selected' | 'first' | 'last' | 'none',
  loop: boolean,
): ComboboxOptionValue | null {
  if (entry === 'none') return null;
  if (entry === 'selected') {
    if (value === null) return null;
    const chosen = options(content).find(
      (option) => valueOf(option) === value && isEnabled(option),
    );
    return chosen === undefined ? null : valueOf(chosen);
  }
  return moveHighlight(content, null, entry, loop);
}

/** The label of the first option that survived the filter, for the completion. */
export function firstMatch(content: HTMLElement | null): string | null {
  const first = options(content).find(isEnabled);
  return first === undefined ? null : labelOf(first);
}

/** The value behind a label, so a completion the reader accepted becomes a key. */
export function valueForLabel(content: HTMLElement | null, label: string) {
  const option = options(content).find((candidate) => labelOf(candidate) === label);
  return option === undefined ? null : valueOf(option);
}

/** Brings the option into view by scrolling the list, never the page (`revealWithin`). */
export function revealOption(content: HTMLElement | null, value: ComboboxOptionValue | null) {
  if (content === null || value === null) return;
  const option = options(content).find((candidate) => valueOf(candidate) === value);
  if (option !== undefined) revealWithin(option, content);
}
