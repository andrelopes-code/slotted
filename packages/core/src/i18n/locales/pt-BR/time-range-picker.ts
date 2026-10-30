import type { TimeRangePickerMessages } from '../../messages/time-range-picker';

export const ptBR: TimeRangePickerMessages = {
  bounds: 'Fora do intervalo permitido',
  change: 'Alterar período, {start} – {end}, {length}',
  changeReversed: 'Alterar período, {start} – {end}',
  choose: 'Escolher período',
  chooseTime: '{end}: escolha um horário',
  clear: 'Limpar período',
  done: 'Concluído',
  empty: 'Nenhum horário disponível',
  end: 'Fim',
  length: 'Fora da duração permitida',
  limit: {
    between: 'de {min} a {max}',
    atLeast: 'pelo menos {min}',
    atMost: 'no máximo {max}',
  },
  now: 'Agora',
  order: 'O fim deve vir depois do início',
  start: 'Início',
  truncated: 'Só os primeiros horários são listados; digite os demais no campo',
  unavailable: 'Passa por um horário indisponível',
};
