import type { ExtentSide } from '@slotted/core/extent';
import type { DrawerMessages, FamilyTranslator, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref, RefObject } from 'react';

/**
 * Whether the drawer is a layer over the page or a box beside it.
 *
 * One axis rather than two components, because the switch is the point: an
 * application binds it to its own breakpoint, and swapping one element for
 * another there would destroy the subtree — taking the panel's scroll position,
 * focus and every uncontrolled input inside it.
 */
export type DrawerMode = 'overlay' | 'inline';

/**
 * Which edge the panel comes from. Logical, so the whole layout mirrors in a
 * right-to-left document without a second stylesheet. Vaul says `left`, MUI
 * says `anchor="left"` and Ant says `placement="left"`; `start` and `end` are
 * what `docs/component-features.md` §2.4 asks for instead.
 */
export type DrawerSide = ExtentSide;

/**
 * The panel's resting measure. Five named steps rather than a pixel string: a
 * theme retunes a step and cannot retune `width: 400px`. A consumer needing an
 * exact measure sets `--slotted-drawer-extent` on the element, which is the
 * token the steps resolve into.
 */
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'content';

/**
 * What a hand can move a sheet by. `panel` lets a touch anywhere on an overlay
 * sheet from the bottom move it and hand itself to the scroll of what it holds,
 * as every native sheet does; `resizer` leaves the separator the only target.
 * Only a bottom overlay sheet reads it.
 */
export type DrawerDrag = 'panel' | 'resizer';

/**
 * When the panel exists. `active` builds it on opening and drops it once the
 * exit is over, `lazy` builds it on the first open and keeps it, `eager` builds
 * it up front and makes it inert.
 */
export type DrawerMount = 'active' | 'lazy' | 'eager';

/** Whether a dismissal source closes the drawer. */
export type DrawerDismissPolicy = 'close' | 'none';

/** Where focus goes when an overlay drawer opens. */
export type DrawerInitialFocus = 'first' | 'container' | RefObject<HTMLElement | null> | false;

/** Where focus goes when the drawer closes. Defaults to the trigger. */
export type DrawerFinalFocus = RefObject<HTMLElement | null> | false;

/** Why the drawer opened or closed. */
export type DrawerOpenReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'dismiss' | 'escape' | 'outsidePress' | 'back' | 'programmatic'
>;

/** Why the panel's measure moved. */
export type DrawerExtentReason = Extract<
  ChangeRequest<number>['reason'],
  'pointer' | 'keyboard' | 'programmatic'
>;

/**
 * The request the family emits before the drawer moves, with the result the
 * close carried. `result` is what the platform calls `returnValue`: it rides on
 * the request rather than declaring a second state model, because nothing about
 * it is controlled and a consumer owning it would own a value only the family
 * can produce.
 */
export interface DrawerChangeRequest extends ChangeRequest<boolean> {
  readonly reason: DrawerOpenReason;
  readonly result?: string | undefined;
}

/** The request the separator emits before the measure moves. */
/**
 * `undefined` is a value of this state and not the absence of one: it is the
 * panel back on the measure its size step gives it, which is where it starts
 * and where a double click on the separator puts it again. Every other value
 * is a fraction of the layer.
 */
export interface DrawerExtentRequest extends ChangeRequest<number | undefined> {
  readonly reason: DrawerExtentReason;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface DrawerHandle {
  /** Opens the drawer, carrying `programmatic`. */
  open: () => void;
  /** Closes it, carrying `programmatic` and the result given. */
  close: (result?: string) => void;
  /** Moves focus into the panel, as opening an overlay drawer does. */
  focus: () => void;
  /** The panel, once it is in the document. */
  readonly panel: HTMLElement | null;
}

/** What an application sets once for every drawer under it. */
export interface DrawerDefaults {
  /** The platform's way back — a phone's gesture, a browser's button — closes a modal layer. */
  back: DrawerDismissPolicy;
  escape: DrawerDismissPolicy;
  mode: DrawerMode;
  modal: boolean;
  mount: DrawerMount;
  outsidePress: DrawerDismissPolicy;
  side: DrawerSide;
  /**
   * Unset, the size the side gives: `content` on `top` and `bottom`, where
   * every native sheet measures what it holds, and `md` on `start` and `end`.
   */
  size: DrawerSize | undefined;
  drag: DrawerDrag;
}

export interface DrawerDefaultsProviderProps extends Partial<DrawerDefaults> {
  children?: ReactNode | undefined;
}

/** What the family hands its own parts. */
export interface DrawerContextValue {
  /** The family's words in the language in force, with this drawer's `messages` laid over them. */
  t: FamilyTranslator<DrawerMessages>;
  /** Marks a part as present, so the panel wires only what was rendered. */
  announce: (part: 'title' | 'description') => () => void;
  /** Asks to close, carrying the reason, the result and the event. */
  close: (reason: DrawerOpenReason, result: string | undefined, source: unknown) => void;
  /** The consumer's parent for this layer, or nothing for the shared root. */
  container: Element | null | undefined;
  descriptionId: string;
  /** Whether the reader has the separator under the pointer. */
  dragging: boolean;
  drag: DrawerDrag;
  /** The fraction below which the scrim is not painted. */
  scrimFrom: number;
  /**
   * Where the hand is holding the panel while the body is dragged, which may be
   * past the highest stop. `null` outside a gesture: the request is made once,
   * on release, rather than once per move.
   */
  live: number | null;
  setLive: (live: number | null) => void;
  /**
   * What the panel measures at rest — the height of its content under
   * `size="content"` — as a fraction, measured while `extent` is unset.
   */
  rest: number | undefined;
  setRest: (rest: number | undefined) => void;
  back: DrawerDismissPolicy;
  escape: DrawerDismissPolicy;
  /** The measure right now, as a fraction of the box the panel is measured in. */
  extent: number | undefined;
  finalFocus: DrawerFinalFocus | undefined;
  initialFocus: DrawerInitialFocus;
  loading: boolean;
  maxExtent: number;
  minExtent: number;
  /** The measure the panel goes back to, which a double click restores. */
  defaultExtent: number | undefined;
  modal: boolean;
  mode: DrawerMode;
  /** Whether the panel belongs in the document at all. */
  mounted: boolean;
  mount: DrawerMount;
  /**
   * The trigger, the panel and the layer, once each is in the document. One
   * stable object for the life of the family, which is what lets it sit on a
   * memoised context value without changing its identity every render.
   */
  nodes: {
    layer: HTMLElement | null;
    panel: HTMLElement | null;
    trigger: HTMLElement | null;
  };
  /** What the consumer asked for, which the trigger reports. */
  open: boolean;
  /** Asks to open, carrying the reason and the event. */
  openWith: (reason: DrawerOpenReason, source: unknown) => void;
  /**
   * Records the layer, which is the node `@slotted/core/presence` measures its
   * own exit on. Without it presence has nothing to read a duration from and
   * completes the exit in the same frame the close was asked for, so the panel
   * disappears instead of leaving.
   */
  registerLayer: (node: HTMLElement | null) => void;
  outsidePress: DrawerDismissPolicy;
  panelId: string;
  /** Asks to move the measure, carrying the reason and the event. */
  requestExtent: (extent: number | undefined, reason: DrawerExtentReason, source: unknown) => void;
  /** Records whether the reader has hold of the separator. */
  setDragging: (dragging: boolean) => void;
  side: DrawerSide;
  size: DrawerSize;
  snapPoints: readonly number[];
  titleId: string;
  triggerId: string;
  /**
   * What the stylesheet keys on, which is one frame behind what was asked: a
   * panel that appears already open has no closed style to transition from.
   */
  visible: boolean;
  /**
   * Whether the layer takes focus and the pointer. `entering` counts: the
   * focus scope enters in that frame, and a layer still `inert` then refuses
   * the initial focus and leaves it on `body`.
   */
  interactive: boolean;
}

export interface DrawerProps {
  children?: ReactNode | undefined;
  /** The consumer's value. Present at all puts the drawer in controlled mode. */
  open?: boolean | undefined;
  /** The value an uncontrolled drawer starts from, read once. */
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: DrawerChangeRequest) => void) | undefined;
  /**
   * After the panel's entrance or exit has ended: `true` once it is settled
   * open, `false` once it has left. An application that unmounts the drawer
   * on close waits for `false`, so the exit runs.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * How much of the box the panel is measured in it takes, in `[0, 1]`. Unset
   * means the `size` step decides. It is a fraction rather than a length so
   * that the separator's three ARIA values, the limits and the snap points are
   * all the same kind of number.
   */
  extent?: number | undefined;
  defaultExtent?: number | undefined;
  onExtentChange?: ((extent: number | undefined, request: DrawerExtentRequest) => void) | undefined;
  /** The smallest the reader may make it. A drag released below it asks to close. */
  minExtent?: number | undefined;
  maxExtent?: number | undefined;
  /**
   * The stops the separator lands on. With them an arrow moves to the adjacent
   * stop, `Home` and `End` go to the first and last, and a drag releases onto
   * the nearest.
   */
  snapPoints?: readonly number[] | undefined;
  mode?: DrawerMode | undefined;
  side?: DrawerSide | undefined;
  size?: DrawerSize | undefined;
  mount?: DrawerMount | undefined;
  /**
   * Whether the background is inert, the scroll is locked and focus is
   * contained. Fixed at `false` under `mode="inline"`: a panel in the flow that
   * claimed `aria-modal` while the page around it stayed reachable is the
   * failure the APG calls severe.
   */
  modal?: boolean | undefined;
  escape?: DrawerDismissPolicy | undefined;
  outsidePress?: DrawerDismissPolicy | undefined;
  /**
   * The platform's way back — a phone's gesture, a browser's button — closes
   * the layer instead of leaving the page, while the layer is modal.
   */
  back?: DrawerDismissPolicy | undefined;
  /** Whether the panel's content is still on its way. */
  loading?: boolean | undefined;
  /** Words laid over the catalog of the language in force, key by key: the close control's name (`close`). */
  messages?: PartialMessages<DrawerMessages> | undefined;
  /** What a hand moves an overlay sheet from the bottom by. */
  drag?: DrawerDrag | undefined;
  /**
   * Below this fraction the scrim is not painted and a press reaches the page:
   * the sheet over a map. It pairs with `modal={false}` and
   * `outsidePress="none"`, because a page left undimmed and inert would promise
   * something it does not do.
   */
  scrimFrom?: number | undefined;
  /** A parent for this layer alone, instead of the shared portal root. */
  container?: Element | null | undefined;
  initialFocus?: DrawerInitialFocus | undefined;
  finalFocus?: DrawerFinalFocus | undefined;
  ref?: Ref<DrawerHandle> | undefined;
}

/** What `render` receives for a part. */
type PartProps<Element extends HTMLElement> = HTMLAttributes<Element> & {
  'data-part': string;
};

export type DrawerPanelRootProps = ComponentPropsWithRef<'div'> & { 'data-part': 'panel' };
export type DrawerTriggerRootProps = ComponentPropsWithRef<'button'> & { 'data-part': 'trigger' };

interface WithRender<RootProps> {
  /** Replaces the rendered element. The props are the ones the part writes. */
  render?: ((props: RootProps) => ReactNode) | undefined;
}

export interface DrawerTriggerProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children'>, WithRender<DrawerTriggerRootProps> {
  children?: ReactNode | undefined;
}

/**
 * `render` here substitutes the **panel**, not the layer around it. That is the
 * element a consumer needs to change: an inline navigation drawer is a `<nav>`
 * and a filter panel is an `<aside>`, and the family cannot know which.
 */
export interface DrawerPanelProps
  extends ComponentPropsWithRef<'div'>, WithRender<DrawerPanelRootProps> {}

export interface DrawerHeaderProps
  extends ComponentPropsWithRef<'header'>, WithRender<PartProps<HTMLElement>> {}

export interface DrawerTitleProps
  extends ComponentPropsWithRef<'h2'>, WithRender<PartProps<HTMLHeadingElement>> {}

export interface DrawerActionsProps
  extends ComponentPropsWithRef<'div'>, WithRender<PartProps<HTMLDivElement>> {}

export interface DrawerDescriptionProps
  extends ComponentPropsWithRef<'p'>, WithRender<PartProps<HTMLParagraphElement>> {}

export interface DrawerBodyProps
  extends ComponentPropsWithRef<'div'>, WithRender<PartProps<HTMLDivElement>> {
  /** `none` drops the body's own padding, for content that brings its own inset — a Page, a list on the panel's edges. */
  inset?: 'none' | undefined;
}

export interface DrawerFooterProps
  extends ComponentPropsWithRef<'footer'>, WithRender<PartProps<HTMLElement>> {}

export interface DrawerCloseProps
  extends ComponentPropsWithRef<'button'>, WithRender<ComponentPropsWithRef<'button'>> {
  /** The result the close carries out, which is the platform's `returnValue`. */
  value?: string | undefined;
}

/**
 * Rendering this part *is* the resize capability. There is no `resizable` prop,
 * so a prop with no separator, and a separator a prop had switched off, are
 * both states this family cannot be in.
 */
export interface DrawerResizerProps
  extends ComponentPropsWithRef<'div'>, WithRender<PartProps<HTMLDivElement>> {
  /**
   * How far one arrow press moves the separator, **in pixels**, when there are
   * no snap points. A distance and not a proportion: a reader adjusting a pane
   * is placing an edge against the content beside it, and a proportion of a
   * wide layer is a jump.
   */
  step?: number | undefined;
  /** How far `Shift` and an arrow move it, in pixels. */
  largeStep?: number | undefined;
}
