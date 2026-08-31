import virtualListTokens from '@slotted/styles/virtual-list/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type { ApiRow } from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_VIRTUAL_LIST_TOKENS = virtualListTokens.map((name) => ({
  name,
  purpose: 'Theme-owned VirtualList decision',
}));

export const ANGULAR_VIRTUAL_LIST_DOCS = {
  virtualList: {
    api: apiRows([
      [
        'itemCount',
        'number',
        '—',
        'slVirtualList',
        'How many rows the list has, rendered or not. Required',
      ],
      [
        'itemSize',
        'number',
        '—',
        'slVirtualList',
        'The block size of one row in pixels. Every row is this tall. Required',
      ],
      ['overscan', 'number', '4', 'slVirtualList', 'Rows rendered either side of the viewport'],
      [
        'indices',
        'Signal<number[]>',
        '—',
        'slVirtualList',
        'The rows to render, by their position in the whole list. Read it through exportAs',
      ],
      [
        'index',
        'number',
        '—',
        'slVirtualListItem',
        'The row’s position in the whole list, not in the window',
      ],
    ]),
    accessibility: [
      'The root is role="list" and each rendered row is role="listitem" carrying aria-setsize and aria-posinset. Without them a screen reader counts the rows it can see and announces a list of fourteen items where there are ten thousand, which is a false report rather than a degraded one.',
      'The canvas between the root and the rows is role="none", so the rows are owned by the list directly. role="list" requires listitem children, and an intervening generic element would break that ownership.',
      'The root carries tabindex="0". A scrollable region holding no focusable element cannot be scrolled by a keyboard-only reader, and making the scroll container itself focusable is the remedy.',
      'No keys are bound. A focused scroll container already answers the arrows, Page Up, Page Down, Home and End, with the platform’s own acceleration. Listbox is the component that adds selection and roving focus.',
      'Give the root an aria-label. A list a reader can focus should say what it holds before they scroll it.',
      'The row derives its offset, its size and both set attributes from the one index it is given, so no arrangement of the API places a row at the wrong offset or has it claim the wrong position.',
    ],
    snippets: [
      defineSnippet({
        id: 'virtual-list-angular-basic',
        language: 'angular',
        label: 'Ten thousand rows, a few dozen elements',
        source:
          '<div slVirtualList #list="slVirtualList" [itemCount]="10000" [itemSize]="40">\n  @for (index of list.indices(); track index) {\n    <div slVirtualListItem [index]="index">Row {{ index }}</div>\n  }\n</div>',
      }),
    ],
  },
  virtualListItem: { api: [], accessibility: [], snippets: [] },
} as const;
