import { selectorKeyProps } from '@slotted/core/selector-key';
import type { CSSProperties, ReactNode } from 'react';

import type { ResolvedProgressIndicator } from './use-progress-indicator';

/**
 * The name, rendered. It is a real element rather than an `aria-label` for the
 * reason `spinner` recorded: a string in the template is the one a translation
 * pass finds. `hideLabel` clips it with another family's one authored rule
 * instead of a copy of the clip technique, which is the mechanism
 * `status-indicator` established for its own announcement.
 */
export function progressLabel(resolved: ResolvedProgressIndicator): ReactNode {
  if (resolved.labelText === undefined) return null;

  return (
    <span
      data-part="label"
      data-part-label=""
      id={resolved.labelId}
      {...(resolved.labelHidden
        ? { 'data-ui': 'visually-hidden', ...selectorKeyProps('ui', 'visually-hidden') }
        : {})}
    >
      {resolved.labelText}
    </span>
  );
}

/**
 * The formatted number, and only when there is one: an indeterminate indicator
 * has no value to write, so the part is absent from the DOM rather than
 * present and empty — which is what lets the grid's first row collapse.
 */
export function progressValue(resolved: ResolvedProgressIndicator): ReactNode {
  if (!resolved.showValue) return null;
  return (
    <span data-part="value" data-part-value="">
      {resolved.valueText}
    </span>
  );
}

/**
 * The percentage, as the custom properties every part of the stylesheet reads.
 * It is a style rather than an attribute because it is a number the browser
 * interpolates: the properties are registered, so one transition on the root
 * moves the fill, the gap, the arc and the buffer together.
 */
export function progressStyle(
  resolved: ResolvedProgressIndicator,
  style: CSSProperties | undefined,
): CSSProperties {
  return {
    ...style,
    '--slotted-progress-indicator-percent': resolved.geometry.percent,
    ...(resolved.geometry.buffer === null
      ? {}
      : { '--slotted-progress-indicator-buffer-percent': resolved.geometry.buffer }),
  } as CSSProperties;
}
