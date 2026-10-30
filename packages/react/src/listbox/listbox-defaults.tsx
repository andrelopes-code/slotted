import { createContext, useContext } from 'react';

import type { ListboxDefaults, ListboxDefaultsProviderProps } from './listbox.types';

/**
 * The defaults the contract declares, and the two that are not obvious.
 *
 * `loop` is off: React Aria's `shouldFocusWrap` and Zag's `loopFocus` both
 * default off and only the Angular CDK defaults on, and a list of two hundred
 * options that jumps from the last to the first loses the reader.
 *
 * `selectOnFocus` is off because the pattern names the cost — "having selection
 * follow focus can be very helpful in some circumstances and can severely
 * degrade accessibility in others" — so the safe answer is the default and the
 * axis is what a single-select picker turns on.
 */
const FALLBACK: ListboxDefaults = {
  columns: 1,
  disallowEmptySelection: false,
  disallowSelectAll: false,
  focusMode: 'auto',
  indicator: 'check',
  loadMoreThreshold: 0,
  loop: false,
  navigateDisabled: false,
  orientation: 'vertical',
  overscan: 4,
  pageSize: 10,
  rows: 7,
  selectOnFocus: false,
  selectionBehavior: 'toggle',
  selectionMode: 'single',
  size: 'md',
  typeahead: true,
  typeaheadTimeout: 500,
  variant: 'framed',
};

const ListboxDefaultsContext = createContext<ListboxDefaults>(FALLBACK);

/** What a listbox renders as here, before it states anything of its own. */
export function useListboxDefaults(): ListboxDefaults {
  return useContext(ListboxDefaultsContext);
}

/**
 * An application decides once how its listboxes behave, rather than repeating
 * nineteen props on every collection in a product. A listbox that states any of
 * them itself still wins: an explicit value is never overridden by context.
 *
 * Two of the four surveyed component implementations have no answer to this at
 * all, so an application using them repeats `shouldFocusWrap` and
 * `disallowEmptySelection` at every call site or lives with two behaviours.
 */
export function ListboxDefaultsProvider({ children, ...defaults }: ListboxDefaultsProviderProps) {
  const inherited = useListboxDefaults();

  return (
    <ListboxDefaultsContext.Provider
      value={{
        columns: defaults.columns ?? inherited.columns,
        disallowEmptySelection: defaults.disallowEmptySelection ?? inherited.disallowEmptySelection,
        disallowSelectAll: defaults.disallowSelectAll ?? inherited.disallowSelectAll,
        focusMode: defaults.focusMode ?? inherited.focusMode,
        indicator: defaults.indicator ?? inherited.indicator,
        loadMoreThreshold: defaults.loadMoreThreshold ?? inherited.loadMoreThreshold,
        loop: defaults.loop ?? inherited.loop,
        navigateDisabled: defaults.navigateDisabled ?? inherited.navigateDisabled,
        orientation: defaults.orientation ?? inherited.orientation,
        overscan: defaults.overscan ?? inherited.overscan,
        pageSize: defaults.pageSize ?? inherited.pageSize,
        rows: defaults.rows ?? inherited.rows,
        selectOnFocus: defaults.selectOnFocus ?? inherited.selectOnFocus,
        selectionBehavior: defaults.selectionBehavior ?? inherited.selectionBehavior,
        selectionMode: defaults.selectionMode ?? inherited.selectionMode,
        size: defaults.size ?? inherited.size,
        typeahead: defaults.typeahead ?? inherited.typeahead,
        typeaheadTimeout: defaults.typeaheadTimeout ?? inherited.typeaheadTimeout,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </ListboxDefaultsContext.Provider>
  );
}
