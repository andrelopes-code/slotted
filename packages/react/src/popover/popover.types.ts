import type { FamilyTranslator, PartialMessages, PopoverMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { AriaRole, ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

/** The width and type step the panel sits at. */
export type PopoverSize = 'sm' | 'md' | 'lg';

/**
 * How wide the panel is. `auto` sizes it to its own content and stops at the
 * measure the size step gives it; `anchor` makes it exactly as wide as the
 * element it hangs from, which is what a filter panel under a search field
 * wants.
 */
export type PopoverWidth = 'auto' | 'anchor';

/** The edge of the anchor the layer prefers. The two logical values mirror. */
export type PopoverSide = 'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right';

/** Where the layer sits along the side it took. */
export type PopoverAlign = 'start' | 'center' | 'end';

/**
 * When the layer exists. `active` builds it on opening and drops it after the
 * exit, `lazy` builds it on the first open and keeps it — which is what a panel
 * holding an expensive form wants — and `eager` builds it up front.
 */
export type PopoverMount = 'active' | 'lazy' | 'eager';

/** `fixed` for a layer inside `overflow: hidden`, `absolute` for one inside a transform. */
export type PopoverStrategy = 'absolute' | 'fixed';

/** Why the panel opened or closed. */
export type PopoverOpenReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'dismiss' | 'programmatic'
>;

/** The request the family emits before the panel moves. */
export type PopoverChangeRequest = ChangeRequest<boolean>;

/**
 * Somewhere to put the focus. An element, a ref to one, or a selector resolved
 * inside the panel — the last is what a consumer reaches for when the control
 * they mean is rendered by something they do not hold a ref to.
 */
export type PopoverFocusTarget = Element | { current: Element | null } | string;

/** Whether a press outside the panel counts as a dismissal. */
export type PopoverOutsidePress = boolean | ((target: EventTarget | null, event: Event) => boolean);

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

/** What an application sets once for every popover under it. */
export interface PopoverDefaults {
  align: PopoverAlign;
  alignOffset: number;
  arrow: boolean;
  arrowPadding: number;
  /** Whether the panel takes the focus when it opens. */
  autoFocus: boolean;
  closeOnEscape: boolean;
  closeOnOutsidePress: boolean;
  collisionPadding: number;
  flip: boolean;
  hideWhenDetached: boolean;
  mount: PopoverMount;
  portal: boolean;
  shift: boolean;
  side: PopoverSide;
  sideOffset: number;
  size: PopoverSize;
  strategy: PopoverStrategy;
  width: PopoverWidth;
}

export interface PopoverDefaultsProviderProps extends Partial<PopoverDefaults> {
  children?: ReactNode | undefined;
  /** Where every layer under this provider is rendered. Calls `setPortalContainer`. */
  container?: Element | null | undefined;
}

/** The three actions a consumer cannot express declaratively. */
export interface PopoverHandle {
  open: () => void;
  close: () => void;
  reposition: () => void;
}

/** What the family hands its own trigger, anchor, layer and panel parts. */
export interface PopoverContextValue {
  /** The family's words in the language in force, with this popover's `messages` laid over them. */
  t: FamilyTranslator<PopoverMessages>;
  align: PopoverAlign;
  alignOffset: number;
  anchorNode: HTMLElement | null;
  arrowNode: HTMLElement | null;
  arrowPadding: number;
  autoFocus: boolean;
  closeOnEscape: boolean;
  closeOnOutsidePress: PopoverOutsidePress;
  collisionPadding: number;
  contentId: string;
  /** The panel element, once it exists. The focus lands on it, or inside it. */
  contentNode: HTMLElement | null;
  descriptionId: string;
  disabled: boolean;
  finalFocus: PopoverFocusTarget | undefined;
  flip: boolean;
  hasDescription: boolean;
  hasTitle: boolean;
  hideWhenDetached: boolean;
  initialFocus: PopoverFocusTarget | undefined;
  mount: PopoverMount;
  open: boolean;
  portal: boolean;
  seen: boolean;
  setAnchorNode: (node: HTMLElement | null) => void;
  setArrowNode: (node: HTMLElement | null) => void;
  setContentNode: (node: HTMLElement | null) => void;
  setHasDescription: (present: boolean) => void;
  setHasTitle: (present: boolean) => void;
  setTriggerNode: (node: HTMLElement | null) => void;
  shift: boolean;
  showArrow: boolean;
  side: PopoverSide;
  sideOffset: number;
  size: PopoverSize;
  strategy: PopoverStrategy;
  titleId: string;
  toggle: (next: boolean, reason: PopoverOpenReason, source?: unknown) => void;
  triggerNode: HTMLElement | null;
  width: PopoverWidth;
}

/** What `render` receives for the layer. */
export interface PopoverLayerRootProps extends HTMLAttributes<HTMLElement> {
  ref?: PartRef | undefined;
  'data-align': PopoverAlign;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-size': PopoverSize;
  'data-ui': string;
  'data-width': PopoverWidth;
}

/** What `render` receives for the panel. */
export interface PopoverContentRootProps extends HTMLAttributes<HTMLElement> {
  ref?: PartRef | undefined;
  'aria-describedby'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  'data-part': string;
  id: string;
  /** `dialog` unless the consumer wrote one — `hover-card` writes `presentation`. */
  role: AriaRole;
  tabIndex: -1;
}

/** What `render` receives for the trigger, which is the consumer's own element. */
export interface PopoverTriggerRootProps extends HTMLAttributes<HTMLElement> {
  ref?: PartRef | undefined;
  /** The panel's id, written only while the panel is in the document. */
  'aria-controls'?: string | undefined;
  'aria-expanded': boolean;
  'aria-haspopup': 'dialog';
  'data-open'?: '' | undefined;
}

export interface PopoverProps {
  align?: PopoverAlign | undefined;
  alignOffset?: number | undefined;
  arrow?: boolean | undefined;
  arrowPadding?: number | undefined;
  /**
   * Whether the panel takes focus on open. It focuses the panel itself rather
   * than its first control, so a reader hears the panel's name before its
   * contents and a panel whose first control is destructive does not arrive
   * pre-armed.
   */
  autoFocus?: boolean | undefined;
  children?: ReactNode | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * close control's accessible name (`close`).
   */
  messages?: PartialMessages<PopoverMessages> | undefined;
  closeOnEscape?: boolean | undefined;
  /** `false`, or a predicate deciding which outside presses count. */
  closeOnOutsidePress?: PopoverOutsidePress | undefined;
  collisionPadding?: number | undefined;
  defaultOpen?: boolean | undefined;
  /** The popover never opens. The trigger's own `disabled` is the consumer's. */
  disabled?: boolean | undefined;
  /**
   * Where focus lands after it closes. The trigger by default, and this is for
   * the popover that removed the row its trigger was in.
   */
  finalFocus?: PopoverFocusTarget | undefined;
  flip?: boolean | undefined;
  hideWhenDetached?: boolean | undefined;
  /** What takes focus on open instead of the panel — a search field, usually. */
  initialFocus?: PopoverFocusTarget | undefined;
  mount?: PopoverMount | undefined;
  onOpenChange?: ((open: boolean, request: PopoverChangeRequest) => void) | undefined;
  open?: boolean | undefined;
  portal?: boolean | undefined;
  ref?: Ref<PopoverHandle> | undefined;
  shift?: boolean | undefined;
  side?: PopoverSide | undefined;
  sideOffset?: number | undefined;
  size?: PopoverSize | undefined;
  strategy?: PopoverStrategy | undefined;
  width?: PopoverWidth | undefined;
}

export interface PopoverTriggerProps extends ComponentPropsWithRef<'button'> {
  render?: ((props: PopoverTriggerRootProps) => ReactNode) | undefined;
}

export interface PopoverAnchorProps extends ComponentPropsWithRef<'div'> {
  /** Receives a callback ref, as the trigger's `render` does, so any element takes it. */
  render?: ((props: HTMLAttributes<HTMLElement> & { ref?: PartRef }) => ReactNode) | undefined;
}

export interface PopoverLayerProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: PopoverLayerRootProps) => ReactNode) | undefined;
}

export interface PopoverContentProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: PopoverContentRootProps) => ReactNode) | undefined;
}

export interface PopoverHeaderProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

export interface PopoverTitleProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: HTMLAttributes<HTMLElement> & { id: string }) => ReactNode) | undefined;
}

export interface PopoverDescriptionProps extends ComponentPropsWithRef<'p'> {
  render?: ((props: HTMLAttributes<HTMLElement> & { id: string }) => ReactNode) | undefined;
}

export interface PopoverBodyProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

export interface PopoverFooterProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

export interface PopoverCloseProps extends ComponentPropsWithRef<'button'> {
  /** Receives a callback ref, which is how the family reads whether the element shows text. */
  render?: ((props: HTMLAttributes<HTMLElement> & { ref?: PartRef }) => ReactNode) | undefined;
}

export interface PopoverArrowProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}
