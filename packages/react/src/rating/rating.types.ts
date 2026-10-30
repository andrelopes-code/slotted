import type { PartialMessages, RatingMessages } from '@slotted/core/i18n';
import type { RatingInsight, RatingInsightThresholds } from '@slotted/core/rating';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

/** The step the symbols and the text beside them sit at. */
export type RatingSize = 'sm' | 'md' | 'lg';

/**
 * The color a lit symbol takes. `secondary` is not among them: its solid step
 * is a ground, and a star lit in it reads as an unlit one.
 */
export type RatingTone = 'accent' | 'info' | 'success' | 'warning' | 'danger';

/** The smallest move of the input member: a whole symbol, or half of one. */
export type RatingStep = 1 | 0.5;

/** How the display member draws a value: every symbol, or one beside the number. */
export type RatingDisplayVariant = 'full' | 'compact' | 'histogram';

/** How the summary draws a distribution: one bar per level, or columns over an axis. */
export type RatingSummaryVariant = 'bars' | 'spectrum';

/** Why the value moved. The input member produces exactly these three. */
export type RatingChangeReason = Extract<
  ChangeRequest<number | null>['reason'],
  'pointer' | 'keyboard' | 'clear'
>;

/** The request the input member emits. `null` is no rating, and `clear` asks for it. */
export type RatingChangeRequest = ChangeRequest<number | null>;

/** The request the summary emits when a level is pressed. */
export type RatingLevelsChangeRequest = ChangeRequest<readonly number[]>;

/** What an application sets once for every rating under it. */
export interface RatingDefaults {
  size: RatingSize;
  tone: RatingTone;
  max: number;
  clearable: boolean;
  insightThresholds: RatingInsightThresholds;
}

export interface RatingProviderProps {
  children?: ReactNode | undefined;
  size?: RatingSize | undefined;
  tone?: RatingTone | undefined;
  max?: number | undefined;
  clearable?: boolean | undefined;
  /** Merged over the inherited thresholds, key by key. */
  insightThresholds?: Partial<RatingInsightThresholds> | undefined;
}

/** What `renderSymbol` receives for each symbol. */
export interface RatingSymbolState {
  /** The symbol's position, from nought. */
  index: number;
  /** How much of the symbol the current value lights, from nought to one. */
  fill: number;
}

/** What a function `caption` receives. */
export interface RatingCaptionState {
  /** The value the group holds. */
  value: number | null;
  /** The value under the pointer, or `null`. */
  preview: number | null;
}

/** The imperative action a declarative prop cannot express. */
export interface RatingHandle {
  /** Moves focus to the checked radio, or to the first when the value is empty. */
  focus(): void;
}

/** What `render` receives for a root. */
export interface RatingRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-dragging'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-max'?: number | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-size': RatingSize;
  'data-step'?: RatingStep | undefined;
  'data-tone': RatingTone;
  'data-ui': string;
  'data-variant'?: string | undefined;
}

export interface RatingProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'defaultValue'
> {
  /**
   * A word for the value, in the `value` part. A function receives the value
   * held and the value under the pointer, so the word can follow the pointer.
   */
  caption?: ReactNode | ((state: RatingCaptionState) => ReactNode) | undefined;
  /** Unstated, the provider's, then `true`. Pressing the checked radio empties the value. */
  clearable?: boolean | undefined;
  /** The value an uncontrolled rating starts from, read once. `null` is no rating. */
  defaultValue?: number | null | undefined;
  /** Unstated rather than `false`, so the rating defers to the field around it. */
  disabled?: boolean | undefined;
  /** The form the radios submit with, when it is not the one around them. */
  form?: string | undefined;
  /** Reaches `focus()`. `ref` reaches the root. */
  handle?: Ref<RatingHandle> | undefined;
  /** Unstated rather than `false`. Writes `aria-invalid` and `data-invalid`. */
  invalid?: boolean | undefined;
  /** The locale numbers are written in. Unstated, the language in force. */
  locale?: string | undefined;
  /** How many symbols. Unstated, the provider's, then 5. */
  max?: number | undefined;
  /** Words laid over the catalog of the language in force, key by key. */
  messages?: PartialMessages<RatingMessages> | undefined;
  /** The submission name the radios share. Generated when it is not written. */
  name?: string | undefined;
  /** The value under the pointer, or `null` when the pointer leaves. Changes nothing. */
  onPreviewChange?: ((value: number | null) => void) | undefined;
  /** Called before the value moves, with the request that carries the reason. */
  onValueChange?: ((value: number | null, request: RatingChangeRequest) => void) | undefined;
  /** Unstated rather than `false`. Every change is refused and `aria-readonly` is written. */
  readOnly?: boolean | undefined;
  /** Renders the root into another element. */
  render?: ((props: RatingRootProps) => ReactNode) | undefined;
  /** Replaces the star drawn in each symbol and in its fill. */
  renderSymbol?: ((state: RatingSymbolState) => ReactNode) | undefined;
  /** Unstated rather than `false`. Writes `aria-required` on the group. */
  required?: boolean | undefined;
  /** Unstated, the field's, then the provider's, then `md`. */
  size?: RatingSize | undefined;
  /** A whole symbol or half of one. Defaults to 1. */
  step?: RatingStep | undefined;
  /** Unstated, the provider's, then `warning`. */
  tone?: RatingTone | undefined;
  /** Present means controlled, for the life of the component; `null` is a controlled empty value. */
  value?: number | null | undefined;
}

export interface RatingDisplayProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** How many ratings the value is made of. Present, it is written and named. */
  count?: number | undefined;
  /** Counts per level, lowest first, drawn by the `histogram` variant. */
  distribution?: readonly number[] | undefined;
  locale?: string | undefined;
  /** How many symbols the scale has. Unstated, the provider's, then 5. */
  max?: number | undefined;
  /** Words laid over the catalog of the language in force, key by key. */
  messages?: PartialMessages<RatingMessages> | undefined;
  /** Renders the root into another element. */
  render?: ((props: RatingRootProps) => ReactNode) | undefined;
  /** Replaces the star drawn in each symbol and in its fill. */
  renderSymbol?: ((state: RatingSymbolState) => ReactNode) | undefined;
  /** Whether the number is written beside the symbols. Defaults to `true`. */
  showValue?: boolean | undefined;
  size?: RatingSize | undefined;
  tone?: RatingTone | undefined;
  /** The value reported, any fraction; clamped to the scale. */
  value: number;
  /** Defaults to `full`. */
  variant?: RatingDisplayVariant | undefined;
}

export interface RatingSummaryProps extends Omit<ComponentPropsWithRef<'section'>, 'children'> {
  /** How many ratings each level holds, lowest level first. */
  counts: readonly number[];
  /** The levels an uncontrolled summary starts pressed, read once. */
  defaultSelectedLevels?: readonly number[] | undefined;
  /** Whether each level is a button that filters. Defaults to `false`. */
  filterable?: boolean | undefined;
  /** Merged over the provider's thresholds, key by key. */
  insightThresholds?: Partial<RatingInsightThresholds> | undefined;
  locale?: string | undefined;
  /** How many levels the scale has. Unstated, the provider's, then 5. */
  max?: number | undefined;
  /** Words laid over the catalog of the language in force, key by key. */
  messages?: PartialMessages<RatingMessages> | undefined;
  /** Called before the pressed levels move, with the request that carries the reason. */
  onSelectedLevelsChange?:
    ((levels: readonly number[], request: RatingLevelsChangeRequest) => void) | undefined;
  /** Renders the root into another element. */
  render?: ((props: RatingRootProps) => ReactNode) | undefined;
  /** Present means controlled, for the life of the component. */
  selectedLevels?: readonly number[] | undefined;
  /** Whether the spectrum writes its conclusion. Defaults to `true`. */
  showInsight?: boolean | undefined;
  size?: RatingSize | undefined;
  tone?: RatingTone | undefined;
  /** Defaults to `bars`. */
  variant?: RatingSummaryVariant | undefined;
}

export type { RatingInsight, RatingInsightThresholds };
