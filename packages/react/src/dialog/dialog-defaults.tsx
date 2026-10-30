import { createContext, useContext } from 'react';

import type { DialogDefaults, DialogDefaultsProviderProps } from './dialog.types';

const FALLBACK: DialogDefaults = {
  back: 'close',
  escape: 'close',
  fullScreen: 'narrow',
  modal: true,
  mount: 'active',
  outsidePress: 'close',
  placement: 'center',
  scroll: 'content',
  size: 'md',
  surface: 'panel',
};

const DialogDefaultsContext = createContext<DialogDefaults>(FALLBACK);

/** What a dialog renders as here, before it states anything of its own. */
export function useDialogDefaults(): DialogDefaults {
  return useContext(DialogDefaultsContext);
}

/**
 * An application decides once how its dialogs behave and look, rather than
 * repeating the same eight props on every one in a product. Angular Material
 * is the only surveyed implementation with an equivalent — `MAT_DIALOG_DEFAULT_OPTIONS`
 * — and no React library in the set has one at all.
 *
 * A dialog that states any of them itself still wins, because an explicit
 * consumer value always does.
 */
export function DialogDefaultsProvider({ children, ...defaults }: DialogDefaultsProviderProps) {
  const inherited = useDialogDefaults();

  return (
    <DialogDefaultsContext.Provider
      value={{
        back: defaults.back ?? inherited.back,
        escape: defaults.escape ?? inherited.escape,
        fullScreen: defaults.fullScreen ?? inherited.fullScreen,
        modal: defaults.modal ?? inherited.modal,
        mount: defaults.mount ?? inherited.mount,
        outsidePress: defaults.outsidePress ?? inherited.outsidePress,
        placement: defaults.placement ?? inherited.placement,
        scroll: defaults.scroll ?? inherited.scroll,
        size: defaults.size ?? inherited.size,
        surface: defaults.surface ?? inherited.surface,
      }}
    >
      {children}
    </DialogDefaultsContext.Provider>
  );
}
