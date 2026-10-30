import type { DateRangePickerMessages } from '../../messages/date-range-picker';

export const ptBR: DateRangePickerMessages = {
  change: 'Alterar período, {start} – {end}, {length}',
  choose: 'Escolher período',
  clear: 'Limpar período',
  end: 'Fim',
  start: 'Início',
  days: {
    length: '{count, plural, one {# dia} other {# dias}}',
    between: 'de {min} a {max, plural, one {# dia} other {# dias}}',
    atLeast: 'pelo menos {min, plural, one {# dia} other {# dias}}',
    atMost: 'no máximo {max, plural, one {# dia} other {# dias}}',
  },
  nights: {
    length: '{count, plural, one {# noite} other {# noites}}',
    between: 'de {min} a {max, plural, one {# noite} other {# noites}}',
    atLeast: 'pelo menos {min, plural, one {# noite} other {# noites}}',
    atMost: 'no máximo {max, plural, one {# noite} other {# noites}}',
  },
};
