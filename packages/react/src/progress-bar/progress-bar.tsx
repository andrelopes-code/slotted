import '@slotted/styles/progress-bar/progress-bar.css';

import type { ProgressBarProps, ProgressBarRootProps } from './progress-bar.types';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

/**
 * A value outside the range is clamped rather than rejected: progress is
 * usually computed from two numbers an application does not fully control, and
 * a bar that overflows its track or runs backwards is worse than one that sits
 * at either end.
 */
export function ProgressBar({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  max = 100,
  render,
  value = null,
  valueText,
  ...nativeProps
}: ProgressBarProps) {
  if (isDevelopment && !ariaLabel?.trim() && !ariaLabelledBy?.trim()) {
    console.warn(
      'ProgressBar has no accessible name. Give it aria-label, or aria-labelledby pointing at the text that names it.',
    );
  }

  const indeterminate = value === null || Number.isNaN(value);
  const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), max);
  const fraction = max > 0 ? clamped / max : 0;

  const rootProps: ProgressBarRootProps = {
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
        style={indeterminate ? undefined : { inlineSize: `${(fraction * 100).toFixed(4)}%` }}
      />
    ),
    className: ['slotted-progress-bar', className].filter(Boolean).join(' '),
    'data-indeterminate': indeterminate ? '' : undefined,
    'data-part': 'root',
    'data-slotted-component': 'progress-bar',
    role: 'progressbar',
  };

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
