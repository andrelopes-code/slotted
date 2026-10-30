import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/**
 * What a screen reader hears while an item is dragged from the keyboard. Each
 * sentence comes in two forms: alone, and with `{where}`, the place written
 * by one of the `place` messages. `{item}` is the item's own label, or
 * `items` when several are carried.
 */
export interface DragMessages {
  readonly instructions: Message;
  readonly items: Message<{ count: number }>;
  readonly pickedUp: Message<{ item: string }>;
  readonly pickedUpAt: Message<{ item: string; where: string }>;
  readonly moved: Message<{ item: string }>;
  readonly movedAt: Message<{ item: string; where: string }>;
  /** `{operation}` is `copy` or `move`. */
  readonly dropped: Message<{ item: string; operation: string }>;
  readonly droppedAt: Message<{ item: string; operation: string; where: string }>;
  readonly cancelled: Message<{ item: string }>;
  readonly nowhere: Message;
  readonly place: {
    readonly on: Message<{ target: string }>;
    readonly in: Message<{ target: string }>;
    readonly position: Message<{ position: number; total: number }>;
    readonly positionIn: Message<{ position: number; total: number; target: string }>;
  };
}

export const en: DragMessages = {
  instructions:
    'Press Space or Enter to pick up. Use the arrow keys to move, Space or Enter to drop, and Escape to cancel.',
  items: '{count, plural, one {# item} other {# items}}',
  pickedUp: '{item} picked up.',
  pickedUpAt: '{item} picked up, {where}.',
  moved: '{item} moved.',
  movedAt: '{item}, {where}.',
  dropped: '{item} {operation, select, copy {copied} other {dropped}}.',
  droppedAt: '{item} {operation, select, copy {copied} other {dropped}}, {where}.',
  cancelled: 'Drag canceled. {item} returned.',
  nowhere: 'No place to drop.',
  place: {
    on: 'on {target}',
    in: 'in {target}',
    position: 'position {position} of {total}',
    positionIn: 'position {position} of {total} in {target}',
  },
};

export const dragMessages: MessageFamily<'drag', DragMessages> = { name: 'drag', base: en };
