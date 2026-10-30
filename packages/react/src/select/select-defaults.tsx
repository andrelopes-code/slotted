import { setPortalContainer } from '@slotted/core/portal';
import { createContext, useContext, useEffect } from 'react';

import type { SelectDefaults, SelectDefaultsProviderProps } from './select.types';

/**
 * The numbers, and why they are these numbers.
 *
 * `side` and `align` hang the popup from the start edge of its own control, so
 * the value in the control and the labels in the list share one edge.
 * `sideOffset` is four where `menu`'s is zero: a menu's gap is its layer's own
 * padding, needed so a pointer travelling into a submenu never crosses page,
 * and this family has no submenu and no grace area to protect. Four is enough
 * for the popup's shadow to read as a separate surface and small enough that
 * the two still belong to each other.
 *
 * `loop` is `false` where `menu`'s is `true`. A menu is a short list of
 * commands and a wrap is a convenience; a list of a hundred options that jumps
 * from the last to the first loses the reader's place, and the APG's own
 * select-only example does not wrap.
 *
 * `clearable` is `false` where `combobox`'s is `true`. A select always holds one
 * of its own options once a reader has chosen; a combobox holds whatever was
 * typed, and taking it back is the commonest thing a reader does to one.
 *
 * `width` is `content`: the popup is never narrower than its control and grows
 * when an option needs it, so a narrow control does not wrap its option labels.
 *
 * `search` is `false`. It is the one capability here that changes the popup's
 * role, moves DOM focus into the layer and takes three keys back from the key
 * table, and a select of six options is worse for having a field above them.
 * `highlightMatch` is `true` beside it: a reader who asked for a search asked
 * to be shown what matched, and `combobox` marks by default for the same
 * reason.
 */
export const SELECT_FALLBACK: SelectDefaults = {
  align: 'start',
  alignOffset: 0,
  clearable: false,
  highlightMatch: true,
  search: false,
  closeOnEscape: true,
  closeOnOutsidePress: true,
  closeOnSelect: true,
  collisionPadding: 8,
  disabled: false,
  flip: true,
  fullWidth: true,
  hideWhenDetached: true,
  invalid: false,
  loading: false,
  loop: false,
  mount: 'active',
  multiple: false,
  portal: true,
  readOnly: false,
  required: false,
  shift: true,
  side: 'bottom',
  sideOffset: 4,
  size: 'md',
  strategy: 'absolute',
  typeahead: true,
  typeaheadTimeout: 500,
  variant: 'outline',
  width: 'content',
};

const SelectDefaultsContext = createContext<SelectDefaults>(SELECT_FALLBACK);

/** The defaults in force here. A select reads it; a consumer rarely needs to. */
export function useSelectDefaults(): SelectDefaults {
  return useContext(SelectDefaultsContext);
}

/**
 * The decisions an application takes once, in its bootstrap, rather than on
 * every select it renders. A select that states one of them itself still wins,
 * which is what lets a dense table's filter differ from a form's field.
 */
export function SelectDefaultsProvider({
  children,
  container,
  ...overrides
}: SelectDefaultsProviderProps) {
  const inherited = useSelectDefaults();

  useEffect(() => {
    if (container === undefined) return;
    setPortalContainer(container);
    return () => setPortalContainer(null);
  }, [container]);

  const value: SelectDefaults = {
    align: overrides.align ?? inherited.align,
    alignOffset: overrides.alignOffset ?? inherited.alignOffset,
    clearable: overrides.clearable ?? inherited.clearable,
    highlightMatch: overrides.highlightMatch ?? inherited.highlightMatch,
    search: overrides.search ?? inherited.search,
    closeOnEscape: overrides.closeOnEscape ?? inherited.closeOnEscape,
    closeOnOutsidePress: overrides.closeOnOutsidePress ?? inherited.closeOnOutsidePress,
    closeOnSelect: overrides.closeOnSelect ?? inherited.closeOnSelect,
    collisionPadding: overrides.collisionPadding ?? inherited.collisionPadding,
    disabled: overrides.disabled ?? inherited.disabled,
    flip: overrides.flip ?? inherited.flip,
    fullWidth: overrides.fullWidth ?? inherited.fullWidth,
    hideWhenDetached: overrides.hideWhenDetached ?? inherited.hideWhenDetached,
    invalid: overrides.invalid ?? inherited.invalid,
    loading: overrides.loading ?? inherited.loading,
    loop: overrides.loop ?? inherited.loop,
    mount: overrides.mount ?? inherited.mount,
    multiple: overrides.multiple ?? inherited.multiple,
    portal: overrides.portal ?? inherited.portal,
    readOnly: overrides.readOnly ?? inherited.readOnly,
    required: overrides.required ?? inherited.required,
    shift: overrides.shift ?? inherited.shift,
    side: overrides.side ?? inherited.side,
    sideOffset: overrides.sideOffset ?? inherited.sideOffset,
    size: overrides.size ?? inherited.size,
    strategy: overrides.strategy ?? inherited.strategy,
    typeahead: overrides.typeahead ?? inherited.typeahead,
    typeaheadTimeout: overrides.typeaheadTimeout ?? inherited.typeaheadTimeout,
    variant: overrides.variant ?? inherited.variant,
    width: overrides.width ?? inherited.width,
  };

  return <SelectDefaultsContext.Provider value={value}>{children}</SelectDefaultsContext.Provider>;
}
