import type { ComponentPropsWithRef, ReactNode } from 'react';

/** Which of the five semantic colors the message speaks in. */
export type InlineMessageTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/**
 * The type step the message sits at. `sm` sits beside a compact field; `md`
 * beside a large field. A message about a section is an alert. Both read the control scales, which the theme
 * restates per density.
 */
export type InlineMessageSize = 'sm' | 'md';

/**
 * Which mark the message draws. `glyph` is the tone's own silhouette — the
 * circled information, check, diamond and circled exclamation. `dot` is a
 * neutral bullet in the tone's ink, the same shape for every tone including
 * the help tone that draws no silhouette at all, so a column of messages under
 * one field starts on one left edge. `none` draws nothing, and the tone is
 * then said by the ink and by the weight of the sentence: it is what `field`
 * and `field-group` ask for, because a silhouette repeated under every control
 * of a form is texture rather than a warning (F2).
 */
export type InlineMessageMark = 'glyph' | 'dot' | 'none';

/**
 * Whether the message announces itself, and how loudly. `off` is the default,
 * because the WAI-ARIA APG records that a message already present when the page
 * finishes loading is not announced whatever role it carries.
 */
export type InlineMessageLive = 'off' | 'polite' | 'assertive';

/**
 * The word a reader hears before the message. `null` is a tone that is not a
 * severity — help and information announce themselves by their sentence.
 */
export type InlineMessagePrefixes = Record<InlineMessageTone, string | null>;

/** What an application sets once for every message under it. */
export interface InlineMessageDefaults {
  live: InlineMessageLive;
  mark: InlineMessageMark;
  prefixes: InlineMessagePrefixes;
  size: InlineMessageSize;
  tone: InlineMessageTone;
}

export interface InlineMessageDefaultsProviderProps extends Partial<
  Omit<InlineMessageDefaults, 'prefixes'>
> {
  children?: ReactNode | undefined;
  /** Merged over the inherited table, so one word can be replaced alone. */
  prefixes?: Partial<InlineMessagePrefixes> | undefined;
}

/** The answers a message offers, after its sentence. */
export type InlineMessageActionsProps = ComponentPropsWithRef<'div'>;

export interface InlineMessageRootProps extends ComponentPropsWithRef<'p'> {
  'data-live': InlineMessageLive;
  'data-mark': InlineMessageMark;
  'data-part': string;
  'data-size': InlineMessageSize;
  'data-tone': InlineMessageTone;
  'data-ui': string;
}

export interface InlineMessageProps extends Omit<
  ComponentPropsWithRef<'p'>,
  'children' | 'prefix'
> {
  children?: ReactNode | undefined;
  /** Defaults to the provider, then to `secondary` — help text. */
  tone?: InlineMessageTone | undefined;
  /** Defaults to the provider, then to `sm`. */
  size?: InlineMessageSize | undefined;
  /** Defaults to the provider, then to `off`. */
  live?: InlineMessageLive | undefined;
  /**
   * Which mark is drawn. Defaults to the provider, then to `glyph`. `field` and
   * `field-group` ask for `none` instead, because a form reads a column of
   * sentences rather than a column of silhouettes.
   */
  mark?: InlineMessageMark | undefined;
  /**
   * The word read before the message. Unstated is the tone's own — `Error:`,
   * `Warning:`, `Success:` — and the empty string removes it, for a message
   * whose sentence already names the severity.
   */
  prefix?: string | undefined;
  /**
   * Removes the mark's box from the markup, for a message that carries its own
   * artwork beside it. `mark='none'` is the other way to draw nothing: it is an
   * axis a provider can set for every message under it, and it leaves the box
   * in place for `reserve` to hold a line open with.
   */
  hideIcon?: boolean | undefined;
  /** Replaces the tone's mark, keeping its box, its size and its place. */
  icon?: ReactNode | undefined;
  /** The message is waiting for something: the mark becomes a turning ring. */
  loading?: boolean | undefined;
  /**
   * Unstated rather than `false`, so a `field` can answer it once this family
   * is inside one. Stated, it wins.
   */
  disabled?: boolean | undefined;
  /**
   * Holds one line box open whether or not there is a message, so the form
   * below does not move when the error arrives.
   */
  reserve?: boolean | undefined;
  /** Renders the message into another element — a `div`, a `ul` of failures. */
  render?: ((props: InlineMessageRootProps) => ReactNode) | undefined;
}
