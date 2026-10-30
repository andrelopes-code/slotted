import type { MediaViewerMessages } from '../../messages/media-viewer';

export const ptBR: MediaViewerMessages = {
  label: '{name}',
  close: 'Fechar',
  previous: 'Arquivo anterior',
  next: 'Próximo arquivo',
  zoomIn: 'Ampliar',
  zoomOut: 'Reduzir',
  fit: 'Ajustar à tela',
  rotate: 'Girar',
  download: 'Baixar',
  position: '{index} de {count}',
  zoomLevel: '{percent}%',
  unsupportedTitle: 'Sem pré-visualização para este arquivo',
  unsupported:
    '{extension, select, other {Arquivos {extension} abrem no aplicativo que os criou.} __none {Este tipo de arquivo abre no aplicativo que o criou.}} Baixe para vê-lo.',
  errorTitle: 'Este arquivo não carregou',
  error: 'Verifique a conexão e tente de novo, ou baixe o arquivo.',
  retry: 'Tentar de novo',
  truncated: 'Só o começo deste arquivo é exibido. Baixe para ler o resto.',
  loading: 'Carregando {name}',
  announce: '{name}, {index} de {count}',
};
