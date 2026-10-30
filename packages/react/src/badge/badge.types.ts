import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/** Which of the five semantic colours the badge speaks in. */
export type BadgeTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/** How that colour is painted. `soft` is the tinted chip a badge usually is. */
export type BadgeVariant = 'solid' | 'soft' | 'outline';

export type BadgeSize = 'sm' | 'md' | 'lg';

/** `dot` is the same badge, tone and hidden text, drawn without a value. */
export type BadgeShape = 'pill' | 'square' | 'dot';

/** Whether a changing badge is announced, and how urgently. */
export type BadgeLive = 'off' | 'polite' | 'assertive';

export type BadgePlacement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';

/** The shape of the host, which decides how far in from the corner to sit. */
export type BadgeOverlap = 'rectangle' | 'circle';

/**
 * The page's own correction of the corner, in CSS pixels.
 *
 * `x` runs along the inline axis, from the leading edge towards the trailing
 * one, so it mirrors with the document: a badge moved two pixels back along it
 * keeps the same relation to its host in a right-to-left page. `y` runs down
 * the block axis. Both default to nought.
 */
export interface BadgeOffset {
  x?: number | undefined;
  y?: number | undefined;
}

/** What an application sets once for every badge under it. */
export interface BadgeDefaults {
  /** BCP 47. Absent, the runtime's own default writes the digits. */
  locale: string | undefined;
  max: number | false;
  shape: BadgeShape;
  size: BadgeSize;
  tone: BadgeTone;
  variant: BadgeVariant;
}

export interface BadgeDefaultsProviderProps extends Partial<BadgeDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives. It names the family's own attributes over the native
 * ones every element shares; `ref` is not named because the element the
 * consumer renders decides its own type, and React passes it through the same
 * spread either way.
 */
export interface BadgeRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
  'data-shape': BadgeShape;
  'data-size': BadgeSize;
  'data-tone': BadgeTone;
  'data-ui': string;
  'data-variant': BadgeVariant;
}

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  /**
   * The number the badge shows, written before any children. A count of nought
   * removes the badge entirely unless `showZero` says otherwise.
   */
  count?: number | undefined;
  /**
   * A glyph after the words. It is wrapped in the `end` part, which sizes and
   * centres it; the artwork is the consumer's.
   */
  end?: ReactNode | undefined;
  /**
   * Whether a change to this badge is announced, and how urgently. `off` by
   * default: a page of twenty badges that all announce is a page no screen
   * reader user can read.
   */
  live?: BadgeLive | undefined;
  /** BCP 47, for the digits of `count`. Defaults to the provider, then to the runtime. */
  locale?: string | undefined;
  /**
   * The largest count written in full; above it the badge shows the ceiling and
   * a `+`. `false` removes the ceiling. Defaults to the provider, then to `99`.
   */
  max?: number | false | undefined;
  /**
   * Renders the wiring into the element the page means — an `<a>` for a badge
   * that navigates, a `<dd>` inside a description list.
   */
  render?: ((props: BadgeRootProps) => ReactNode) | undefined;
  /** Whether a count of nought is a value worth showing or an absence worth hiding. */
  showZero?: boolean | undefined;
  /** `dot` draws no value; the words it cannot say are `VisuallyHidden` content. */
  shape?: BadgeShape | undefined;
  /** Defaults to the provider, then to `md`. */
  size?: BadgeSize | undefined;
  /**
   * A glyph before the words. It is wrapped in the `start` part, which sizes
   * and centres it; the artwork is the consumer's.
   */
  start?: ReactNode | undefined;
  /** Defaults to the provider, then to `secondary`. */
  tone?: BadgeTone | undefined;
  /** Defaults to the provider, then to `soft`. */
  variant?: BadgeVariant | undefined;
}

export interface BadgeAnchorRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-overlap': BadgeOverlap;
  'data-part': string;
  'data-placement': BadgePlacement;
  'data-ui': string;
}

export interface BadgeAnchorProps extends ComponentPropsWithRef<'span'> {
  /**
   * Moves the badge off the corner the frame computed, in pixels. `overlap` has
   * two values and hosts have many: how far a badge sits into one depends on
   * that host's own curve, shadow and optical weight.
   */
  offset?: BadgeOffset | undefined;
  /** Which corner of the host the badge sits on. Mirrors in a right-to-left document. */
  placement?: BadgePlacement | undefined;
  /** `circle` moves the badge in from the corner far enough to meet the curve. */
  overlap?: BadgeOverlap | undefined;
  /** Renders the frame into another element — a `<div>`, a `<li>`. */
  render?: ((props: BadgeAnchorRootProps) => ReactNode) | undefined;
}
