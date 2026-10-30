import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/**
 * How the hint is painted. `inverse` is a surface opposite to the page, which
 * separates itself in every scheme without an edge; `surface` is the raised
 * panel with a hairline, for a page that is already dark or a hint of two
 * lines that should read as a small panel.
 */
export type TooltipVariant = 'inverse' | 'surface';

/** The type step the hint is set at. Both move with density. */
export type TooltipSize = 'sm' | 'md';

/**
 * What the tooltip is to its trigger. `description` writes `aria-describedby`,
 * which is right for a labelled control with an extra sentence about it;
 * `label` writes `aria-labelledby` instead, which is the icon-only button whose
 * only words are the tooltip's — described by it and named by nothing, that
 * button is announced as "button".
 *
 * `none` writes neither and hides the content from the reader. It is the hint
 * that repeats words the trigger already carries — the full name of a column
 * whose header is clipped — where a reference would have the reader hear the
 * same words twice.
 */
export type TooltipDescribes = 'description' | 'label' | 'none';

/**
 * What opens it. `hover` also opens on keyboard focus, and instantly, because a
 * delay a reader cannot shorten by moving faster is a delay for nothing.
 * `manual` binds neither and leaves the family entirely to `open`.
 */
export type TooltipOpenOn = 'hover' | 'focus' | 'manual';

/**
 * The edge of the anchor the layer prefers. `inline-start` and `inline-end`
 * resolve against the layer's own writing direction at every measurement.
 */
export type TooltipSide = 'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right';

/** Where the layer sits along the side it took. */
export type TooltipAlign = 'start' | 'center' | 'end';

/**
 * When the layer exists. `active` builds it on opening and drops it after the
 * exit, `lazy` builds it on the first open and keeps it, `eager` builds it up
 * front. `describes="label"` forces `eager`: an accessible name has to exist
 * before it is read.
 */
export type TooltipMount = 'active' | 'lazy' | 'eager';

/** `fixed` for a layer inside `overflow: hidden`, `absolute` for one inside a transform. */
export type TooltipStrategy = 'absolute' | 'fixed';

/** Why the hint opened or closed. */
export type TooltipOpenReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'escape' | 'blur' | 'programmatic'
>;

/** The request the family emits before the layer moves. */
export type TooltipChangeRequest = ChangeRequest<boolean>;

/**
 * The ref a `render` prop is handed.
 *
 * A callback rather than `Ref<HTMLElement>`, and the difference is what a
 * consumer feels: a callback taking `HTMLElement | null` is assignable to
 * `Ref<HTMLButtonElement>` — parameters are contravariant — while a
 * `RefObject<HTMLElement>` is not, so every `render` that returned a Button
 * would have had to cast. The family only ever calls it.
 */
export type PartRef = (node: HTMLElement | null) => void;

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
  /**
   * After one tooltip closes, the next opens with no delay inside this window,
   * so reading a row of icon buttons pays the warmup once. It is held by the
   * provider rather than by a tooltip, because a value held per tooltip could
   * not say what "the next one" means.
   */
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

export interface TooltipDefaultsProviderProps extends Partial<TooltipDefaults> {
  children?: ReactNode | undefined;
  /**
   * Where every layer under this provider is rendered. It calls
   * `setPortalContainer` from `@slotted/core/portal`, which is per document, so
   * an application shell that builds its own stacking context names it once.
   */
  container?: Element | null | undefined;
}

/** The three actions a consumer cannot express declaratively. */
export interface TooltipHandle {
  /** Opens now, with the reason `programmatic`, ignoring every delay. */
  open: () => void;
  /** Closes now, with the reason `programmatic`. */
  close: () => void;
  /** Measures and places the layer again. */
  reposition: () => void;
}

/** What the family hands its own trigger, layer, content and arrow. */
export interface TooltipContextValue {
  align: TooltipAlign;
  alignOffset: number;
  /** The element the family drew as the arrow, once it exists. */
  arrowNode: HTMLElement | null;
  arrowPadding: number;
  /** Whether pressing the trigger closes the hint. */
  closeOnPress: boolean;
  collisionPadding: number;
  contentId: string;
  describes: TooltipDescribes;
  disabled: boolean;
  flip: boolean;
  hideWhenDetached: boolean;
  hoverable: boolean;
  mount: TooltipMount;
  open: boolean;
  openOn: TooltipOpenOn;
  portal: boolean;
  /** Whether the layer has been open at least once, which is what `lazy` reads. */
  seen: boolean;
  setArrowNode: (node: HTMLElement | null) => void;
  setTriggerNode: (node: HTMLElement | null) => void;
  shift: boolean;
  showArrow: boolean;
  side: TooltipSide;
  sideOffset: number;
  size: TooltipSize;
  strategy: TooltipStrategy;
  /** Asks to open or close, carrying the reason and the originating event. */
  toggle: (next: boolean, reason: TooltipOpenReason, source?: unknown) => void;
  /** The pointer and focus handlers the trigger binds, already resolved. */
  triggerNode: HTMLElement | null;
  /** Opens after `openDelay`, or instantly inside the group window. */
  openAfterDelay: (source: unknown) => void;
  /** Closes after `closeDelay`. */
  closeAfterDelay: (source: unknown) => void;
  /** Cancels a pending open or close without moving anything. */
  cancelPending: () => void;
  /** Starts the long-press timer for a coarse pointer. */
  pressAndHold: (source: unknown) => void;
  variant: TooltipVariant;
}

/**
 * What `render` receives for the layer. `ref` is part of it because the
 * positioner, the presence and the dismissable layer all need the element the
 * consumer actually rendered.
 */
export interface TooltipLayerRootProps extends HTMLAttributes<HTMLElement> {
  ref?: PartRef | undefined;
  'data-align': TooltipAlign;
  'data-hoverable'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-size': TooltipSize;
  'data-ui': string;
  'data-variant': TooltipVariant;
}

/** What `render` receives for the painted surface. */
export interface TooltipContentRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  id: string;
  role: 'tooltip';
}

/**
 * What `render` receives for the trigger, which is the consumer's own element.
 * `ref` is part of it because the trigger is the anchor the layer is measured
 * against, so the family has to reach the element however it was rendered.
 */
export interface TooltipTriggerRootProps extends HTMLAttributes<HTMLElement> {
  ref?: PartRef | undefined;
  'data-open'?: '' | undefined;
  /**
   * Always present, and the content's identifier under `describes="label"`.
   * A required key is what lets an `IconButton` take these props whole as its
   * name source: under `label` the tooltip is the only name it has.
   */
  'aria-labelledby': string | undefined;
}

export interface TooltipProps {
  align?: TooltipAlign | undefined;
  alignOffset?: number | undefined;
  /** Whether the layer draws the arrow at all. */
  arrow?: boolean | undefined;
  arrowPadding?: number | undefined;
  children?: ReactNode | undefined;
  closeDelay?: number | undefined;
  /** Whether pressing the trigger closes the hint. */
  closeOnPress?: boolean | undefined;
  collisionPadding?: number | undefined;
  /** The value an uncontrolled tooltip starts from, read once. */
  defaultOpen?: boolean | undefined;
  describes?: TooltipDescribes | undefined;
  /** The tooltip never opens. The trigger's own `disabled` is the consumer's. */
  disabled?: boolean | undefined;
  flip?: boolean | undefined;
  /** Closes when the anchor leaves the screen or the document. Default `true`. */
  hideWhenDetached?: boolean | undefined;
  /**
   * Whether the pointer may travel onto the layer without it closing. WCAG 2.2
   * SC 1.4.13 Hoverable is a criterion before it is an option, so it is on.
   */
  hoverable?: boolean | undefined;
  mount?: TooltipMount | undefined;
  /** Called before the layer moves, with the request that carries the reason. */
  onOpenChange?: ((open: boolean, request: TooltipChangeRequest) => void) | undefined;
  /** Present means controlled, for the life of the component. */
  open?: boolean | undefined;
  openDelay?: number | undefined;
  openOn?: TooltipOpenOn | undefined;
  /** Whether the layer is rendered into the shared portal root. Default `true`. */
  portal?: boolean | undefined;
  ref?: React.Ref<TooltipHandle> | undefined;
  shift?: boolean | undefined;
  side?: TooltipSide | undefined;
  /** Distance beyond the standard gap, which is the layer's own padding. */
  sideOffset?: number | undefined;
  size?: TooltipSize | undefined;
  strategy?: TooltipStrategy | undefined;
  /** How long a press is held before a coarse pointer opens the hint. */
  touchDelay?: number | undefined;
  variant?: TooltipVariant | undefined;
  /**
   * Opens only while the trigger's own content is cut by its box — a column
   * header narrowed to `Op…`, a breadcrumb in a rail. The measurement is taken
   * at the moment the hint would open, so a column dragged wider stops opening
   * one without anything being told.
   */
  whenClipped?: boolean | undefined;
}

export interface TooltipTriggerProps extends ComponentPropsWithRef<'button'> {
  /**
   * Renders the trigger into the consumer's own element. Almost every tooltip
   * uses it: the trigger is a control the page already has.
   */
  render?: ((props: TooltipTriggerRootProps) => ReactNode) | undefined;
}

export interface TooltipLayerProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: TooltipLayerRootProps) => ReactNode) | undefined;
}

export interface TooltipContentProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: TooltipContentRootProps) => ReactNode) | undefined;
}

export interface TooltipArrowProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}
