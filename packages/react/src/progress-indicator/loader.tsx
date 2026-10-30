import '@slotted/styles/progress-indicator/progress-indicator.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import { progressLabel } from './progress-parts';
import { useProgressIndicator } from './use-progress-indicator';
import type { LoaderProps, ProgressRootProps } from './progress-indicator.types';

/**
 * The wait a shape keeps, rather than the wait a ring reports.
 *
 * It is M3 Expressive's loading indicator, which Google recommends *instead of*
 * an indeterminate circular indicator for a wait under five seconds, and which
 * no other design system and no headless library surveyed ships at all. A
 * rounded shape morphs through a sequence — circle, clover, flower, trefoil,
 * oval — while it turns, at two periods that do not divide into each other, so
 * the sequence never shows the same shape in the same orientation twice.
 *
 * It measures nothing on purpose. A loader with a value would be a circle
 * whose progress nobody could read off a morphing outline, and the family
 * already has two shapes that report a number.
 *
 * `contained` draws M3's fully rounded container behind the shape, at M3's own
 * 38:48 ratio. It is the form to reach for on a photograph or a colored
 * surface, where a bare shape has no ground to be seen against.
 */
export function Loader({
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  contained = false,
  decorative = false,
  delay,
  hideLabel,
  label,
  loading = true,
  minDuration,
  onWithdraw,
  render,
  size,
  tone,
  ...nativeProps
}: LoaderProps) {
  const resolved = useProgressIndicator({
    ariaHidden,
    ariaLabel,
    ariaLabelledBy,
    component: 'Loader',
    decorative,
    delay,
    hideLabel,
    label,
    loading,
    locale: undefined,
    measure: undefined,
    minDuration,
    onWithdraw,
    shape: 'morph',
    size,
    tone,
  });

  const rootProps: ProgressRootProps = {
    ...nativeProps,
    ...resolved.identity,
    'aria-label': ariaLabel,
    children: (
      <>
        <div data-part="track" data-part-track="">
          <div data-part="indicator" data-part-indicator="" />
        </div>
        {progressLabel(resolved)}
      </>
    ),
    ...(contained ? { 'data-contained': '' } : {}),
  };

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
