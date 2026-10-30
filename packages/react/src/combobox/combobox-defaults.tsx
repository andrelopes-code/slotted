import { setPortalContainer } from '@slotted/core/portal';
import { createContext, useContext, useEffect } from 'react';

import type { ComboboxDefaults, ComboboxDefaultsProviderProps } from './combobox.types';

/**
 * The numbers, and why they are these numbers.
 *
 * `autocomplete` is `list` — the popup shows what matches — rather than `both`,
 * whose completion string writes into the input as the reader types. `both` is
 * the only value with a visible artifact and it is also the one that surprises:
 * a reader typing `ma` into a list of names sees `Mark` appear under their
 * caret. It is one word away and it is not the default.
 *
 * `openOn` is `input`: the popup appears once there is something to filter, or
 * when the reader presses the input, which is what a reader typing or pointing
 * expects and what `focus` gets wrong for a form a reader is tabbing through.
 *
 * `autoHighlight` is `false`. Highlighting the first match means `Enter`
 * commits an option the reader never looked at, and the pattern is explicit
 * that a highlight and a selection are different things.
 *
 * `clearable` is `true` where `select`'s is `false`. A select holds one of its
 * own options once a reader has chosen; a combobox holds whatever was typed,
 * and taking it back is the commonest thing a reader does to one.
 *
 * `loop` is `false`, as `select`'s is: a filtered list of two hundred that
 * jumps from the last option to the first loses the reader's place.
 */
export const COMBOBOX_FALLBACK: ComboboxDefaults = {
  align: 'start',
  alignOffset: 0,
  allowsCustomValue: false,
  autocomplete: 'list',
  autoHighlight: false,
  clearable: true,
  closeOnEscape: true,
  closeOnOutsidePress: true,
  closeOnSelect: true,
  collisionPadding: 8,
  disabled: false,
  flip: true,
  fullWidth: true,
  hideWhenDetached: true,
  highlightMatch: true,
  invalid: false,
  loading: false,
  loop: false,
  mount: 'active',
  openOn: 'input',
  portal: true,
  readOnly: false,
  required: false,
  shift: true,
  side: 'bottom',
  sideOffset: 4,
  size: 'md',
  strategy: 'absolute',
  variant: 'outline',
  width: 'content',
};

const ComboboxDefaultsContext = createContext<ComboboxDefaults>(COMBOBOX_FALLBACK);

/** The defaults in force here. A combobox reads it; a consumer rarely needs to. */
export function useComboboxDefaults(): ComboboxDefaults {
  return useContext(ComboboxDefaultsContext);
}

/**
 * The decisions an application takes once, in its bootstrap, rather than on
 * every combobox it renders. Its words come from the language in force
 * (`SlottedProvider`).
 */
export function ComboboxDefaultsProvider({
  children,
  container,
  ...overrides
}: ComboboxDefaultsProviderProps) {
  const inherited = useComboboxDefaults();

  useEffect(() => {
    if (container === undefined) return;
    setPortalContainer(container);
    return () => setPortalContainer(null);
  }, [container]);

  const value: ComboboxDefaults = {
    align: overrides.align ?? inherited.align,
    alignOffset: overrides.alignOffset ?? inherited.alignOffset,
    allowsCustomValue: overrides.allowsCustomValue ?? inherited.allowsCustomValue,
    autocomplete: overrides.autocomplete ?? inherited.autocomplete,
    autoHighlight: overrides.autoHighlight ?? inherited.autoHighlight,
    clearable: overrides.clearable ?? inherited.clearable,
    closeOnEscape: overrides.closeOnEscape ?? inherited.closeOnEscape,
    closeOnOutsidePress: overrides.closeOnOutsidePress ?? inherited.closeOnOutsidePress,
    closeOnSelect: overrides.closeOnSelect ?? inherited.closeOnSelect,
    collisionPadding: overrides.collisionPadding ?? inherited.collisionPadding,
    disabled: overrides.disabled ?? inherited.disabled,
    flip: overrides.flip ?? inherited.flip,
    fullWidth: overrides.fullWidth ?? inherited.fullWidth,
    hideWhenDetached: overrides.hideWhenDetached ?? inherited.hideWhenDetached,
    highlightMatch: overrides.highlightMatch ?? inherited.highlightMatch,
    invalid: overrides.invalid ?? inherited.invalid,
    loading: overrides.loading ?? inherited.loading,
    loop: overrides.loop ?? inherited.loop,
    mount: overrides.mount ?? inherited.mount,
    openOn: overrides.openOn ?? inherited.openOn,
    portal: overrides.portal ?? inherited.portal,
    readOnly: overrides.readOnly ?? inherited.readOnly,
    required: overrides.required ?? inherited.required,
    shift: overrides.shift ?? inherited.shift,
    side: overrides.side ?? inherited.side,
    sideOffset: overrides.sideOffset ?? inherited.sideOffset,
    size: overrides.size ?? inherited.size,
    strategy: overrides.strategy ?? inherited.strategy,
    variant: overrides.variant ?? inherited.variant,
    width: overrides.width ?? inherited.width,
  };

  return (
    <ComboboxDefaultsContext.Provider value={value}>{children}</ComboboxDefaultsContext.Provider>
  );
}
