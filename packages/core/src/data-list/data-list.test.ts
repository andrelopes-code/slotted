import { describe, expect, it } from 'vitest';

import { applyQuery, emptyQuery, type GridColumn } from '../grid';
import { createTranslator, dataListMessages } from '../i18n';
import { PT_BR } from '../i18n/locales/pt-BR';
import {
  dataListFieldText,
  dataListKeys,
  dataListNodes,
  describeDataListSort,
  resolveDataListLayout,
  withDataListSortColumn,
  withDataListSortDirection,
} from './data-list';

/** What a boolean field says; the bindings take it from their catalog. */
const booleans = { true: 'Yes', false: 'No' };

interface Account {
  id: string;
  name: string;
  email: string;
  balance: number;
  status: string;
  owner: string | null;
  region: string;
  plan: string;
}

const columns: GridColumn<Account>[] = [
  { id: 'name', label: 'Account', rowHeader: true },
  { id: 'email', label: 'Email' },
  { id: 'balance', label: 'Balance', kind: 'number' },
  { id: 'plan', label: 'Plan' },
  { id: 'status', label: 'Status', priority: 1 },
  { id: 'region', label: 'Region', priority: 3 },
  { id: 'owner', label: 'Owner', priority: 2 },
  { id: 'internal', label: 'Internal', popin: false },
  { id: 'menu', label: '', kind: 'actions' },
];

const ids = (list: readonly { id: string }[]) => list.map((column) => column.id);

describe('resolveDataListLayout', () => {
  it('takes the rowHeader as the title and orders the fields by priority, then declared order', () => {
    const layout = resolveDataListLayout(columns, { subtitle: 'email', trailing: 'balance' });
    expect(layout.title?.id).toBe('name');
    expect(layout.subtitle?.id).toBe('email');
    expect(layout.trailing?.id).toBe('balance');
    expect(ids(layout.fields)).toEqual(['status', 'owner', 'region', 'plan']);
    expect(ids(layout.actions)).toEqual(['menu']);
    expect(layout.shown).toBe(4);
  });

  it('leaves out a column that declined the pop-in and a hidden one', () => {
    const layout = resolveDataListLayout(columns, { columnState: { hidden: ['owner'] } });
    expect(ids(layout.fields)).not.toContain('internal');
    expect(ids(layout.fields)).not.toContain('owner');
  });

  it('follows the reader’s order among fields of equal priority', () => {
    const layout = resolveDataListLayout(columns, {
      columnState: { order: ['plan', 'email', 'name', 'balance'] },
    });
    expect(ids(layout.fields)).toEqual(['status', 'owner', 'region', 'plan', 'email', 'balance']);
  });

  it('falls back to the first data column without a rowHeader', () => {
    const layout = resolveDataListLayout([
      { id: 'menu', label: '', kind: 'actions' },
      ...columns.slice(1),
    ]);
    expect(layout.title?.id).toBe('email');
  });

  it('caps the fields shown and offers only sortable data columns', () => {
    const layout = resolveDataListLayout(
      [...columns, { id: 'notes', label: 'Notes', sortable: false }],
      { fields: 2 },
    );
    expect(layout.shown).toBe(2);
    expect(ids(layout.sortable)).not.toContain('menu');
    expect(ids(layout.sortable)).not.toContain('notes');
    expect(ids(layout.sortable)).toContain('name');
  });
});

describe('fields', () => {
  it('returns null for an absent value and the formatted text otherwise', () => {
    const row: Account = {
      id: 'a',
      name: 'Acme',
      email: 'a@x',
      balance: 12480,
      status: 'Active',
      owner: null,
      region: 'Lisbon',
      plan: '',
    };
    expect(dataListFieldText(columns[6]!, row, { booleans })).toBeNull();
    expect(dataListFieldText(columns[3]!, row, { booleans })).toBeNull();
    expect(dataListFieldText(columns[2]!, row, { locale: 'en-US', booleans })).toBe('12,480');
  });
});

describe('sorting', () => {
  it('replaces the sort with one key on the chosen column and keeps the direction', () => {
    const query = { ...emptyQuery(), sort: [{ column: 'name', direction: 'descending' as const }] };
    expect(withDataListSortColumn(query, 'balance').sort).toEqual([
      { column: 'balance', direction: 'descending' },
    ]);
    expect(withDataListSortColumn(emptyQuery(), 'balance').sort).toEqual([
      { column: 'balance', direction: 'ascending' },
    ]);
    expect(withDataListSortColumn(query, null).sort).toEqual([]);
  });

  it('turns the first key and keeps the others', () => {
    const query = {
      ...emptyQuery(),
      sort: [
        { column: 'name', direction: 'ascending' as const },
        { column: 'balance', direction: 'descending' as const },
      ],
    };
    expect(withDataListSortDirection(query, 'descending').sort).toEqual([
      { column: 'name', direction: 'descending' },
      { column: 'balance', direction: 'descending' },
    ]);
    expect(withDataListSortDirection(emptyQuery(), 'descending').sort).toEqual([]);
  });

  it('says the whole order', () => {
    expect(
      describeDataListSort(
        [
          { column: 'name', direction: 'ascending' },
          { column: 'balance', direction: 'descending' },
        ],
        columns,
        createTranslator({ locale: 'en-US' }).family(dataListMessages),
      ),
    ).toBe('Account ascending, Balance descending');
  });

  it('says the order in the language of the translator it is given', () => {
    const pt = createTranslator({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }).family(
      dataListMessages,
    );
    expect(describeDataListSort([{ column: 'name', direction: 'descending' }], columns, pt)).toBe(
      'Account em ordem decrescente',
    );
  });
});

describe('dataListNodes', () => {
  const rows: Account[] = [
    {
      id: 'a',
      name: 'Acme',
      email: '',
      balance: 1,
      status: 'Active',
      owner: 'M',
      region: 'Lisbon',
      plan: 'Pro',
    },
    {
      id: 'b',
      name: 'Borealis',
      email: '',
      balance: 2,
      status: 'On hold',
      owner: 'A',
      region: 'Porto',
      plan: 'Pro',
    },
    {
      id: 'c',
      name: 'Cobalt',
      email: '',
      balance: 3,
      status: 'Active',
      owner: 'J',
      region: 'Madrid',
      plan: 'Free',
    },
  ];

  it('keeps a flat list flat', () => {
    const result = applyQuery(rows, columns, emptyQuery(), { rowKey: (row) => row.id, booleans });
    const nodes = dataListNodes(result.nodes);
    expect(nodes.every((node) => node.kind === 'row')).toBe(true);
    expect(dataListKeys(nodes)).toEqual(['a', 'b', 'c']);
  });

  it('folds two levels of groups into nested sections, in the order the groups first appear', () => {
    const result = applyQuery(
      rows,
      columns,
      { ...emptyQuery(), group: ['plan', 'status'] },
      {
        rowKey: (row) => row.id,
        booleans,
      },
    );
    const nodes = dataListNodes(result.nodes);
    expect(nodes.map((node) => (node.kind === 'section' ? node.text : node.key))).toEqual([
      'Pro',
      'Free',
    ]);
    const pro = nodes[0]!;
    expect(pro.kind).toBe('section');
    if (pro.kind !== 'section') return;
    expect(pro.count).toBe(2);
    expect(pro.children.map((node) => (node.kind === 'section' ? node.text : node.key))).toEqual([
      'Active',
      'On hold',
    ]);
    expect(dataListKeys(nodes)).toEqual(['a', 'b', 'c']);
  });
});
