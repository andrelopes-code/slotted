import '@slotted/styles/loading-bar/loading-bar.css';

import { clamp, percentOf } from '@slotted/core/measure';

import type { LoadingBarProps, LoadingBarRootProps } from './loading-bar.types';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

/**
 * The same measurement as ProgressBar, reported the same way. What differs is
 * where it sits: a page-level bar belongs to the viewport, not to whatever
 * happens to contain it.
 */
export function LoadingBar({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  max = 100,
  placement = 'inline',
  render,
  value = null,
  valueText,
  ...nativeProps
}: LoadingBarProps) {
  if (isDevelopment && !ariaLabel?.trim() && !ariaLabelledBy?.trim()) {
    console.warn(
      'LoadingBar has no accessible name. Give it aria-label, or aria-labelledby pointing at the text that names it.',
    );
  }

  const indeterminate = value === null || Number.isNaN(value);
  const clamped = indeterminate ? 0 : clamp(value, 0, max);

  const rootProps: LoadingBarRootProps = {
    ...nativeProps,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-valuemax': max,
    'aria-valuemin': 0,
    'aria-valuenow': indeterminate ? undefined : clamped,
    'aria-valuetext': valueText,
    children: (
      <span
        data-part="indicator"
        style={indeterminate ? undefined : { inlineSize: `${percentOf(clamped, 0, max)}%` }}
      />
    ),
    className: ['slotted-loading-bar', className].filter(Boolean).join(' '),
    'data-indeterminate': indeterminate ? '' : undefined,
    'data-part': 'root',
    'data-placement': placement,
    'data-slotted-component': 'loading-bar',
    role: 'progressbar',
  };

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
