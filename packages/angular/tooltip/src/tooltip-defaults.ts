import { setPortalContainer } from '@slotted/core/portal';
import type { ChangeRequest } from '@slotted/core/state';
import { inject, Injectable, InjectionToken } from '@angular/core';
import type { Provider } from '@angular/core';

/**
 * How the hint is painted. `inverse` is a surface opposite to the page, which
 * separates itself in every scheme without an edge; `surface` is the raised
 * panel with a hairline, for a page that is already dark.
 */
export type TooltipVariant = 'inverse' | 'surface';

/** The type step the hint is set at. Both move with density. */
export type TooltipSize = 'sm' | 'md';

/**
 * What the tooltip is to its trigger. `description` writes `aria-describedby`;
 * `label` writes `aria-labelledby` instead, which is the icon-only button whose
 * only words are the tooltip's — described by it and named by nothing, that
 * button is announced as "button".
 *
 * `none` writes neither and hides the content from the reader: the hint that
 * repeats words the trigger already carries is read twice under either
 * reference.
 */
export type TooltipDescribes = 'description' | 'label' | 'none';

/** What opens it. `hover` also opens on keyboard focus, and instantly. */
export type TooltipOpenOn = 'hover' | 'focus' | 'manual';

/** The edge of the anchor the layer prefers. The two logical values mirror. */
export type TooltipSide = 'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right';

/** Where the layer sits along the side it took. */
export type TooltipAlign = 'start' | 'center' | 'end';

/** When the layer exists. `describes="label"` forces `eager`. */
export type TooltipMount = 'active' | 'lazy' | 'eager';

/** `fixed` for a layer inside `overflow: hidden`, `absolute` for one inside a transform. */
export type TooltipStrategy = 'absolute' | 'fixed';

/**
 * What `openChangeRequest` carries: the value asked for, the previous one, the
 * reason, the originating event and `cancel()`. The name React's binding gives
 * the same request.
 */
export type TooltipChangeRequest = ChangeRequest<boolean>;

/** Why the hint opened or closed. */
export type TooltipOpenReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'escape' | 'blur' | 'programmatic'
>;

/** What an application sets once for every tooltip under it. */
export interface TooltipDefaults {
  align: TooltipAlign;
  alignOffset: number;
  arrow: boolean;
  arrowPadding: number;
  closeDelay: number;
  closeOnPress: boolean;
  collisionPadding: number;
  describes: TooltipDescribes;
  flip: boolean;
  groupDelay: number;
  hideWhenDetached: boolean;
  hoverable: boolean;
  mount: TooltipMount;
  openDelay: number;
  openOn: TooltipOpenOn;
  portal: boolean;
  shift: boolean;
  side: TooltipSide;
  sideOffset: number;
  size: TooltipSize;
  strategy: TooltipStrategy;
  touchDelay: number;
  variant: TooltipVariant;
  /** Opens only while the trigger's own content is cut by its box. */
  whenClipped: boolean;
}

/**
 * The numbers, and why they are these numbers.
 *
 * `openDelay` is long enough that a pointer crossing a toolbar opens nothing
 * and short enough that a deliberate hover is answered; `closeDelay` is the
 * window the pointer has to travel onto the layer, and zero makes a hoverable
 * tooltip unreachable; `groupDelay` is what stops a row of icon buttons
 * charging the warmup once per button.
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

export const TOOLTIP_DEFAULTS = new InjectionToken<TooltipDefaults>('slotted tooltip defaults', {
  providedIn: 'root',
  factory: () => TOOLTIP_FALLBACK,
});

/**
 * When the last tooltip in this injector closed. A tooltip asked to open inside
 * `groupDelay` of that moment opens in the same task, so reading a row of icon
 * buttons pays the warmup once. It is held per injector rather than per
 * tooltip, because a value held per tooltip could not say what "the next one"
 * means.
 */
@Injectable({ providedIn: 'root' })
export class SlTooltipGroup {
  lastClosedAt = 0;
}

/**
 * An application decides once how its tooltips behave and look. A tooltip that
 * states any of them itself still wins.
 *
 * What is stated here is written over the defaults already in force rather than
 * over the fallback, which is what React's provider does and what a family that
 * sets two axes for itself needs: a column header asking for `describes="none"`
 * would otherwise hand the application's own delays back to the fallback.
 *
 * The group is provided beside the defaults, so a component that sets its own
 * defaults also gets its own warmup window — the same scoping React's provider
 * gives.
 */
export function provideTooltipDefaults(defaults: Partial<TooltipDefaults>): Provider[] {
  return [
    {
      provide: TOOLTIP_DEFAULTS,
      useFactory: (): TooltipDefaults => ({
        ...(inject(TOOLTIP_DEFAULTS, { optional: true, skipSelf: true }) ?? TOOLTIP_FALLBACK),
        ...defaults,
      }),
    },
    SlTooltipGroup,
  ];
}

/** What a tooltip renders as here, before it states anything of its own. */
export function injectTooltipDefaults(): TooltipDefaults {
  return inject(TOOLTIP_DEFAULTS);
}

/**
 * Whether `provideSlottedPortalContainer` named a container in this injector.
 * A factory runs only when something injects its token, so `slTooltipLayer`
 * injects this one before it builds a layer.
 */
export const SLOTTED_PORTAL_CONTAINER = new InjectionToken<boolean>('slotted portal container');

/**
 * Where every layer is rendered, for the whole application. It calls
 * `setPortalContainer` from `@slotted/core/portal`, which is per document, so
 * an application shell that builds its own stacking context names it once.
 */
export function provideSlottedPortalContainer(container: () => Element | null): Provider {
  return {
    provide: SLOTTED_PORTAL_CONTAINER,
    useFactory: () => {
      setPortalContainer(container());
      return true;
    },
  };
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences have to
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlTooltipIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-tooltip-${this.count}`;
  }
}
