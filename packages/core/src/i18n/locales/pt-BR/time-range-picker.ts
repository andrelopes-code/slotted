import type { TimeRangePickerMessages } from '../../messages/time-range-picker';

export const ptBR: TimeRangePickerMessages = {
  bounds: 'Fora do intervalo permitido',
  change: 'Alterar período, {start} – {end}, {length}',
  changeReversed: 'Alterar período, {start} – {end}',
  choose: 'Escolher período',
  clear: 'Limpar período',
  end: 'Fim',
  limit: {
    between: 'de {min} a {max}',
    atLeast: 'pelo menos {min}',
    atMost: 'no máximo {max}',
  },
  order: 'O fim deve vir depois do início',
  start: 'Início',
  unavailable: 'Passa por um horário indisponível',
};
