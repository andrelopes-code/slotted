import type { MarkdownMessages } from '../../messages/markdown';

export const ptBR: MarkdownMessages = {
  alerts: {
    caution: 'Cuidado',
    important: 'Importante',
    note: 'Nota',
    tip: 'Dica',
    warning: 'Aviso',
  },
  anchor: 'Link para a seção: {heading}',
  backReference:
    '{occurrence, plural, =1 {Voltar à referência {number}} other {Voltar à referência {number}-{occurrence}}}',
  empty: 'Este documento ainda não tem conteúdo.',
  error: 'Não foi possível carregar o documento.',
  footnotes: 'Notas de rodapé',
  loading: 'Carregando documento',
  retry: 'Tentar de novo',
};
