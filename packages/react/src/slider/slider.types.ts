import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

/** The type step the control sits at, matching the field around it. */
export type SliderSize = 'sm' | 'md' | 'lg';

/**
 * Which axis the scale runs along. A vertical slider's minimum is at the
 * bottom, which is where the browser's own vertical range input and every
 * surveyed implementation put it.
 */
export type SliderOrientation = 'horizontal' | 'vertical';

/**
 * When the value stands on the thumb.
 *
 * `auto` shows it while the thumb is being dragged or has the caret, `always`
 * shows it at rest as well, and `none` withdraws it — which is what a scale
 * whose values are words needs, because a bubble is for a number and the
 * read-out is for a sentence.
 */
export type SliderValueLabel = 'auto' | 'always' | 'none';

/** Where the filled portion starts: an end of the scale, or a point on it. */
export type SliderOrigin = 'min' | 'max' | number;

/** A tick on the scale, with the label that may become the announced value. */
export interface SliderMark {
  value: number;
  /** Drawn under the tick, and announced in place of the number at that value. */
  label?: string | undefined;
}

/** Why the value moved. */
export type SliderValueReason = Extract<
  ChangeRequest<number[]>['reason'],
  'pointer' | 'keyboard' | 'programmatic'
>;

/**
 * The one action a consumer cannot express by passing a value: putting focus on
 * a named thumb, so a keyboard shortcut elsewhere on the page can reach it.
 */
export interface SliderHandle {
  focusThumb(index?: number): void;
}

/** What an application sets once for every slider under it. */
export interface SliderDefaults {
  orientation: SliderOrientation;
  size: SliderSize;
  valueLabel: SliderValueLabel;
}

export interface SliderDefaultsProviderProps extends Partial<SliderDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives for the root. Written against
 * `HTMLAttributes<HTMLElement>` so it can be spread onto any element, which is
 * what makes the substitution real.
 */
export interface SliderRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-dragging'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-marks'?: 'ticks' | 'labelled' | undefined;
  'data-orientation': SliderOrientation;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-size': SliderSize;
  'data-ui': string;
  'data-value-label': SliderValueLabel;
}

/**
 * `defaultValue`, `value`, `min`, `max` and `step` are omitted and redeclared:
 * the element's own types admit strings, and this family's value is a number or
 * an array of them. `size` is omitted because on an `input` it is a character
 * count and this family's axis is a type step. `type` is omitted because the
 * element is always a range.
 *
 * Everything else is the element's and reaches every thumb's input:
 * `autoComplete`, `aria-*`, `onFocus`, `onBlur` and the rest. `className` and
 * `style` are the exception, and they reach the root, because the root is what
 * a consumer sees.
 */
export interface SliderProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'defaultValue' | 'max' | 'min' | 'size' | 'step' | 'type' | 'value'
> {
  /** The value an uncontrolled slider starts from, read once. An array makes a range. */
  defaultValue?: number | readonly number[] | undefined;
  /**
   * Unstated rather than `false`, so the control defers to the field around it.
   * Stated, it wins, and it is the native attribute on every thumb.
   */
  disabled?: boolean | undefined;
  /** How the value is written, through `Intl.NumberFormat`. */
  format?: Intl.NumberFormatOptions | undefined;
  /** Reaches `focusThumb(index)`. `ref` reaches the first thumb's input. */
  handle?: Ref<SliderHandle> | undefined;
  /**
   * Unstated rather than `false`. Writes `aria-invalid` on every thumb and
   * `data-invalid` on the root.
   */
  invalid?: boolean | undefined;
  /** The amount `Shift` and the page keys move by. Defaults to `step * 10`. */
  largeStep?: number | undefined;
  /** BCP 47. Unset, the language in force decides. */
  locale?: string | undefined;
  /** The ticks drawn beside the rail. A mark's label becomes its announced value. */
  marks?: readonly (number | SliderMark)[] | undefined;
  /** The largest value the scale holds. */
  max?: number | undefined;
  /** The smallest value the scale holds. */
  min?: number | undefined;
  /** How many steps must stay between two neighbouring thumbs. */
  minStepsBetween?: number | undefined;
  /** Called before the value moves, with the request that carries the reason. */
  onValueChange?:
    ((value: number | number[], request: ChangeRequest<number[]>) => void) | undefined;
  /**
   * Called once when a drag ends or a key settles the value. A drag emits a
   * hundred changes and one commit; this is the commit.
   */
  onValueCommit?: ((value: number | number[], reason: SliderValueReason) => void) | undefined;
  /** Where the filled portion starts. Defaults to `min`. */
  origin?: SliderOrigin | undefined;
  /** Defaults to the provider, then to `horizontal`. */
  orientation?: SliderOrientation | undefined;
  /** Unstated rather than `false`. The family refuses every change and writes `aria-readonly`. */
  readOnly?: boolean | undefined;
  /** Renders the root into another element. */
  render?: ((props: SliderRootProps) => ReactNode) | undefined;
  /** Defaults to the field, then to the provider, then to `md`. */
  size?: SliderSize | undefined;
  /** The amount the arrows and a track press move by. */
  step?: number | undefined;
  /**
   * The accessible name of each thumb, in order. A range whose thumbs share one
   * name gives a reader two sliders called the same thing, which the multi-thumb
   * pattern is explicit about.
   */
  thumbLabels?: readonly string[] | undefined;
  /** Present means controlled, for the life of the component. An array makes a range. */
  value?: number | readonly number[] | undefined;
  /** When the value stands on the thumb. Defaults to the provider, then `auto`. */
  valueLabel?: SliderValueLabel | undefined;
}
