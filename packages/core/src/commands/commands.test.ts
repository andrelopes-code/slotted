import { describe, expect, it } from 'vitest';

import { findPage, pushRecent, resolveCommands } from './index';

const ITEMS = [
  { id: 'inbox', label: 'Inbox', group: 'nav', keywords: ['mail'] },
  { id: 'projects', label: 'Projects', group: 'nav' },
  { id: 'deploy', label: 'Deploy to production', group: 'actions', keywords: ['ship'] },
  { id: 'rollback', label: 'Roll back deployment', group: 'actions' },
  { id: 'theme', label: 'Toggle dark mode' },
  {
    id: 'team',
    label: 'Switch team…',
    group: 'nav',
    children: [
      { id: 'acme', label: 'Acme Robotics' },
      { id: 'globex', label: 'Globex Freight' },
    ],
  },
];
const GROUPS = [
  { id: 'actions', label: 'Actions' },
  { id: 'nav', label: 'Go to' },
];

describe('resolveCommands', () => {
  it('keeps the consumer’s order and the declared group order with nothing typed', () => {
    const { sections, count } = resolveCommands({ items: ITEMS, query: '', groups: GROUPS });
    expect(sections.map((section) => section.label)).toEqual(['Actions', 'Go to', undefined]);
    expect(sections[1]?.items.map((item) => item.id)).toEqual(['inbox', 'projects', 'team']);
    expect(count).toBe(6);
  });

  it('ranks within a group and lifts the group with the best item', () => {
    const { sections, rows } = resolveCommands({ items: ITEMS, query: 'dep', groups: GROUPS });
    expect(sections.map((section) => section.label)).toEqual(['Actions']);
    expect(rows.map((item) => item.id)).toEqual(['deploy', 'rollback']);
  });

  it('answers a keyword below a label, and an accent as its base letter', () => {
    expect(resolveCommands({ items: ITEMS, query: 'ship' }).rows.map((r) => r.id)).toEqual([
      'deploy',
    ]);
    // language: pt-BR
    expect(resolveCommands({ items: ITEMS, query: 'ínbox' }).rows.map((r) => r.id)).toEqual([
      'inbox',
    ]);
    // language: en-US
  });

  it('shows the items as they came when the ranker is null', () => {
    const { rows } = resolveCommands({ items: ITEMS, query: 'zzz', rank: null });
    expect(rows.length).toBe(6);
  });

  it('opens on the recents, in their order, and never twice', () => {
    const { sections } = resolveCommands({
      items: ITEMS,
      query: '',
      groups: GROUPS,
      recent: ['theme', 'missing', 'inbox'],
    });
    expect(sections[0]?.recent).toBe(true);
    expect(sections[0]?.items.map((item) => item.id)).toEqual(['theme', 'inbox']);
    expect(sections.flatMap((s) => s.items).filter((i) => i.id === 'inbox').length).toBe(1);
  });

  it('hides the recents once something is typed or a page is open', () => {
    expect(
      resolveCommands({ items: ITEMS, query: 'in', recent: ['inbox'] }).sections[0]?.recent,
    ).toBe(false);
    expect(
      resolveCommands({ items: ITEMS, query: '', pages: ['team'], recent: ['inbox'] }).sections[0]
        ?.recent,
    ).toBe(false);
  });

  it('walks into a page and names the trail', () => {
    const { rows, trail } = resolveCommands({ items: ITEMS, query: '', pages: ['team'] });
    expect(trail).toEqual([{ id: 'team', label: 'Switch team…' }]);
    expect(rows.map((item) => item.id)).toEqual(['acme', 'globex']);
  });

  it('stops the walk at a page it cannot find', () => {
    const { rows, trail } = resolveCommands({ items: ITEMS, query: '', pages: ['nowhere'] });
    expect(trail).toEqual([]);
    expect(rows.length).toBe(6);
  });

  it('caps the rows across sections', () => {
    const { rows, sections } = resolveCommands({
      items: ITEMS,
      query: '',
      groups: GROUPS,
      limit: 3,
    });
    expect(rows.length).toBe(3);
    expect(sections.length).toBe(2);
  });
});

describe('pushRecent', () => {
  it('moves the id to the front and cuts at the limit', () => {
    expect(pushRecent(['a', 'b', 'c'], 'b', 5)).toEqual(['b', 'a', 'c']);
    expect(pushRecent(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b']);
  });
});

describe('findPage', () => {
  it('returns the root when no page is open', () => {
    expect(findPage(ITEMS, []).items).toBe(ITEMS);
  });
});
