import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `dashboard-grid` writes on its own. */
export interface DashboardGridMessages {
  readonly add: Message;
  readonly cancel: Message;
  readonly cancelled: Message;
  readonly detail: Message<{ title: string }>;
  readonly done: Message;
  readonly editBar: Message;
  readonly editStatus: Message;
  readonly empty: Message;
  readonly emptyEditing: Message;
  readonly emptyTitle: Message;
  readonly errorTitle: Message;
  readonly handle: Message<{ title: string }>;
  readonly hidden: Message<{ title: string }>;
  readonly hide: Message;
  readonly moved: Message<{ title: string; row: number; column: number }>;
  readonly movedInOrder: Message<{ title: string; position: number; total: number }>;
  readonly moveDown: Message;
  readonly moveEnd: Message;
  readonly moveStart: Message;
  readonly moveUp: Message;
  readonly narrower: Message;
  readonly reset: Message;
  readonly resetDone: Message;
  readonly resized: Message<{ title: string; columns: number; rows: number }>;
  readonly retry: Message;
  readonly shorter: Message;
  readonly shown: Message<{ title: string }>;
  readonly size: Message<{ columns: number; rows: number }>;
  readonly taller: Message;
  readonly wider: Message;
}

export const en: DashboardGridMessages = {
  add: 'Add widget',
  cancel: 'Cancel',
  cancelled: 'Layout changes discarded',
  detail: 'Open {title}',
  done: 'Done',
  editBar: 'Layout',
  editStatus:
    'Drag a widget to move it and pull its edges to resize it. From the keyboard, focus its handle: Alt with an arrow moves it, Shift with an arrow resizes it.',
  empty: 'No widgets',
  emptyEditing: 'Every widget is hidden. Add one back to start.',
  emptyTitle: 'No data',
  errorTitle: 'This widget could not load',
  handle: 'Rearrange {title}',
  hidden: '{title} hidden',
  hide: 'Hide',
  moved: '{title} moved to row {row}, column {column}',
  movedInOrder: '{title} moved to position {position} of {total}',
  moveDown: 'Move down',
  moveEnd: 'Move right',
  moveStart: 'Move left',
  moveUp: 'Move up',
  narrower: 'Narrower',
  reset: 'Reset layout',
  resetDone: 'Layout reset',
  resized:
    '{title} is {columns, plural, one {# column} other {# columns}} by {rows, plural, one {# row} other {# rows}}',
  retry: 'Try again',
  shorter: 'Shorter',
  shown: '{title} added',
  size: '{columns} × {rows}',
  taller: 'Taller',
  wider: 'Wider',
};

export const dashboardGridMessages: MessageFamily<'dashboardGrid', DashboardGridMessages> = {
  name: 'dashboardGrid',
  base: en,
};
