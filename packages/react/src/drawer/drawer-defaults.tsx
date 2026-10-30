import { createContext, useContext } from 'react';

import type { DrawerDefaults, DrawerDefaultsProviderProps } from './drawer.types';

const FALLBACK: DrawerDefaults = {
  back: 'close',
  escape: 'close',
  modal: true,
  mode: 'overlay',
  mount: 'active',
  outsidePress: 'close',
  side: 'end',
  size: undefined,
  drag: 'panel',
};

const DrawerDefaultsContext = createContext<DrawerDefaults>(FALLBACK);

/** What a drawer renders as here, before it states anything of its own. */
export function useDrawerDefaults(): DrawerDefaults {
  return useContext(DrawerDefaultsContext);
}

/**
 * An application decides once how its drawers behave and look, rather than
 * repeating the same seven props on every one in a product. Ant reaches the
 * same place through `ConfigProvider` and Angular Material through one
 * injection token; no React drawer in the surveyed set has an equivalent.
 *
 * A drawer that states any of them itself still wins, because an explicit
 * consumer value always does.
 */
export function DrawerDefaultsProvider({ children, ...defaults }: DrawerDefaultsProviderProps) {
  const inherited = useDrawerDefaults();

  return (
    <DrawerDefaultsContext.Provider
      value={{
        back: defaults.back ?? inherited.back,
        escape: defaults.escape ?? inherited.escape,
        modal: defaults.modal ?? inherited.modal,
        mode: defaults.mode ?? inherited.mode,
        mount: defaults.mount ?? inherited.mount,
        outsidePress: defaults.outsidePress ?? inherited.outsidePress,
        side: defaults.side ?? inherited.side,
        size: defaults.size ?? inherited.size,
        drag: defaults.drag ?? inherited.drag,
      }}
    >
      {children}
    </DrawerDefaultsContext.Provider>
  );
}
