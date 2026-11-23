import { isNavigationDisabled } from './arrow-navigation';

export interface RovingRadioOptions {
  /** The `name` the radios share, across every group inside the root. */
  name: string;
  /**
   * A radio was chosen, by a press, Space or an arrow. The caller writes
   * `aria-checked`, then calls `refresh` when it did so outside this call.
   */
  onSelect: (value: string, item: HTMLButtonElement) => void;
}

export interface RovingRadioHandle {
  /** Removes the listeners and leaves every radio as it stands. */
  destroy: () => void;
  /** Places the tab stop again after a choice made elsewhere, or a radio that came or went. */
  refresh: () => void;
}

/**
 * The keyboard of a radio group an application draws itself, when a native
 * radio cannot carry the drawing — a gallery of illustrated choices in
 * sections. Each choice is `<button type="button" role="radio" name value
 * aria-checked>`; each section is a `radiogroup`, and sections whose radios
 * share a `name` are one choice:
 *
 * - one tab stop, on the checked radio or on the first enabled one;
 * - both arrow axes move focus and select, across sections, wrapping, past a
 *   disabled radio, mirrored in a right-to-left root;
 * - Enter submits the form the radio is in, and Space and a press select.
 *
 * A key pressed on any other control inside the root is left alone.
 */
export function createRovingRadio(
  root: HTMLElement,
  { name, onSelect }: RovingRadioOptions,
): RovingRadioHandle {
  const selector = `[role="radio"][name=${JSON.stringify(name)}]`;

  const items = () => [...root.querySelectorAll<HTMLButtonElement>(selector)];
  const enabled = () => items().filter((item) => !isNavigationDisabled(item, false));
  const itemOf = (event: Event) =>
    event.target instanceof Element ? event.target.closest<HTMLButtonElement>(selector) : null;

  function stopAt(active: HTMLButtonElement | undefined) {
    for (const item of items()) item.setAttribute('tabindex', item === active ? '0' : '-1');
  }

  function refresh() {
    const choices = enabled();
    stopAt(choices.find((item) => item.getAttribute('aria-checked') === 'true') ?? choices[0]);
  }

  function choose(item: HTMLButtonElement) {
    stopAt(item);
    onSelect(item.value, item);
  }

  function handleClick(event: Event) {
    const item = itemOf(event);
    if (item === null || isNavigationDisabled(item, false)) return;

    choose(item);
  }

  function handleKeydown(event: KeyboardEvent) {
    const item = itemOf(event);
    if (item === null || event.altKey || event.ctrlKey || event.metaKey) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      item.form?.requestSubmit();
      return;
    }

    const step = stepOf(root, event.key);
    if (step === 0) return;

    event.preventDefault();
    const choices = enabled();
    const next = choices.at((choices.indexOf(item) + step) % choices.length);
    if (next === undefined || next === item) return;

    next.focus();
    choose(next);
  }

  root.addEventListener('click', handleClick);
  root.addEventListener('keydown', handleKeydown);
  refresh();

  return {
    destroy: () => {
      root.removeEventListener('click', handleClick);
      root.removeEventListener('keydown', handleKeydown);
    },
    refresh,
  };
}

/** `1` toward the next radio, `-1` toward the previous, `0` for a key that moves nothing. */
function stepOf(root: HTMLElement, key: string): -1 | 0 | 1 {
  if (key === 'ArrowDown') return 1;
  if (key === 'ArrowUp') return -1;
  if (key !== 'ArrowRight' && key !== 'ArrowLeft') return 0;

  const direction = root.ownerDocument.defaultView?.getComputedStyle(root).direction;
  const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';

  return key === forward ? 1 : -1;
}
