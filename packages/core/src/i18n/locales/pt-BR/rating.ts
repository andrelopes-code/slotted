import type { RatingMessages } from '../../messages/rating';

export const ptBR: RatingMessages = {
  consensus: 'Consenso forte',
  displayLabel: 'Avaliação {value} de {max}',
  displayLabelWithCount:
    'Avaliação {value} de {max}, {count, plural, =0 {# avaliações} one {# avaliação} other {# avaliações}}',
  distributionLabel: 'Distribuição por estrelas',
  divided: 'Opiniões divididas',
  few: 'Poucas avaliações',
  itemLabel: '{value} de {max}',
  levelLabel:
    '{level, plural, one {# estrela} other {# estrelas}}: {count, plural, =0 {# avaliações} one {# avaliação} other {# avaliações}}, {share}',
  mixed: 'Opiniões variadas',
  negative: '{share} negativas',
  neutral: '{share} neutras',
  positive: '{share} positivas',
  scale: 'de {max}',
  spectrumCount:
    '{count, plural, =0 {# avaliações} one {# avaliação} other {# avaliações}} · margem de ± {margin}',
  spectrumUncertain:
    '{count, plural, =0 {# avaliações} one {# avaliação} other {# avaliações}} · média incerta, entre {low} e {high}',
  summaryCount:
    'Com base em {count, plural, =0 {# avaliações} one {# avaliação} other {# avaliações}}',
  summaryEmpty: 'Ainda sem avaliações',
};
