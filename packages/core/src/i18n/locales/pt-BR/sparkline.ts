import type { SparklineMessages } from '../../messages/sparkline';

export const ptBR: SparklineMessages = {
  down: '{last}, queda de {change} desde {first}',
  flat: '{last}, sem alteração desde {first}',
  noData: 'sem dados',
  strip: '{value}, entre {low} e {high}',
  stripPending: 'valor pendente, entre {low} e {high}',
  stripReference: 'referência {reference}',
  up: '{last}, alta de {change} desde {first}',
};
