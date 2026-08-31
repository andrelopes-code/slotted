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

export const REACT_VIRTUAL_LIST_TOKENS = virtualListTokens.map((name) => ({
  name,
  purpose: 'Theme-owned VirtualList decision',
}));

export const REACT_VIRTUAL_LIST_DOCS = {
  virtualList: {
    api: apiRows([
      [
        'itemCount',
        'number',
        '—',
        'VirtualList',
        'How many rows the list has, rendered or not. Required',
      ],
      [
        'itemSize',
        'number',
        '—',
        'VirtualList',
        'The block size of one row in pixels. Every row is this tall. Required',
      ],
      ['overscan', 'number', '4', 'VirtualList', 'Rows rendered either side of the viewport'],
      [
        'children',
        '(index: number) => ReactNode',
        '—',
        'VirtualList',
        'Called once per index in the window. Return a VirtualListItem',
      ],
      ['className', 'string', '—', 'VirtualList', 'Additional class names'],
      [
        'index',
        'number',
        '—',
        'VirtualListItem',
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
        id: 'virtual-list-react-basic',
        language: 'tsx',
        label: 'Ten thousand rows, a few dozen elements',
        source:
          '<VirtualList aria-label="Results" itemCount={10000} itemSize={40} style={{ blockSize: \'20rem\' }}>\n  {(index) => <VirtualListItem index={index}>Row {index}</VirtualListItem>}\n</VirtualList>;',
      }),
    ],
  },
  virtualListItem: { api: [], accessibility: [], snippets: [] },
} as const;
