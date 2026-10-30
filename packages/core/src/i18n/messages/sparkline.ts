import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `sparkline` writes on its own. */
export interface SparklineMessages {
  readonly down: Message<{ last: string; change: string; first: string }>;
  readonly flat: Message<{ last: string; first: string }>;
  readonly noData: Message;
  readonly up: Message<{ last: string; change: string; first: string }>;
}

export const en: SparklineMessages = {
  down: '{last}, down {change} since {first}',
  flat: '{last}, unchanged since {first}',
  noData: 'no data',
  up: '{last}, up {change} since {first}',
};

export const sparklineMessages: MessageFamily<'sparkline', SparklineMessages> = {
  name: 'sparkline',
  base: en,
};
