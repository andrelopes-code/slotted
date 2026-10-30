import type {
  ToastMessage,
  ToastPriority,
  ToastReason,
  ToastStatus,
  ToastStore,
} from '@slotted/core/toast';
import type { PartialMessages, ToastMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode } from 'react';

/** Which of the five semantic colours the message speaks in. */
export type ToastTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/**
 * How that colour is painted. `raised` is the neutral surface with the tone in
 * the mark, and it is the default: a message floats over content this family
 * does not own, and tinting that content's corner is not its decision.
 */
export type ToastVariant = 'raised' | 'soft' | 'solid';

/** Which edge of the screen — or of the panel — the region sits at. */
export type ToastPlacement =
  'top-start' | 'top' | 'top-end' | 'bottom-start' | 'bottom' | 'bottom-end';

/**
 * Where the region is rendered. One axis with three values rather than two
 * booleans that admit a meaningless combination, which is the shape
 * `collapsible` settled for `mount`.
 */
export type ToastAttach = 'portal' | 'viewport' | 'inline';

/** Whether the messages stand in a column or in a pile that opens. */
export type ToastStacking = 'list' | 'stack';

export type { ToastMessage, ToastPriority, ToastReason, ToastStatus, ToastStore };

/** What a message carries for rendering. Opaque to `@slotted/core/toast`. */
export interface ToastContent {
  title?: ReactNode;
  description?: ReactNode;
  /** Defaults to the provider, then to `accent`. */
  tone?: ToastTone | undefined;
  /** Defaults to the provider, then to `raised`. */
  variant?: ToastVariant | undefined;
  /** Replaces the tone's own mark, keeping its box and its place on the line. */
  icon?: ReactNode | undefined;
  /** Draws no mark at all. */
  hideIcon?: boolean | undefined;
  /** The consumer's own controls, outside the text. */
  actions?: ReactNode | undefined;
  /** Renders the control that closes the message. Defaults to the provider. */
  dismissible?: boolean | undefined;
  /** Draws how much of the duration is left. Defaults to the provider. */
  progress?: boolean | undefined;
  /** Replaces the message's whole body, keeping the box, the tone and the timer. */
  render?: ((message: ToastMessage<ToastContent>) => ReactNode) | undefined;
}

/** Everything one call can say about a message. */
export interface ToastInput extends ToastContent {
  id?: string | undefined;
  /** Milliseconds on screen. `0` never expires. */
  duration?: number | undefined;
  /** How loudly the announcer says it. Never inferred from the tone. */
  priority?: ToastPriority | undefined;
  /**
   * What a reader hears. Left unstated it is built from `title` and
   * `description` when both are strings, and is empty when they are not — a
   * message whose body is a component of the consumer's announces what they
   * say here, and nothing at all when they say nothing.
   */
  announcement?: string | undefined;
  /** Waiting on a promise: it does not expire and it draws no countdown. */
  loading?: boolean | undefined;
  onStatusChange?:
    ((status: ToastStatus | 'removed', message: ToastMessage<ToastContent>) => void) | undefined;
}

export interface ToastPromiseInput<Value> {
  loading: ToastInput;
  success: ToastInput | ((value: Value) => ToastInput);
  error: ToastInput | ((reason: unknown) => ToastInput);
}

/**
 * The imperative facade `docs/component-features.md` §14 asks for, over the
 * observable model it asks for in the same sentence. It is a plain object, not
 * a hook: a message is shown from a saga, an interceptor or an event handler
 * that is nowhere near a component.
 */
export interface Toaster {
  show: (input?: ToastInput) => string;
  update: (id: string, input: ToastInput) => void;
  dismiss: (id: string, reason?: ToastReason) => void;
  clear: (reason?: ToastReason) => void;
  pauseAll: () => void;
  resumeAll: () => void;
  promise: <Value>(promise: Promise<Value>, input: ToastPromiseInput<Value>) => Promise<Value>;
  /** The model the region reads. */
  readonly store: ToastStore<ToastContent>;
}

/** What an application sets once for every region under it. */
export interface ToastDefaults {
  placement: ToastPlacement;
  attach: ToastAttach;
  stacking: ToastStacking;
  tone: ToastTone;
  variant: ToastVariant;
  priority: ToastPriority;
  dismissible: boolean;
  swipe: boolean;
  progress: boolean;
  pauseOnHover: boolean;
  pauseWhenHidden: boolean;
  limit: number;
  duration: number;
  swipeThreshold: number;
  hotkey: string;
}

export interface ToastDefaultsProviderProps extends Partial<ToastDefaults> {
  children?: ReactNode | undefined;
}

/** Props the family writes on whichever element `render` returns for a part. */
export interface ToastPartProps extends ComponentPropsWithRef<'div'> {
  'data-part': string;
}

export interface ToastRegionProps extends Omit<ComponentPropsWithRef<'section'>, 'children'> {
  /** The model this region renders. Defaults to the shared one. */
  toaster?: Toaster | undefined;
  /** The queue the consumer owns. Passing it decides the mode for good. */
  toasts?: readonly ToastMessage<ToastContent>[] | undefined;
  /** The queue an uncontrolled region starts from, read once. */
  defaultToasts?: readonly ToastMessage<ToastContent>[] | undefined;
  /** Asks to change the queue, carrying the reason and refusable. */
  onToastsChange?:
    | ((
        toasts: readonly ToastMessage<ToastContent>[],
        request: ChangeRequest<readonly ToastMessage<ToastContent>[]>,
      ) => void)
    | undefined;
  placement?: ToastPlacement | undefined;
  attach?: ToastAttach | undefined;
  stacking?: ToastStacking | undefined;
  swipe?: boolean | undefined;
  limit?: number | undefined;
  duration?: number | undefined;
  pauseOnHover?: boolean | undefined;
  pauseWhenHidden?: boolean | undefined;
  /** The key that moves focus into the region. Defaults to the provider. */
  hotkey?: string | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the name
   * a reader finds the region by (`label`) and what each close control
   * announces (`close`). A native `aria-label` still names the region.
   */
  messages?: PartialMessages<ToastMessages> | undefined;
  /** The element a portalled region is placed inside. */
  container?: Element | null | undefined;
  /** Renders each message. Defaults to the family's own anatomy. */
  children?: ((message: ToastMessage<ToastContent>) => ReactNode) | undefined;
}

export interface ToastProps extends Omit<ComponentPropsWithRef<'li'>, 'children'> {
  message: ToastMessage<ToastContent>;
  /** How far this message is from the front of the pile. The stylesheet reads it. */
  index?: number | undefined;
  children?: ReactNode | undefined;
}

/** A part whose element the consumer may substitute. */
export interface ToastPartRenderProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: ToastPartProps) => ReactNode) | undefined;
}

/** The same props, for a part whose element is not a `div`. */
type PartOf<Element extends 'p' | 'span' | 'button'> = ComponentPropsWithRef<Element> & {
  'data-part': string;
};

export interface ToastDescriptionProps extends ComponentPropsWithRef<'p'> {
  render?: ((props: PartOf<'p'>) => ReactNode) | undefined;
}

export interface ToastIconProps extends ComponentPropsWithRef<'span'> {
  render?: ((props: PartOf<'span'>) => ReactNode) | undefined;
}

export interface ToastCloseProps extends ComponentPropsWithRef<'button'> {
  render?: ((props: PartOf<'button'>) => ReactNode) | undefined;
}
