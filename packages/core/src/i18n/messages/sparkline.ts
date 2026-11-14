import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `sparkline` writes on its own. */
export interface SparklineMessages {
  readonly down: Message<{ last: string; change: string; first: string }>;
  readonly flat: Message<{ last: string; first: string }>;
  readonly noData: Message;
  /** A position strip: the value and the span of the periods it is read against. */
  readonly strip: Message<{ value: string; low: string; high: string }>;
  /** A position strip whose value is not known yet. */
  readonly stripPending: Message<{ low: string; high: string }>;
  readonly stripReference: Message<{ reference: string }>;
  readonly up: Message<{ last: string; change: string; first: string }>;
}

export const en: SparklineMessages = {
  down: '{last}, down {change} since {first}',
  flat: '{last}, unchanged since {first}',
  noData: 'no data',
  strip: '{value}, against a range of {low} to {high}',
  stripPending: 'value pending, against a range of {low} to {high}',
  stripReference: 'reference {reference}',
  up: '{last}, up {change} since {first}',
};

export const sparklineMessages: MessageFamily<'sparkline', SparklineMessages> = {
  name: 'sparkline',
  base: en,
};
