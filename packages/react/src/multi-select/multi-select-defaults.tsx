import { setPortalContainer } from '@slotted/core/portal';
import { createContext, useContext, useEffect } from 'react';

import type { MultiSelectDefaults, MultiSelectDefaultsProviderProps } from './multi-select.types';

/**
 * The numbers, and why they are these numbers.
 *
 * `closeOnSelect` is `false`, which is the opposite of `select`'s and
 * `combobox`'s. The set is built by several presses, and the pattern's own
 * `Enter` clause describes this family: "add the accepted value to a list of
 * message recipients and then clear the combobox so the user can add another
 * recipient".
 *
 * `creatable` is `false`. A control that turns anything typed into a value is
 * a different promise from one that offers a known set, and a consumer who
 * wants the first says so.
 *
 * `commitOnBlur` is `true` and `addOnPaste` is `true`: both are what a reader
 * who typed or pasted something and then left expects to have happened. The
 * field's three surveyed answers to the first disagree, so it is an axis.
 *
 * `delimiters` is the comma alone. It is the one separator every surveyed
 * implementation ships, and a space would make a two-word value impossible to
 * type.
 *
 * `overflow` is `wrap`: the control grows by rows to three, then scrolls. The
 * one-line `collapse` is for a control in a table row, where the frame cannot
 * be allowed to grow.
 *
 * `openOn` is `input`: typing and a press on the input open the popup, and a
 * Tab into it does not, because a reader tabbing through a form is passing it.
 *
 * `max` is `null`. A limit is a rule about the consumer's data, and a family
 * that invented one would refuse a value for a reason nobody wrote.
 */
export const MULTI_SELECT_FALLBACK: MultiSelectDefaults = {
  addOnPaste: true,
  align: 'start',
  alignOffset: 0,
  allowDuplicates: false,
  chosenOptions: 'show',
  clearable: true,
  closeOnEscape: true,
  closeOnOutsidePress: true,
  closeOnSelect: false,
  collisionPadding: 8,
  commitOnBlur: true,
  creatable: false,
  delimiters: [','],
  disabled: false,
  editable: false,
  flip: true,
  fullWidth: true,
  hideWhenDetached: true,
  highlightMatch: true,
  invalid: false,
  loading: false,
  loop: false,
  max: null,
  mount: 'active',
  openOn: 'input',
  overflow: 'wrap',
  portal: true,
  readOnly: false,
  reorderable: false,
  required: false,
  shift: true,
  side: 'bottom',
  sideOffset: 4,
  size: 'md',
  strategy: 'absolute',
  variant: 'outline',
  width: 'content',
};

const MultiSelectDefaultsContext = createContext<MultiSelectDefaults>(MULTI_SELECT_FALLBACK);

/** The defaults in force here. The family reads it; a consumer rarely needs to. */
export function useMultiSelectDefaults(): MultiSelectDefaults {
  return useContext(MultiSelectDefaultsContext);
}

/**
 * The decisions an application takes once, in its bootstrap, rather than on
 * every control it renders. Its words come from the language in force
 * (`SlottedProvider`).
 */
export function MultiSelectDefaultsProvider({
  children,
  container,
  ...overrides
}: MultiSelectDefaultsProviderProps) {
  const inherited = useMultiSelectDefaults();

  useEffect(() => {
    if (container === undefined) return;
    setPortalContainer(container);
    return () => setPortalContainer(null);
  }, [container]);

  const value: MultiSelectDefaults = {
    addOnPaste: overrides.addOnPaste ?? inherited.addOnPaste,
    align: overrides.align ?? inherited.align,
    alignOffset: overrides.alignOffset ?? inherited.alignOffset,
    allowDuplicates: overrides.allowDuplicates ?? inherited.allowDuplicates,
    chosenOptions: overrides.chosenOptions ?? inherited.chosenOptions,
    clearable: overrides.clearable ?? inherited.clearable,
    closeOnEscape: overrides.closeOnEscape ?? inherited.closeOnEscape,
    closeOnOutsidePress: overrides.closeOnOutsidePress ?? inherited.closeOnOutsidePress,
    closeOnSelect: overrides.closeOnSelect ?? inherited.closeOnSelect,
    collisionPadding: overrides.collisionPadding ?? inherited.collisionPadding,
    commitOnBlur: overrides.commitOnBlur ?? inherited.commitOnBlur,
    creatable: overrides.creatable ?? inherited.creatable,
    delimiters: overrides.delimiters ?? inherited.delimiters,
    disabled: overrides.disabled ?? inherited.disabled,
    editable: overrides.editable ?? inherited.editable,
    flip: overrides.flip ?? inherited.flip,
    fullWidth: overrides.fullWidth ?? inherited.fullWidth,
    hideWhenDetached: overrides.hideWhenDetached ?? inherited.hideWhenDetached,
    highlightMatch: overrides.highlightMatch ?? inherited.highlightMatch,
    invalid: overrides.invalid ?? inherited.invalid,
    loading: overrides.loading ?? inherited.loading,
    loop: overrides.loop ?? inherited.loop,
    max: overrides.max ?? inherited.max,
    mount: overrides.mount ?? inherited.mount,
    openOn: overrides.openOn ?? inherited.openOn,
    overflow: overrides.overflow ?? inherited.overflow,
    portal: overrides.portal ?? inherited.portal,
    readOnly: overrides.readOnly ?? inherited.readOnly,
    reorderable: overrides.reorderable ?? inherited.reorderable,
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
    <MultiSelectDefaultsContext.Provider value={value}>
      {children}
    </MultiSelectDefaultsContext.Provider>
  );
}
