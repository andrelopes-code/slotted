import { selectorKeyProps } from '@slotted/core/selector-key';
import { progressGeometry, progressValueText } from '@slotted/core/progress';
import type { ProgressGeometry } from '@slotted/core/progress';
import { useId, useState } from 'react';

import { useProgressIndicatorDefaults } from './progress-indicator-defaults';
import { useLoadingVisibility } from './use-loading-visibility';
import type { ProgressShape, ProgressSize, ProgressTone } from './progress-indicator.types';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

export const PROGRESS_DEFAULT_SIZE: ProgressSize = 'md';
export const PROGRESS_DEFAULT_TONE: ProgressTone = 'accent';

interface Request {
  shape: ProgressShape;
  /** The name of the component, for the one warning this family emits. */
  component: string;
  ariaHidden: boolean | 'true' | 'false' | undefined;
  ariaLabel: string | undefined;
  ariaLabelledBy: string | undefined;
  decorative: boolean;
  delay: number | undefined;
  hideLabel: boolean | undefined;
  label: string | undefined;
  loading: boolean;
  locale: string | undefined;
  minDuration: number | undefined;
  onWithdraw: (() => void) | undefined;
  size: ProgressSize | undefined;
  tone: ProgressTone | undefined;
  /** Absent on the loader, which measures nothing. */
  measure:
    | {
        value: number | null | undefined;
        min: number | undefined;
        max: number | undefined;
        buffer: number | null | undefined;
        format: Intl.NumberFormatOptions | undefined;
        showValue: boolean | undefined;
        valueText: string | undefined;
      }
    | undefined;
}

export interface ResolvedProgressIndicator {
  geometry: ProgressGeometry;
  /** Whether anything is painted at all: `delay` may still be running. */
  painted: boolean;
  /**
   * How many times the indicator has been painted after being withdrawn. The
   * indicator part is keyed by it, so an indeterminate sweep starts at its
   * leading edge each time it comes back rather than where the last one stood.
   */
  paint: number;
  labelId: string;
  labelText: string | undefined;
  labelHidden: boolean;
  /** The formatted number, or `undefined` when there is nothing to write. */
  valueText: string | undefined;
  showValue: boolean;
  size: ProgressSize;
  tone: ProgressTone;
  /** Everything the root carries that does not depend on the shape. */
  identity: {
    'aria-hidden': boolean | 'true' | 'false' | undefined;
    'aria-labelledby': string | undefined;
    'aria-valuemax': number | undefined;
    'aria-valuemin': number | undefined;
    'aria-valuenow': number | undefined;
    'aria-valuetext': string | undefined;
    'data-complete': '' | undefined;
    'data-indeterminate': '' | undefined;
    'data-part': string;
    'data-shape': ProgressShape;
    'data-size': ProgressSize;
    'data-tone': ProgressTone;
    'data-ui': string;
    hidden: true | undefined;
    role: 'progressbar' | undefined;
  };
}

/**
 * One resolution for three components: the defaults, the timing, the geometry,
 * the text and the identity.
 *
 * It is a hook rather than three copies because every one of those answers has
 * to be the same in a bar, a ring and a loader — and because the two that are
 * easiest to get subtly wrong are the two a test cannot see from outside: which
 * `aria-value*` attributes are absent while a wait is indeterminate, and
 * whether the painted percentage came from the same call as the announced one.
 */
export function useProgressIndicator({
  ariaHidden,
  ariaLabel,
  ariaLabelledBy,
  component,
  decorative,
  delay,
  hideLabel,
  label,
  loading,
  locale,
  measure,
  minDuration,
  onWithdraw,
  shape,
  size,
  tone,
}: Request): ResolvedProgressIndicator {
  const defaults = useProgressIndicatorDefaults();
  const labelId = useId();

  const labelText = label ?? defaults.label;
  const painted = useLoadingVisibility({
    delay: delay ?? defaults.delay ?? 0,
    loading,
    minDuration: minDuration ?? defaults.minDuration ?? 0,
    onWithdraw,
  });
  const [paint, setPaint] = useState(0);
  const [wasPainted, setWasPainted] = useState(painted);
  if (painted !== wasPainted) {
    setWasPainted(painted);
    if (painted) setPaint(paint + 1);
  }

  const geometry = progressGeometry({
    value: measure?.value,
    min: measure?.min,
    max: measure?.max,
    buffer: measure?.buffer,
  });

  const valueText =
    measure === undefined
      ? undefined
      : progressValueText({
          geometry,
          valueText: measure.valueText,
          format: measure.format,
          locale: locale ?? defaults.locale,
        });

  /**
   * A missing name is reported and rendered anyway. `icon-button` throws
   * because an unnamed icon button is unusable; a nameless progress bar still
   * reports visually, and taking a screen down mid-upload is worse than the
   * defect it would be reporting. The family this one replaces recorded the
   * same decision.
   */
  if (
    isDevelopment &&
    !decorative &&
    labelText === undefined &&
    ariaLabel === undefined &&
    ariaLabelledBy === undefined
  ) {
    console.warn(
      `${component} has no accessible name: pass label, or aria-label, or decorative when the text beside it already says what is happening.`,
    );
  }

  const named = labelText !== undefined && !decorative;

  return {
    geometry,
    painted,
    paint,
    labelId,
    labelText,
    labelHidden: hideLabel === true,
    valueText,
    showValue: measure?.showValue === true && !geometry.indeterminate && valueText !== undefined,
    size: size ?? defaults.size ?? PROGRESS_DEFAULT_SIZE,
    tone: tone ?? defaults.tone ?? PROGRESS_DEFAULT_TONE,
    identity: {
      /**
       * `decorative` is one switch and not two: it takes the role away as well
       * as hiding the box, because an indicator a reader can reach and that
       * announces nothing is worse than either half. The consumer's own
       * `aria-hidden` is passed through rather than overwritten, and the way
       * back into the tree is to stop saying `decorative`.
       */
      'aria-hidden': decorative ? (ariaHidden ?? 'true') : ariaHidden,
      'aria-labelledby': named ? (ariaLabelledBy ?? labelId) : ariaLabelledBy,
      /**
       * The range is written out even where it equals the ARIA default, so a
       * reader is never told a number that depends on one. `aria-valuenow` is
       * the one attribute that is absent rather than defaulted: ARIA 1.3 asks
       * an author to omit it while the value is indeterminate, and an omission
       * is what says "in progress, and nobody knows how far".
       */
      'aria-valuemax': decorative || measure === undefined ? undefined : geometry.max,
      'aria-valuemin': decorative || measure === undefined ? undefined : geometry.min,
      'aria-valuenow':
        decorative || geometry.indeterminate ? undefined : (geometry.valueNow ?? undefined),
      'aria-valuetext': decorative ? undefined : valueText,
      /**
       * An empty string rather than `true`, and it is the one place this
       * family differs from `skeleton` on purpose: React renders a `true`-valued
       * `data-*` attribute as `data-x="true"` while a template and the harness
       * fragment write `data-x=""`. Both match `[data-x]`, so nothing breaks —
       * and three writings of one DOM that differ in a value nobody reads is
       * three writings a reader has to compare character by character.
       */
      'data-complete': geometry.complete ? '' : undefined,
      'data-indeterminate': measure === undefined || geometry.indeterminate ? '' : undefined,
      'data-part': 'root',
      ...selectorKeyProps('part', 'root'),
      'data-shape': shape,
      'data-size': size ?? defaults.size ?? PROGRESS_DEFAULT_SIZE,
      'data-tone': tone ?? defaults.tone ?? PROGRESS_DEFAULT_TONE,
      'data-ui': 'progress-indicator',
      ...selectorKeyProps('ui', 'progress-indicator'),
      hidden: painted ? undefined : true,
      role: decorative ? undefined : 'progressbar',
    },
  };
}
