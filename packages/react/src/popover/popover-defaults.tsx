import { setPortalContainer } from '@slotted/core/portal';
import { createContext, useContext, useEffect } from 'react';

import type { PopoverDefaults, PopoverDefaultsProviderProps } from './popover.types';

/**
 * `arrowPadding` is larger than the tooltip's because the panel's corner radius
 * is larger, and a `start`-aligned panel would otherwise put the arrow on the
 * curve. `hideWhenDetached` is off: a task the reader is halfway through must
 * not blink because the row behind it scrolled, which is the one asymmetry
 * between this family and `tooltip`.
 */
export const POPOVER_FALLBACK: PopoverDefaults = {
  align: 'center',
  alignOffset: 0,
  arrow: true,
  arrowPadding: 12,
  autoFocus: true,
  closeOnEscape: true,
  closeOnOutsidePress: true,
  collisionPadding: 8,
  flip: true,
  hideWhenDetached: false,
  mount: 'active',
  portal: true,
  shift: true,
  side: 'bottom',
  sideOffset: 0,
  size: 'md',
  strategy: 'absolute',
  width: 'auto',
};

const PopoverDefaultsContext = createContext<PopoverDefaults>(POPOVER_FALLBACK);

/** What a popover renders as here, before it states anything of its own. */
export function usePopoverDefaults(): PopoverDefaults {
  return useContext(PopoverDefaultsContext);
}

/**
 * An application decides once how its popovers behave and look. A popover that
 * states any of them itself still wins. The close control's accessible name
 * comes from the language in force (`SlottedProvider`).
 */
export function PopoverDefaultsProvider({
  children,
  container,
  ...defaults
}: PopoverDefaultsProviderProps) {
  const inherited = usePopoverDefaults();
  const value: PopoverDefaults = { ...inherited, ...stated(defaults) };

  useEffect(() => {
    if (container === undefined) return;
    setPortalContainer(container);
    return () => setPortalContainer(null);
  }, [container]);

  return (
    <PopoverDefaultsContext.Provider value={value}>{children}</PopoverDefaultsContext.Provider>
  );
}

/**
 * A provider that states nothing must not overwrite what it inherited with
 * `undefined`, which is what a plain spread of its props would do.
 */
function stated(defaults: Partial<PopoverDefaults>): Partial<PopoverDefaults> {
  const entries = Object.entries(defaults).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as Partial<PopoverDefaults>;
}
