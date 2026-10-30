import type { GlyphName } from '@slotted/angular/icon';

/**
 * The six operational states. The vocabulary is closed, and that is a decision
 * rather than an omission: a seventh value would carry no tone, no glyph and
 * no fallback word, which are the three things this family exists to supply.
 */
export type StatusIndicatorStatus =
  'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'unknown';

/** The compact mark, and the one that says the status without colour. */
export type StatusIndicatorMark = 'dot' | 'icon';
export type StatusIndicatorSize = 'sm' | 'md' | 'lg';
export type StatusIndicatorLive = 'off' | 'polite' | 'assertive';

export const STATUS_INDICATOR_DEFAULT_STATUS: StatusIndicatorStatus = 'neutral';

/**
 * The glyph each status draws when the mark is an icon, as the contract's
 * `statusGlyphs` names it. Two statuses never share one: the icon mark is the
 * family's non-chromatic answer, and `neutral` and `unknown` share a tone.
 */
export const STATUS_INDICATOR_GLYPHS: Record<StatusIndicatorStatus, GlyphName> = {
  neutral: 'status-neutral',
  info: 'status-info',
  success: 'status-success',
  warning: 'status-warning',
  danger: 'status-failed',
  unknown: 'status-unknown',
};
export const STATUS_INDICATOR_DEFAULT_MARK: StatusIndicatorMark = 'dot';
export const STATUS_INDICATOR_DEFAULT_SIZE: StatusIndicatorSize = 'md';
export const STATUS_INDICATOR_DEFAULT_LIVE: StatusIndicatorLive = 'off';

/**
 * What `live` writes on the host. The names are the platform's: `status` is a
 * polite live region with an implicit `aria-atomic`, so the mark and its word
 * are announced as one thing; `alert` interrupts, which the APG's Alert
 * pattern reserves for a message that needs immediate attention.
 */
export const STATUS_INDICATOR_ROLE: Record<StatusIndicatorLive, string | null> = {
  off: null,
  polite: 'status',
  assertive: 'alert',
};
