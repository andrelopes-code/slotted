import type { ComponentPropsWithRef, CSSProperties, ReactNode } from 'react';

export type MeterSize = 'sm' | 'md' | 'lg';
export type MeterTone =
  'accent' | 'secondary' | 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** What every meter in an application does before any of them states anything of its own. */
export interface MeterDefaults {
  /** How the share is read out as `aria-valuetext`. A percent with two fractional digits unless set. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  size?: MeterSize | undefined;
}

export interface MeterDefaultsProviderProps extends MeterDefaults {
  children?: ReactNode;
}

export interface MeterRootProps extends ComponentPropsWithRef<'div'> {
  'data-part': string;
  'data-size': MeterSize;
  'data-tone': MeterTone;
  'data-ui': string;
  style: CSSProperties;
}

export interface MeterProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The reading, between `min` and `max`. A value outside the range is drawn at its end. */
  value: number;
  min?: number | undefined;
  max?: number | undefined;
  /**
   * The marks that split the range into regions, as the HTML `meter` element
   * has them. With any of the three, the region the value falls in picks the
   * tone: the one holding `optimum` is success, the one beside it warning,
   * the far one danger. An explicit `tone` wins.
   */
  low?: number | undefined;
  high?: number | undefined;
  optimum?: number | undefined;
  tone?: MeterTone | undefined;
  size?: MeterSize | undefined;
  /**
   * No role and hidden from assistive technology, for a meter beside words
   * that already state its value: the exact figure in the cell before it.
   */
  decorative?: boolean | undefined;
  /** The whole `aria-valuetext`, replacing the share the family writes. */
  valueText?: string | undefined;
  /** How the share is written in `aria-valuetext`. `Intl.NumberFormat` options. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** The locale the share is written in; the language in force when absent. */
  locale?: string | undefined;
  render?: ((props: MeterRootProps) => ReactNode) | undefined;
}
