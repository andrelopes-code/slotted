import { setPortalContainer } from '@slotted/core/portal';
import { createContext, useContext, useEffect, useRef } from 'react';

import type { TooltipDefaults, TooltipDefaultsProviderProps } from './tooltip.types';

/**
 * The numbers, and why they are these numbers.
 *
 * `openDelay` is long enough that a pointer crossing a toolbar opens nothing
 * and short enough that a deliberate hover is answered before the reader gives
 * up; the surveyed field spans 600 to 1500 and disagrees with itself.
 * `closeDelay` is the window the pointer has to travel onto the layer, and zero
 * makes a hoverable tooltip unreachable. `groupDelay` is what stops a row of
 * icon buttons charging the warmup once per button.
 */
export const TOOLTIP_FALLBACK: TooltipDefaults = {
  align: 'center',
  alignOffset: 0,
  arrow: true,
  arrowPadding: 8,
  closeDelay: 150,
  closeOnPress: true,
  collisionPadding: 8,
  describes: 'description',
  flip: true,
  groupDelay: 400,
  hideWhenDetached: true,
  hoverable: true,
  mount: 'active',
  openDelay: 600,
  openOn: 'hover',
  portal: true,
  shift: true,
  side: 'top',
  sideOffset: 0,
  size: 'md',
  strategy: 'absolute',
  touchDelay: 500,
  variant: 'inverse',
  whenClipped: false,
};

/**
 * When the last tooltip under this provider closed.
 *
 * It is one mutable record shared by every tooltip in the subtree, and it is
 * the whole of the group behavior: a tooltip asked to open inside
 * `groupDelay` of that moment opens in the same task instead of waiting. Held
 * per provider rather than per tooltip, because a value held per tooltip could
 * not say what "the next one" means.
 */
export interface TooltipGroup {
  lastClosedAt: number;
}

interface TooltipDefaultsContextValue {
  defaults: TooltipDefaults;
  group: TooltipGroup;
}

const TooltipDefaultsContext = createContext<TooltipDefaultsContextValue>({
  defaults: TOOLTIP_FALLBACK,
  group: { lastClosedAt: 0 },
});

/** What a tooltip renders as here, before it states anything of its own. */
export function useTooltipDefaults(): TooltipDefaults {
  return useContext(TooltipDefaultsContext).defaults;
}

/** The window the next tooltip in this subtree opens instantly inside. */
export function useTooltipGroup(): TooltipGroup {
  return useContext(TooltipDefaultsContext).group;
}

/**
 * An application decides once how its tooltips behave and look, rather than
 * repeating the same twenty props on every one in a product. A tooltip that
 * states any of them itself still wins.
 *
 * `container` is the configuration-once the capability reference asks for on
 * behalf of the portal: an application shell that builds its own stacking
 * context names it here, and `document.body` is the default in its absence.
 */
export function TooltipDefaultsProvider({
  children,
  container,
  ...defaults
}: TooltipDefaultsProviderProps) {
  const inherited = useTooltipDefaults();

  /**
   * The group is created once per provider and never replaced, so a re-render
   * caused by anything at all does not reset the window a reader is inside.
   * The value object around it is rebuilt freely: a provider sits at the root
   * of an application and re-renders about as often as the application does.
   */
  const group = useRef<TooltipGroup>({ lastClosedAt: 0 });
  const value: TooltipDefaultsContextValue = {
    defaults: { ...inherited, ...stated(defaults) },
    group: group.current,
  };

  /**
   * The portal container belongs to the document rather than to the React tree,
   * so it is set in an effect and given back when the provider leaves.
   */
  useEffect(() => {
    if (container === undefined) return;
    setPortalContainer(container);
    return () => setPortalContainer(null);
  }, [container]);

  return (
    <TooltipDefaultsContext.Provider value={value}>{children}</TooltipDefaultsContext.Provider>
  );
}

/**
 * A provider that states nothing must not overwrite what it inherited with
 * `undefined`, which is what a plain spread of its props would do.
 */
function stated(defaults: Partial<TooltipDefaults>): Partial<TooltipDefaults> {
  const entries = Object.entries(defaults).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as Partial<TooltipDefaults>;
}
