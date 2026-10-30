import type { PartialMessages, SkeletonMessages } from '@slotted/core/i18n';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export type SkeletonShape = 'text' | 'block' | 'circle' | 'square';
export type SkeletonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SkeletonAnimation = 'shimmer' | 'pulse' | 'none';
export type SkeletonLive = 'polite' | 'off';

/**
 * What every placeholder in an application looks like, and how a load is
 * timed, before any of them states anything of its own. The two durations are
 * here rather than on a box because the policy is an application's: a team
 * decides once that a wait under two hundred milliseconds is not worth
 * reporting, and every region inherits it.
 */
export interface SkeletonDefaults {
  animation?: SkeletonAnimation | undefined;
  delay?: number | undefined;
  lastLineSize?: string | undefined;
  live?: SkeletonLive | undefined;
  loadedLabel?: string | undefined;
  minDuration?: number | undefined;
}

export interface SkeletonDefaultsProviderProps extends SkeletonDefaults {
  children?: ReactNode;
}

/**
 * The geometry a placeholder reserves, when the content it stands for is not
 * there to be measured. Named for the axes the layout is written in rather
 * than for the screen's, because every rule in this library is logical and a
 * `width` prop feeding an `inline-size` declaration would be one word lying
 * about the other.
 */
export interface SkeletonGeometry {
  blockSize?: number | string | undefined;
  inlineSize?: number | string | undefined;
}

export interface SkeletonRootProps extends ComponentPropsWithRef<'span'> {
  'aria-hidden': boolean | 'true' | 'false' | undefined;
  'data-animation': SkeletonAnimation;
  'data-loading': true | undefined;
  'data-part': string;
  'data-shape': SkeletonShape;
  'data-size': SkeletonSize;
  'data-ui': string;
  inert?: boolean | undefined;
}

export interface SkeletonProps extends ComponentPropsWithRef<'span'>, SkeletonGeometry {
  animation?: SkeletonAnimation;
  /**
   * Whether the content this stands for is still on its way. Unset, it is the
   * nearest region's answer, then the provider's, then `true`: a placeholder
   * that was never told anything is a placeholder.
   */
  loading?: boolean;
  render?: (props: SkeletonRootProps) => ReactNode;
  shape?: SkeletonShape;
  /** Meaningful for `circle` and `square`, which read the avatar scale. */
  size?: SkeletonSize;
}

export interface SkeletonTextRootProps extends ComponentPropsWithRef<'div'> {
  'aria-hidden': boolean | 'true' | 'false' | undefined;
  children: ReactNode;
  'data-animation': SkeletonAnimation;
  'data-loading': true | undefined;
  'data-part': string;
  'data-ui': string;
  inert?: boolean | undefined;
}

export interface SkeletonTextProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children'>, Pick<SkeletonGeometry, 'inlineSize'> {
  animation?: SkeletonAnimation;
  /** How wide the last row is drawn, when there is more than one. */
  lastLineSize?: string;
  /** How many rows of the paragraph to reserve. */
  lines?: number;
  loading?: boolean;
  render?: (props: SkeletonTextRootProps) => ReactNode;
}

export interface SkeletonRegionRootProps extends ComponentPropsWithRef<'div'> {
  'aria-busy': true | undefined;
  children: ReactNode;
  'data-animation': SkeletonAnimation;
  'data-loading': true | undefined;
  'data-part': string;
  'data-ui': string;
  inert?: boolean | undefined;
}

export interface SkeletonRegionProps extends ComponentPropsWithRef<'div'> {
  animation?: SkeletonAnimation;
  /** How long the wait must last before anything is painted. */
  delay?: number;
  /**
   * Words laid over the catalog of the language in force, key by key: what a
   * screen reader hears once, while the region is waiting (`label`).
   */
  messages?: PartialMessages<SkeletonMessages> | undefined;
  /** Whether the region announces at all. */
  live?: SkeletonLive;
  /** What a screen reader hears when the content arrives. Silent by default. */
  loadedLabel?: string;
  loading?: boolean;
  /** How long a placeholder that did appear is held before it is withdrawn. */
  minDuration?: number;
  /**
   * The moment the placeholders are actually withdrawn, which is later than
   * `loading` turning false whenever `minDuration` is holding them. It is what
   * an application moves focus on.
   */
  onReveal?: () => void;
  render?: (props: SkeletonRegionRootProps) => ReactNode;
}
