import type { FamilyTranslator, PartialMessages, StatCardMessages } from '@slotted/core/i18n';
import type { ComponentPropsWithRef, JSX, ReactNode } from 'react';

export type StatCardSize = 'sm' | 'md' | 'lg';
export type StatCardFill = 'outline' | 'elevated' | 'subtle' | 'plain';
export type StatCardLayout = 'inline' | 'stacked';
export type StatCardValueStatus = 'ready' | 'empty' | 'error';
export type StatCardGoodWhen = 'up' | 'down' | 'none';
export type StatCardTone =
  'neutral' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
export type StatCardAttention = 'warning' | 'danger';
export type StatCardDirection = 'up' | 'down' | 'flat';
export type StatCardDeltaFormat = 'percent' | 'decimal';

/**
 * What every card in an application does before any of them states anything
 * of its own. `goodWhen` is here because a product usually has one answer —
 * a sales dashboard wants everything up, an operations one wants everything
 * down — and a card that disagrees says so.
 */
export interface StatCardDefaults {
  fill?: StatCardFill | undefined;
  formatOptions?: Intl.NumberFormatOptions | undefined;
  goodWhen?: StatCardGoodWhen | undefined;
  layout?: StatCardLayout | undefined;
  size?: StatCardSize | undefined;
}

export interface StatCardDefaultsProviderProps extends StatCardDefaults {
  children?: ReactNode;
}

export interface StatCardRootProps extends ComponentPropsWithRef<'div'> {
  'aria-busy': true | undefined;
  'data-attention': StatCardAttention | undefined;
  'data-fill': StatCardFill;
  'data-good-when': StatCardGoodWhen;
  'data-layout': StatCardLayout;
  'data-loading': true | undefined;
  'data-part': string;
  'data-size': StatCardSize;
  'data-status': StatCardValueStatus;
  'data-tone': StatCardTone | undefined;
  'data-ui': string;
  role: 'group';
}

export interface StatCardProps extends ComponentPropsWithRef<'div'> {
  size?: StatCardSize;
  fill?: StatCardFill;
  layout?: StatCardLayout;
  /** Whether there is a value to show, and if not, why. */
  status?: StatCardValueStatus;
  /** The value is still on its way: every part stands in with a placeholder. */
  loading?: boolean;
  /** Which way is good for this metric. The delta's tone is derived from it, never from the sign. */
  goodWhen?: StatCardGoodWhen;
  /**
   * The change since the comparison period, as the first `Delta` inside reads
   * it: a fraction for a percentage (`0.124` is +12.4%), or a number. Stated
   * on the root so the card knows its tone before its delta renders.
   */
  delta?: number;
  /** The tone the card hands to its trend. Unset, it is the delta's. */
  tone?: StatCardTone;
  /**
   * The figure is past a threshold the product states: the value and the
   * edge take the tone, the delta keeps its own. A ready value only; the
   * comparison line says which threshold it passed.
   */
  attention?: StatCardAttention;
  /** The locale numbers are written in; the language in force when absent. */
  locale?: string;
  /** How the value, the delta and the comparison read numbers. */
  formatOptions?: Intl.NumberFormatOptions;
  /**
   * Words laid over the catalog of the language in force, key by key: what a
   * screen reader hears beside a change (`up`, `down`, `flat`, read before the
   * number because a sign is a glyph some readers skip) and what stands in for
   * a value that is not there (`empty`).
   */
  messages?: PartialMessages<StatCardMessages> | undefined;
  render?: (props: StatCardRootProps) => ReactNode;
}

export type StatCardPartProps<T extends keyof JSX.IntrinsicElements> = ComponentPropsWithRef<T> & {
  'data-part': string;
};

export interface StatCardHeaderProps extends ComponentPropsWithRef<'div'> {
  render?: (props: StatCardPartProps<'div'>) => ReactNode;
}

export interface StatCardLabelProps extends ComponentPropsWithRef<'span'> {
  render?: (props: StatCardPartProps<'span'>) => ReactNode;
}

export interface StatCardStatusProps extends ComponentPropsWithRef<'span'> {
  render?: (props: StatCardPartProps<'span'>) => ReactNode;
}

export interface StatCardActionProps extends ComponentPropsWithRef<'span'> {
  render?: (props: StatCardPartProps<'span'>) => ReactNode;
}

export interface StatCardFigureProps extends ComponentPropsWithRef<'div'> {
  render?: (props: StatCardPartProps<'div'>) => ReactNode;
}

export interface StatCardValueProps extends ComponentPropsWithRef<'span'> {
  /** A number, formatted with the card's locale and `formatOptions`; or the text as the consumer wrote it. `children` wins. */
  value?: number | string | undefined;
  formatOptions?: Intl.NumberFormatOptions;
  /**
   * `whole` draws a numeric value's symbol, decimals and suffix in the `unit`
   * part, so the whole units carry the figure. `none`, the default, draws one
   * run of text. The text is the formatter's either way.
   */
  emphasis?: StatCardValueEmphasis | undefined;
  render?: (props: StatCardPartProps<'span'>) => ReactNode;
}

export type StatCardValueEmphasis = 'none' | 'whole';

export interface StatCardUnitProps extends ComponentPropsWithRef<'span'> {
  render?: (props: StatCardPartProps<'span'>) => ReactNode;
}

export interface StatCardDeltaRootProps extends ComponentPropsWithRef<'span'> {
  'data-part': string;
  'data-tone': StatCardTone;
  'data-trend': StatCardDirection;
}

export interface StatCardDeltaProps extends ComponentPropsWithRef<'span'> {
  /** The change. Unset, the root's `delta`. */
  value?: number | undefined;
  /** `percent` reads the value as a fraction; `decimal` reads it as it is. */
  format?: StatCardDeltaFormat;
  formatOptions?: Intl.NumberFormatOptions;
  /** Unset, the root's. */
  goodWhen?: StatCardGoodWhen;
  /** An explicit tone, which wins over the one derived from `goodWhen`. */
  tone?: StatCardTone;
  render?: (props: StatCardDeltaRootProps) => ReactNode;
}

export interface StatCardComparisonProps extends ComponentPropsWithRef<'p'> {
  render?: (props: StatCardPartProps<'p'>) => ReactNode;
}

export interface StatCardPeriodProps extends ComponentPropsWithRef<'span'> {
  render?: (props: StatCardPartProps<'span'>) => ReactNode;
}

export interface StatCardTrendProps extends ComponentPropsWithRef<'div'> {
  render?: (props: StatCardPartProps<'div'>) => ReactNode;
}

export interface StatCardMessageProps extends ComponentPropsWithRef<'p'> {
  render?: (props: StatCardPartProps<'p'>) => ReactNode;
}

export interface StatCardContextValue {
  delta: number | undefined;
  formatOptions: Intl.NumberFormatOptions | undefined;
  goodWhen: StatCardGoodWhen;
  labelId: string;
  loading: boolean;
  locale: string;
  /** The family's words in the language in force, with this card's `messages` laid over them. */
  t: FamilyTranslator<StatCardMessages>;
  size: StatCardSize;
  status: StatCardValueStatus;
  tone: StatCardTone | undefined;
}
