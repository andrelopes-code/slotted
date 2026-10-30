import type { GlyphName } from '../icon';
import type { StatusIndicatorStatus } from './status-indicator.types';

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
