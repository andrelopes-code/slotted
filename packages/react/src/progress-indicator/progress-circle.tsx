import '@slotted/styles/progress-indicator/progress-indicator.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import { PROGRESS_WAVE_RING_PATH } from '@slotted/core/progress';

import { progressLabel, progressStyle, progressValue } from './progress-parts';
import { useProgressIndicator } from './use-progress-indicator';
import type { ProgressCircleProps, ProgressRootProps } from './progress-indicator.types';

/**
 * The circular recipe, and with no value the spinner every surveyed library
 * ships under that name.
 *
 * Two concentric shapes in one `48 48` box, each carrying `pathLength="100"`
 * so a dash length *is* the percentage and the stylesheet needs no arithmetic
 * of its own. The stroke is stated in the viewBox's own units, which makes it
 * one eighth of the diameter at every size — the ratio `button` derived for
 * its own loading ring, so the ring in a button and this circle are the same
 * object.
 *
 * The number sits beside the ring rather than inside it: the largest ring this
 * family draws is 38 pixels across with a 4.75-pixel stroke, which leaves 28
 * pixels of hole, and a percentage centred in it would be four-pixel type. Ant
 * Design and MUI both put it inside because both draw rings twice this size.
 *
 * With `wave` the indicator is M3's wavy ring from `@slotted/core/progress`
 * and the track stays a circle, which is what `CircularWavyProgressModifiers`
 * draws: only the active indicator morphs.
 */
export function ProgressCircle({
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
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
  render,
  showValue,
  size,
  style,
  tone,
  value,
  valueText,
  wave = false,
  ...nativeProps
}: ProgressCircleProps) {
  const resolved = useProgressIndicator({
    ariaHidden,
    ariaLabel,
    ariaLabelledBy,
    component: 'ProgressCircle',
    decorative,
    delay,
    hideLabel,
    label,
    loading,
    locale,
    measure: { value, min, max, buffer: null, format, showValue, valueText },
    minDuration,
    onWithdraw,
    shape: 'circular',
    size,
    tone,
  });

  const rootProps: ProgressRootProps = {
    ...nativeProps,
    ...resolved.identity,
    'aria-label': ariaLabel,
    children: (
      <>
        {/*
          Hidden from assistive technology, and that is not the belt-and-braces
          it looks like: the root carries the role and the range, and the role
          is children-presentational, so the drawing inside it is already
          pruned. The attribute is what stops a reader from meeting an unnamed
          graphic if a consumer substitutes the root through `render`.
        */}
        <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48">
          {/*
            The track is a circle whether or not the indicator waves, which is
            what M3 draws: only the active indicator morphs, and the wave is
            wound on the same radius the track is drawn at.
          */}
          <circle cx="24" cy="24" data-part="track" data-part-track="" pathLength="100" r="20" />
          {wave ? (
            <path
              d={PROGRESS_WAVE_RING_PATH}
              data-part="indicator"
              data-part-indicator=""
              key={resolved.paint}
              pathLength="100"
            />
          ) : (
            <circle
              cx="24"
              cy="24"
              data-part="indicator"
              data-part-indicator=""
              key={resolved.paint}
              pathLength="100"
              r="20"
            />
          )}
        </svg>
        {progressLabel(resolved)}
        {progressValue(resolved)}
      </>
    ),
    ...(wave ? { 'data-wave': '' } : {}),
    style: progressStyle(resolved, style),
  };

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
