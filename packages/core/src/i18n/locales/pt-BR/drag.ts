import type { DragMessages } from '../../messages/drag';

export const ptBR: DragMessages = {
  instructions:
    'Pressione Espaço ou Enter para pegar. Use as setas para mover, Espaço ou Enter para soltar e Esc para cancelar.',
  items: '{count, plural, one {# item} other {# itens}}',
  pickedUp: 'Você pegou {item}.',
  pickedUpAt: 'Você pegou {item}, {where}.',
  moved: 'Movendo {item}.',
  movedAt: '{item}, {where}.',
  dropped: '{operation, select, copy {Você copiou} other {Você soltou}} {item}.',
  droppedAt: '{operation, select, copy {Você copiou} other {Você soltou}} {item}, {where}.',
  cancelled: 'Arraste de {item} cancelado; tudo ficou onde estava.',
  nowhere: 'Não há onde soltar.',
  place: {
    on: 'sobre {target}',
    in: 'em {target}',
    position: 'posição {position} de {total}',
    positionIn: 'posição {position} de {total} em {target}',
  },
};
