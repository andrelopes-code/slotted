import type { AlertMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode } from 'react';

/** Which of the five semantic colours the message speaks in. */
export type AlertTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/** How that colour is painted. `soft` is the tinted box an alert usually is. */
export type AlertVariant = 'soft' | 'outline' | 'solid';

/**
 * The scope the message applies to, which is the guide's three recipes as one
 * axis: an alert beside the thing it is about, a callout inside a section, a
 * banner across a page.
 */
export type AlertReach = 'inline' | 'section' | 'page';

/**
 * Whether the message announces itself, and how loudly. `off` is the default,
 * because the WAI-ARIA APG records that screen readers do not inform users of
 * alerts already present when the page finishes loading.
 */
export type AlertLive = 'off' | 'polite' | 'assertive';

/**
 * Where the actions stand: on a row under the words, or at the end of the
 * words' own row once the box is 40rem wide.
 */
export type AlertActionsPlacement = 'below' | 'end';

/**
 * Why the message closed. `dismiss` is the control at its corner; `programmatic`
 * is the application asking. `escape` is deliberately absent: an alert is not a
 * dismissable layer, and one inside a dialog would swallow the dialog's Escape.
 */
export type AlertCloseReason = Extract<ChangeReason, 'dismiss' | 'programmatic'>;

/** What an application sets once for every alert under it. */
export interface AlertDefaults {
  live: AlertLive;
  reach: AlertReach;
  tone: AlertTone;
  variant: AlertVariant;
}

export interface AlertDefaultsProviderProps extends Partial<AlertDefaults> {
  children?: ReactNode | undefined;
}

/** Props the family writes on whichever element `render` returns for a part. */
export interface AlertPartProps extends ComponentPropsWithRef<'div'> {
  'data-part': string;
}

export interface AlertRootProps extends ComponentPropsWithRef<'section'> {
  'data-actions-placement': AlertActionsPlacement;
  'data-live': AlertLive;
  'data-part': string;
  'data-reach': AlertReach;
  'data-tone': AlertTone;
  'data-ui': string;
  'data-variant': AlertVariant;
}

export interface AlertContentProps extends ComponentPropsWithRef<'div'> {
  /** Renders the announcing region into another element. */
  render?: ((props: AlertPartProps) => ReactNode) | undefined;
}

export interface AlertTitleProps extends ComponentPropsWithRef<'div'> {
  /**
   * Renders the title into the element the page means. A heading puts the
   * message in the document outline, which is right for a page banner and
   * wrong beside a field group — only the page knows which.
   */
  render?: ((props: AlertPartProps) => ReactNode) | undefined;
}

export interface AlertDescriptionProps extends ComponentPropsWithRef<'p'> {
  render?: ((props: AlertPartProps & ComponentPropsWithRef<'p'>) => ReactNode) | undefined;
}

export interface AlertActionsProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: AlertPartProps) => ReactNode) | undefined;
}

export interface AlertProps extends Omit<ComponentPropsWithRef<'section'>, 'children'> {
  children?: ReactNode | undefined;
  /** Defaults to the provider, then to `accent`. */
  tone?: AlertTone | undefined;
  /** Defaults to the provider, then to `soft`. */
  variant?: AlertVariant | undefined;
  /** Defaults to the provider, then to `section`. */
  reach?: AlertReach | undefined;
  /** Defaults to the provider, then to `off`. */
  live?: AlertLive | undefined;
  /** Defaults to `end` for a `page` banner and to `below` for every other reach. */
  actionsPlacement?: AlertActionsPlacement | undefined;
  /** Draws no mark at all, for a callout carrying its own artwork. */
  hideIcon?: boolean | undefined;
  /** Replaces the tone's own mark, keeping its box, its size and its place. */
  icon?: ReactNode | undefined;
  /** Renders the control that closes the message. */
  dismissible?: boolean | undefined;
  /** Words laid over the catalog of the language in force, key by key: what that control announces (`dismiss`). */
  messages?: PartialMessages<AlertMessages> | undefined;
  /** The openness the consumer owns. Passing it decides the mode for good. */
  open?: boolean | undefined;
  /** The openness an uncontrolled alert starts from, read once. */
  defaultOpen?: boolean | undefined;
  /** Asks to close, carrying the reason and the event, and refusable. */
  onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;
  /**
   * Returns the keyboard to where it came from when the message closes with
   * focus inside it. Nothing moves when focus was never there.
   */
  restoreFocus?: boolean | undefined;
  /** Renders the box into another element — an `li`, a page's own wrapper. */
  render?: ((props: AlertRootProps) => ReactNode) | undefined;
}
