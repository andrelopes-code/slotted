import { createContext, useContext } from 'react';

import type { TreeDefaults, TreeDefaultsProviderProps } from './tree.types';

/**
 * The defaults the contract declares, and the three that are not obvious.
 *
 * `expandOn` is `row`, which is what Zag defaults to and what a file browser
 * does: the band is a larger target than any chevron, and a reader who wants
 * the two apart says `expander`.
 *
 * `selectionIndicator` is `auto` rather than a mode, because the right mark
 * depends on the mode beside it: a box for a set the reader ticks, a highlight
 * for the one thing they chose. Stating either as the default would be wrong
 * half the time.
 *
 * `loop` is off, as it is in `listbox`: a tree of two hundred rows that jumps
 * from the last to the first loses the reader.
 */
const FALLBACK: TreeDefaults = {
  disabled: false,
  disallowEmptySelection: false,
  disallowSelectAll: false,
  expandOn: 'row',
  focusMode: 'auto',
  guides: true,
  itemSize: 32,
  loop: false,
  navigateDisabled: false,
  overscan: 4,
  pageSize: 10,
  selectOnFocus: false,
  selectionBehavior: 'toggle',
  selectionCascade: 'none',
  selectionIndicator: 'auto',
  selectionMode: 'single',
  size: 'md',
  structure: 'auto',
  typeahead: true,
  typeaheadTimeout: 500,
  variant: 'plain',
  virtual: false,
};

const TreeDefaultsContext = createContext<TreeDefaults>(FALLBACK);

/** What a tree renders as here, before it states anything of its own. */
export function useTreeDefaults(): TreeDefaults {
  return useContext(TreeDefaultsContext);
}

/**
 * An application decides once how its trees behave, rather than repeating
 * twenty props on every hierarchy in a product. A tree that states any of them
 * itself still wins: an explicit value is never overridden by context.
 */
export function TreeDefaultsProvider({ children, ...defaults }: TreeDefaultsProviderProps) {
  const inherited = useTreeDefaults();

  return (
    <TreeDefaultsContext.Provider
      value={{
        disabled: defaults.disabled ?? inherited.disabled,
        disallowEmptySelection: defaults.disallowEmptySelection ?? inherited.disallowEmptySelection,
        disallowSelectAll: defaults.disallowSelectAll ?? inherited.disallowSelectAll,
        expandOn: defaults.expandOn ?? inherited.expandOn,
        focusMode: defaults.focusMode ?? inherited.focusMode,
        guides: defaults.guides ?? inherited.guides,
        itemSize: defaults.itemSize ?? inherited.itemSize,
        loop: defaults.loop ?? inherited.loop,
        navigateDisabled: defaults.navigateDisabled ?? inherited.navigateDisabled,
        overscan: defaults.overscan ?? inherited.overscan,
        pageSize: defaults.pageSize ?? inherited.pageSize,
        selectOnFocus: defaults.selectOnFocus ?? inherited.selectOnFocus,
        selectionBehavior: defaults.selectionBehavior ?? inherited.selectionBehavior,
        selectionCascade: defaults.selectionCascade ?? inherited.selectionCascade,
        selectionIndicator: defaults.selectionIndicator ?? inherited.selectionIndicator,
        selectionMode: defaults.selectionMode ?? inherited.selectionMode,
        size: defaults.size ?? inherited.size,
        structure: defaults.structure ?? inherited.structure,
        typeahead: defaults.typeahead ?? inherited.typeahead,
        typeaheadTimeout: defaults.typeaheadTimeout ?? inherited.typeaheadTimeout,
        variant: defaults.variant ?? inherited.variant,
        virtual: defaults.virtual ?? inherited.virtual,
      }}
    >
      {children}
    </TreeDefaultsContext.Provider>
  );
}
