import '@slotted/styles/progress-indicator/progress-indicator.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import {
  PROGRESS_WAVE_BAR_INDETERMINATE_PATH,
  PROGRESS_WAVE_BAR_PATH,
  PROGRESS_WAVE_BAR_REACH,
} from '@slotted/core/progress';

import { progressLabel, progressStyle, progressValue } from './progress-parts';
import { useProgressIndicator } from './use-progress-indicator';
import type { ProgressBarProps, ProgressRootProps } from './progress-indicator.types';

/**
 * The linear recipe: a quantity along a track, or a wait travelling it.
 *
 * The shape is M3's from 2024 onward — a fully rounded indicator, a gap of one
 * thickness before the track it has not reached, and a stop indicator marking
 * where the bar is going. The gap and the dot are what make a bar at four per
 * cent read as four per cent of something rather than as a stray mark, and no
 * other surveyed implementation draws either.
 *
 * `placement="page"` is the whole of what the deleted `loading-bar` family
 * was: the same bar pinned to the top edge of the viewport, with no corner to
 * round and a transparent track, because a permanent grey band across the top
 * of a page reads as a rule under the header rather than as a wait.
 * `edge-start` and `edge-end` are the same bar on an edge of the nearest
 * positioned box, which is the frame `app-shell` and `page-header` render as
 * their `progress` part.
 *
 * With `wave` the indicator is an `svg` over the whole track and one stroked
 * path inside it, M3's sine from `@slotted/core/progress`: the stylesheet
 * shows a window of it with a dash, so the bar ends in its own crest with a
 * round cap. The viewBox states one unit as one thickness and `pathLength`
 * states the path's reach along the inline axis, which is what makes a dash of
 * one unit one thickness of travel whatever the amplitude. An indeterminate
 * bar carries the tighter wave M3 draws while the value is unknown.
 */
export function ProgressBar({
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  buffer,
  decorative = false,
  delay,
  format,
  hideLabel,
  label,
  loading = true,
  locale,
  max,
  min,
  minDuration,
  onWithdraw,
  placement = 'inline',
  render,
  showValue,
  size,
  style,
  tone,
  value,
  valueText,
  wave = false,
  ...nativeProps
}: ProgressBarProps) {
  const resolved = useProgressIndicator({
    ariaHidden,
    ariaLabel,
    ariaLabelledBy,
    component: 'ProgressBar',
    decorative,
    delay,
    /**
     * A bar on an edge has no room for a visible name and still needs one, so
     * the placement decides it — and a consumer who states `hideLabel`
     * outright still wins, which is the rule the whole library follows.
     */
    hideLabel: hideLabel ?? placement !== 'inline',
    label,
    loading,
    locale,
    measure: { value, min, max, buffer, format, showValue, valueText },
    minDuration,
    onWithdraw,
    shape: 'linear',
    size,
    tone,
  });

  const rootProps: ProgressRootProps = {
    ...nativeProps,
    ...resolved.identity,
    'aria-label': ariaLabel,
    children: (
      <>
        {progressLabel(resolved)}
        {progressValue(resolved)}
        <div data-part="track" data-part-track="">
          {wave ? (
            <svg
              aria-hidden="true"
              data-part="indicator"
              data-part-indicator=""
              focusable="false"
              key={resolved.paint}
              preserveAspectRatio="xMinYMid meet"
              viewBox={`0 -1.25 ${PROGRESS_WAVE_BAR_REACH} 2.5`}
            >
              <path
                d={
                  resolved.geometry.indeterminate
                    ? PROGRESS_WAVE_BAR_INDETERMINATE_PATH
                    : PROGRESS_WAVE_BAR_PATH
                }
                pathLength={PROGRESS_WAVE_BAR_REACH}
              />
            </svg>
          ) : (
            <div data-part="indicator" data-part-indicator="" key={resolved.paint} />
          )}
        </div>
      </>
    ),
    ...(resolved.geometry.buffer === null ? {} : { 'data-buffered': '' }),
    ...(placement === 'inline' ? {} : { 'data-placement': placement }),
    ...(wave ? { 'data-wave': '' } : {}),
    style: progressStyle(resolved, style),
  };

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
