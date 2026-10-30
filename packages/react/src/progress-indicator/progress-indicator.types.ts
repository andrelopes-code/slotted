import type { ComponentPropsWithRef, ReactNode } from 'react';

export type ProgressSize = 'sm' | 'md' | 'lg';
export type ProgressTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
export type ProgressPlacement = 'inline' | 'page' | 'edge-start' | 'edge-end';
/** The geometry a component draws. Written to `data-shape`, never chosen. */
export type ProgressShape = 'linear' | 'circular' | 'morph';

/**
 * What every indicator in an application looks like, and how a wait is timed,
 * before any of them states anything of its own.
 *
 * The two durations are here rather than on an indicator because the policy is
 * an application's: a team decides once that a wait under two hundred
 * milliseconds is not worth reporting, and every bar inherits it. `locale` is
 * here for the same reason — the digits of a percentage belong to the
 * application's language, not to one upload.
 */
export interface ProgressIndicatorDefaults {
  delay?: number | undefined;
  label?: string | undefined;
  locale?: string | undefined;
  minDuration?: number | undefined;
  size?: ProgressSize | undefined;
  tone?: ProgressTone | undefined;
}

export interface ProgressIndicatorDefaultsProviderProps extends ProgressIndicatorDefaults {
  children?: ReactNode;
}

/** What all three components share. */
interface ProgressCommonProps {
  /**
   * Whether the wait is still on. `false` withdraws the indicator, honouring
   * `minDuration`.
   */
  loading?: boolean;
  /** Milliseconds the wait must last before anything is painted. */
  delay?: number;
  /** Milliseconds an indicator that did appear is held before it is withdrawn. */
  minDuration?: number;
  /**
   * The moment the indicator actually leaves the page, which is later than
   * `loading` turning false whenever `minDuration` is holding it. It is what an
   * application unmounts the surrounding card on.
   */
  onWithdraw?: () => void;
  /** The rendered accessible name. */
  label?: string;
  /** Clips the label and keeps it as the name. Implied by every placement but `inline`. */
  hideLabel?: boolean;
  /**
   * Takes the indicator out of the accessibility tree: no role, no range, no
   * name. For the one case the feature guide names — a spinner beside text
   * that already says what is happening.
   */
  decorative?: boolean;
  size?: ProgressSize;
  tone?: ProgressTone;
}

/** What the two measured components add. */
interface ProgressMeasuredProps extends ProgressCommonProps {
  /** The quantity. `null` — the default — is indeterminate. */
  value?: number | null;
  min?: number;
  max?: number;
  /** Whether the formatted number is rendered beside the name. */
  showValue?: boolean;
  /** A string the family cannot compute: “3 of 7 files”, “about a minute left”. */
  valueText?: string;
  /** How the number is written. Absent, the ratio is written as a percentage. */
  format?: Intl.NumberFormatOptions;
  /** BCP 47. Absent, the provider's, then the runtime's own. */
  locale?: string;
  /** M3 Expressive's wavy active indicator. */
  wave?: boolean;
}

/**
 * The attributes every root carries. A `render` prop receives exactly this, so
 * a substituted element keeps the identity, the role, the range and the state.
 */
export interface ProgressRootProps extends ComponentPropsWithRef<'div'> {
  'aria-hidden': boolean | 'true' | 'false' | undefined;
  'aria-labelledby': string | undefined;
  'aria-valuemax': number | undefined;
  'aria-valuemin': number | undefined;
  'aria-valuenow': number | undefined;
  'aria-valuetext': string | undefined;
  children: ReactNode;
  'data-complete': '' | undefined;
  'data-indeterminate': '' | undefined;
  'data-part': string;
  'data-shape': ProgressShape;
  'data-size': ProgressSize;
  'data-tone': ProgressTone;
  'data-ui': string;
  hidden: true | undefined;
  role: 'progressbar' | undefined;
}

export interface ProgressBarProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children'>, ProgressMeasuredProps {
  /** A second, further quantity: received but not yet processed. */
  buffer?: number | null;
  /**
   * `page` pins the bar to the top edge of the viewport; `edge-start` and
   * `edge-end` stand it on the block-start or block-end edge of the nearest
   * positioned box, over the line that edge draws.
   */
  placement?: ProgressPlacement;
  render?: (props: ProgressRootProps) => ReactNode;
}

export interface ProgressCircleProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children'>, ProgressMeasuredProps {
  render?: (props: ProgressRootProps) => ReactNode;
}

export interface LoaderProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children'>, ProgressCommonProps {
  /** M3's fully rounded container behind the morphing shape. */
  contained?: boolean;
  render?: (props: ProgressRootProps) => ReactNode;
}
