/**
 * What a collection's selection becomes when the reader acts on one option.
 *
 * One reducer for the three modes and the two behaviors, so `listbox`,
 * `select`, `combobox`, `multi-select` and `tree` cannot disagree about what
 * `multiple` means. It is pure: it takes the selection it is given and returns
 * the selection that follows, and `packages/core/src/state` decides whether the
 * component or the consumer owns it.
 *
 * The result is always in the collection's own order rather than in the order
 * the reader picked. A consumer comparing two selections, submitting one, or
 * rendering a summary of one needs the same array for the same set, and
 * pick-order arrays are why two identical selections compare unequal.
 *
 * Nothing here touches the DOM or a framework.
 */

export type SelectionMode = 'none' | 'single' | 'multiple';

/**
 * How a plain press behaves in `multiple`.
 *
 * `toggle` is the model the APG recommends — "a recommended model that does not
 * require the user to hold a modifier key" — and it is the default.
 * `replace` is the desktop model: a plain press replaces the selection and only
 * a modifier extends it, which is what a file list and `<select multiple>` do.
 */
export type SelectionBehavior = 'toggle' | 'replace';

export type SelectionAction =
  /** Flip one option, honoring the behavior. */
  | 'toggle'
  /** Make one option the whole selection, whatever the behavior. */
  | 'replace'
  /** Everything between the anchor and this option, inclusive. */
  | 'range'
  /** Every enabled option, or none of them if they are already all selected. */
  | 'all'
  | 'clear';

export interface SelectionRequest {
  action: SelectionAction;
  mode: SelectionMode;
  behavior?: SelectionBehavior | undefined;
  /** The selection as it stands. */
  selected: readonly string[];
  /** Every selectable key, in the collection's order. */
  keys: readonly string[];
  /** The option acted on. Unused by `all` and `clear`. */
  key?: string | undefined;
  /** Where a range starts. Falls back to `key`, which makes a range of one. */
  anchor?: string | undefined;
  disabled?: ((key: string) => boolean) | undefined;
  /** A required control cannot be emptied by pressing its chosen option again. */
  disallowEmpty?: boolean | undefined;
  /** Refuses `all`, for a set where selecting everything means nothing. */
  disallowSelectAll?: boolean | undefined;
}

export interface SelectionResult {
  selected: readonly string[];
  /** Where the next range starts. Unchanged by `all` and `clear`. */
  anchor: string | undefined;
  /** Whether anything moved. A request that changes nothing emits nothing. */
  changed: boolean;
}

function order(keys: readonly string[], chosen: ReadonlySet<string>) {
  return keys.filter((key) => chosen.has(key));
}

function same(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

export function nextSelection(request: SelectionRequest): SelectionResult {
  const {
    mode,
    behavior = 'toggle',
    selected,
    keys,
    key,
    anchor,
    disabled,
    disallowEmpty = false,
    disallowSelectAll = false,
  } = request;

  const unchanged: SelectionResult = { selected, anchor, changed: false };
  if (mode === 'none') return unchanged;

  const isDisabled = (candidate: string) => disabled !== undefined && disabled(candidate) === true;
  /* A selection the consumer handed in may hold a key the collection no longer
     has — a filtered list, a page that has moved on. It survives untouched
     unless the reader acts on it, because dropping it silently would delete a
     choice nobody asked to delete. */
  const current = new Set(selected);

  const held = new Set(keys);
  const settle = (chosen: Set<string>, nextAnchor: string | undefined): SelectionResult => {
    if (chosen.size === 0 && disallowEmpty && selected.length > 0) return unchanged;
    const ordered = order(keys, chosen);
    /* Keys the collection does not hold keep their place at the end, in the
       order they arrived. */
    const outside = selected.filter((candidate) => chosen.has(candidate) && !held.has(candidate));
    const result = [...ordered, ...outside];
    return same(result, selected) && nextAnchor === anchor
      ? unchanged
      : { selected: result, anchor: nextAnchor, changed: !same(result, selected) };
  };

  if (request.action === 'clear') {
    return settle(new Set(), anchor);
  }

  if (request.action === 'all') {
    if (mode !== 'multiple' || disallowSelectAll) return unchanged;
    const selectable = keys.filter((candidate) => !isDisabled(candidate));
    const everything = selectable.every((candidate) => current.has(candidate));
    /* Pressing it a second time clears, which is the pattern's optional second
       half: "Optionally, if all options are selected, it may also unselect all
       options." Without it the shortcut is a one-way door. */
    return settle(everything ? new Set() : new Set(selectable), anchor);
  }

  if (key === undefined || isDisabled(key)) return unchanged;

  if (request.action === 'range') {
    const from = keys.indexOf(anchor ?? key);
    const to = keys.indexOf(key);
    if (from === -1 || to === -1) return unchanged;
    const [low, high] = from <= to ? [from, to] : [to, from];
    const span = keys.slice(low, high + 1).filter((candidate) => !isDisabled(candidate));

    if (mode === 'single') return settle(new Set([key]), key);
    /* `toggle` adds the span to what the reader already had; `replace` makes
       the span the selection, which is what a shift-click does in a file list.
       The anchor does not move: a range is measured from where it started, so
       Shift and an arrow held down grows one selection rather than four. */
    return settle(behavior === 'replace' ? new Set(span) : new Set([...current, ...span]), anchor);
  }

  if (mode === 'single') {
    if (current.has(key) && current.size === 1) {
      return request.action === 'replace' ? unchanged : settle(new Set(), key);
    }
    return settle(new Set([key]), key);
  }

  if (request.action === 'replace' || behavior === 'replace') {
    if (current.size === 1 && current.has(key) && request.action !== 'replace') {
      return settle(new Set(), key);
    }
    return settle(new Set([key]), key);
  }

  const chosen = new Set(current);
  if (chosen.has(key)) chosen.delete(key);
  else chosen.add(key);
  return settle(chosen, key);
}
