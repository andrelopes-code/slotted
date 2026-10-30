import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode, RefObject } from 'react';

/**
 * Which way the bar's own line runs.
 *
 * The family holds no panels, so there is nothing else for `orientation` to
 * describe and `aria-orientation` takes the same value. A family that held
 * panels would have to say which of the two the word means — the panes are
 * side by side while the separator between them is vertical — and the two
 * readings are perpendicular. Here they cannot disagree.
 */
export type SplitterOrientation = 'vertical' | 'horizontal';

/**
 * A limit on how far the bar goes.
 *
 * A number is a fraction of the container, in `[0, 1]`, which is the unit the
 * value itself is in. A string is any CSS length — `'200px'`, `'18rem'`,
 * `'25%'`, `'10vw'` — resolved against the container at the moment of the
 * clamp.
 *
 * Both, because both are real. Zag, Ark, PrimeNG and allotment are
 * percentage-only, and Zag states the limitation outright; none of them can
 * express "this navigation panel never goes below two hundred pixels", which
 * is the commonest constraint the family has. A fraction, meanwhile, is the
 * only thing that says "never past sixty per cent of the window" without the
 * consumer recomputing it on every resize.
 */
export type SplitterLimit = number | string;

/** Why the bar moved. */
export type SplitterValueReason = Extract<
  ChangeRequest<number>['reason'],
  'pointer' | 'keyboard' | 'programmatic'
>;

/** The request the bar emits before its position moves. */
export interface SplitterValueRequest extends ChangeRequest<number> {
  readonly reason: SplitterValueReason;
}

/** The request the bar emits before it collapses or comes back. */
export interface SplitterCollapsedRequest extends ChangeRequest<boolean> {
  readonly reason: SplitterValueReason;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface SplitterHandle {
  /** Collapses to `collapsedValue`, carrying `programmatic`. */
  collapse: () => void;
  /** Restores the fraction held before the collapse. */
  expand: () => void;
  /** Returns the bar to `defaultValue`, which is what a double click does. */
  reset: () => void;
  /** Moves focus to the bar. */
  focus: () => void;
  /** The bar, once it is in the document. */
  readonly bar: HTMLElement | null;
}

/** What a splitter is here, before it states anything of its own. */
export interface SplitterDefaults {
  readonly orientation: SplitterOrientation;
  readonly min: SplitterLimit;
  readonly max: SplitterLimit;
  readonly collapsedValue: number;
}

export interface SplitterDefaultsProviderProps extends Partial<SplitterDefaults> {
  readonly children?: ReactNode;
}

export interface SplitterProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'ref'> {
  /** Which way the bar's line runs. Defaults to `vertical`. */
  orientation?: SplitterOrientation | undefined;

  /**
   * The element the bar sizes. Omitted, the bar takes its own previous element
   * sibling, which is what the DOM already says.
   *
   * It is also what `aria-controls` names and what carries
   * `--slotted-splitter-value`, so the element announced and the element sized
   * are one element rather than two that can drift.
   */
  for?: RefObject<HTMLElement | null> | undefined;

  /** The fraction of the container taken by the region before the bar. */
  value?: number | undefined;
  /** Where an uncontrolled bar starts, and where a double click returns it. */
  defaultValue?: number | undefined;
  onValueChange?: (value: number, request: SplitterValueRequest) => void;

  /**
   * Fires once, when a drag settles. `onValueChange` fires throughout one, so a
   * consumer saving a layout to storage saves once here rather than sixty times
   * there.
   */
  onResizeEnd?: (value: number) => void;

  min?: SplitterLimit | undefined;
  max?: SplitterLimit | undefined;

  /** Stops the bar releases onto, as fractions. Empty means a continuous range. */
  snapPoints?: readonly number[] | undefined;

  /** Whether `Enter` collapses the region before the bar. */
  collapsible?: boolean | undefined;
  /** Where a collapse lands. Nought by default. */
  collapsedValue?: number | undefined;
  collapsed?: boolean | undefined;
  defaultCollapsed?: boolean | undefined;
  onCollapsedChange?: (collapsed: boolean, request: SplitterCollapsedRequest) => void;

  /**
   * Stops the bar moving. It keeps its tab stop: a reader who cannot move a
   * separator can still read the value it holds, and taking the stop away would
   * take the announcement with it.
   */
  disabled?: boolean | undefined;

  /** Substitutes the element the bar renders as. */
  render?: ((props: ComponentPropsWithRef<'div'>) => ReactNode) | undefined;

  ref?: RefObject<SplitterHandle | null> | ((handle: SplitterHandle | null) => void) | undefined;
}
