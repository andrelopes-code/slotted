import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CREATE_OPTION,
  createEntityCache,
  createEntityResolver,
  createEntitySearch,
  entityInitials,
  entityName,
  entityOptions,
  entityPickerKey,
  entitySections,
  localEntitySource,
  offersCreation,
  rememberRecent,
  RETRY_OPTION,
} from './index';
import type { Entity, EntitySearchResult, EntitySearchState, EntitySource } from './index';

const ana: Entity = { id: 'ana', label: 'Ana Smith', description: 'ana@acme.com', scope: 'people' };
const bruno: Entity = { id: 'bruno', label: 'Bruno Carter', scope: 'people' };
// language: pt-BR
const ines: Entity = { id: 'ines', label: 'Inês Ávila', description: 'ines@acme.com' };
// language: en-US
const design: Entity = { id: 'design', label: 'Design', group: 'Teams', scope: 'teams' };

const labels = { chosen: 'Chosen', favorites: 'Favorites', recent: 'Recent', results: 'Results' };

describe('createEntityCache', () => {
  it('keeps every record by id and picks them in the order asked', () => {
    const cache = createEntityCache([ana]);
    cache.remember([bruno, { ...ana, label: 'Ana S.' }]);
    expect(cache.get('ana')?.label).toBe('Ana S.');
    expect(cache.pick(['bruno', 'nobody', 'ana']).map((entity) => entity.id)).toEqual([
      'bruno',
      'ana',
    ]);
  });
});

describe('localEntitySource', () => {
  const source = localEntitySource([ana, bruno, ines, design]);

  it('compares the way the locale does, against the name and the identifier', async () => {
    const byName = await source.search(
      { query: 'avila', scope: null, page: 0, cursor: null, selected: [] },
      { signal: new AbortController().signal },
    );
    expect(byName.items.map((entity) => entity.id)).toEqual(['ines']);

    const byAddress = await source.search(
      { query: 'ana@', scope: null, page: 0, cursor: null, selected: [] },
      { signal: new AbortController().signal },
    );
    expect(byAddress.items.map((entity) => entity.id)).toEqual(['ana']);
  });

  it('keeps a record of the scope or of none', async () => {
    const result = await source.search(
      { query: '', scope: 'teams', page: 0, cursor: null, selected: [] },
      { signal: new AbortController().signal },
    );
    expect(result.items.map((entity) => entity.id)).toEqual(['ines', 'design']);
    expect(result.hasMore).toBe(false);
  });

  it('resolves the ids it holds and leaves out the rest', async () => {
    const found = await source.resolve!(['bruno', 'gone'], {
      signal: new AbortController().signal,
    });
    expect(found.map((entity) => entity.id)).toEqual(['bruno']);
  });
});

describe('entitySections', () => {
  it('puts the chosen first on an empty query and never repeats an id', () => {
    const { sections, headings } = entitySections({
      query: '',
      scope: null,
      chosen: [ana],
      favorites: [ana, bruno],
      recent: [bruno, ines],
      results: [ana, bruno, ines, design],
      labels,
    });
    expect(sections.map((section) => [section.key, section.entities.map((e) => e.id)])).toEqual([
      ['chosen', ['ana']],
      ['favorites', ['bruno']],
      ['recent', ['ines']],
      ['group:Teams', ['design']],
    ]);
    expect(headings).toBe(true);
  });

  it('shows only the results, grouped in order of appearance, on a typed query', () => {
    const { sections, headings } = entitySections({
      query: 'a',
      scope: null,
      favorites: [ana],
      results: [design, ana, bruno],
      labels,
    });
    expect(sections.map((section) => section.key)).toEqual(['group:Teams', 'results']);
    expect(headings).toBe(true);
  });

  it('draws no heading over a single section', () => {
    const { headings } = entitySections({ query: 'a', scope: null, results: [ana], labels });
    expect(headings).toBe(false);
  });

  it('keeps favorites and recent of the scope or of none', () => {
    const { sections } = entitySections({
      query: '',
      scope: 'teams',
      favorites: [ana, ines],
      results: [],
      labels,
    });
    expect(sections[0]?.entities.map((entity) => entity.id)).toEqual(['ines']);
  });

  it('leaves the results out while the empty query was not searched', () => {
    const { sections } = entitySections({
      query: '',
      scope: null,
      recent: [ana],
      results: [bruno],
      searchedEmpty: false,
      labels,
    });
    expect(sections.map((section) => section.key)).toEqual(['recent']);
  });
});

describe('entityOptions', () => {
  const sections = entitySections({
    query: 'a',
    scope: null,
    results: [ana, bruno],
    labels,
  }).sections;

  it('lists the records and the offer to create, in document order', () => {
    expect(entityOptions({ sections, create: true }).map((option) => option.key)).toEqual([
      'ana',
      'bruno',
      CREATE_OPTION,
    ]);
  });

  it('lists only the offer to search again after a failure', () => {
    expect(entityOptions({ sections, retry: true })).toEqual([
      { key: RETRY_OPTION, disabled: false },
    ]);
  });

  it('marks a disabled record and a blocked one as unreachable', () => {
    const options = entityOptions({
      sections: [{ ...sections[0]!, entities: [{ ...ana, disabled: true }, bruno] }],
      blocked: new Set(['bruno']),
    });
    expect(options.map((option) => option.disabled)).toEqual([true, true]);
  });
});

describe('offersCreation', () => {
  const base = { enabled: true, answered: true, results: [ana] };

  it('offers what nothing is already called, under the collator', () => {
    expect(offersCreation({ ...base, query: 'Ana Lima' })).toBe(true);
    expect(offersCreation({ ...base, query: 'ana smith' })).toBe(false);
  });

  it('offers nothing before the answer, for an empty query, or without onCreate', () => {
    expect(offersCreation({ ...base, query: 'x', answered: false })).toBe(false);
    expect(offersCreation({ ...base, query: '  ' })).toBe(false);
    expect(offersCreation({ ...base, query: 'x', enabled: false })).toBe(false);
  });
});

describe('names', () => {
  it('announces the identifier with the name', () => {
    expect(entityName(ana)).toBe('Ana Smith, ana@acme.com');
    expect(entityName(bruno)).toBe('Bruno Carter');
  });

  it('takes the initials of the first and last word, or of the avatar name', () => {
    expect(entityInitials({ label: 'maria eduarda de souza' })).toBe('MS');
    expect(entityInitials({ label: 'Platform' })).toBe('P');
    expect(entityInitials({ label: 'x', avatar: { name: 'Ada Lovelace' } })).toBe('AL');
    expect(entityInitials({ label: '  ' })).toBe('');
  });
});

describe('rememberRecent', () => {
  it('moves the record to the front, once, and keeps the limit', () => {
    expect(rememberRecent([bruno, ana, ines], ana, 2).map((entity) => entity.id)).toEqual([
      'ana',
      'bruno',
    ]);
  });
});

describe('entityPickerKey', () => {
  const base = {
    open: false,
    selectionMode: 'single' as const,
    readOnly: false,
    highlighted: false,
    empty: true,
    caretAtStart: true,
    chips: 0,
  };

  it('opens on the arrows and moves while open', () => {
    expect(entityPickerKey({ ...base, key: 'ArrowDown' })).toEqual({
      type: 'open',
      highlight: 'first',
    });
    expect(entityPickerKey({ ...base, key: 'ArrowUp' })).toEqual({
      type: 'open',
      highlight: 'last',
    });
    expect(entityPickerKey({ ...base, key: 'ArrowDown', altKey: true })).toEqual({
      type: 'open',
      highlight: 'keep',
    });
    expect(entityPickerKey({ ...base, open: true, key: 'ArrowDown' })).toEqual({
      type: 'move',
      intent: 'next',
    });
    expect(entityPickerKey({ ...base, open: true, key: 'PageUp' })).toEqual({
      type: 'move',
      intent: 'pageUp',
    });
    expect(entityPickerKey({ ...base, open: true, key: 'ArrowUp', altKey: true })).toEqual({
      type: 'close',
      reason: 'keyboard',
    });
  });

  it('does not open a read-only field', () => {
    expect(entityPickerKey({ ...base, readOnly: true, key: 'ArrowDown' })).toEqual({
      type: 'none',
    });
  });

  it('activates only a highlighted option', () => {
    expect(entityPickerKey({ ...base, open: true, key: 'Enter' })).toEqual({ type: 'none' });
    expect(entityPickerKey({ ...base, open: true, highlighted: true, key: 'Enter' })).toEqual({
      type: 'activate',
    });
  });

  it('answers Escape by closing, then by reverting or emptying', () => {
    expect(entityPickerKey({ ...base, open: true, key: 'Escape' })).toEqual({
      type: 'close',
      reason: 'escape',
    });
    expect(entityPickerKey({ ...base, key: 'Escape' })).toEqual({ type: 'revert' });
    expect(
      entityPickerKey({ ...base, selectionMode: 'multiple', empty: false, key: 'Escape' }),
    ).toEqual({ type: 'clearQuery' });
  });

  it('reaches the last chip from an empty field, mirrored under rtl', () => {
    const multiple = { ...base, selectionMode: 'multiple' as const, chips: 2 };
    expect(entityPickerKey({ ...multiple, key: 'Backspace' })).toEqual({ type: 'focusChip' });
    expect(entityPickerKey({ ...multiple, key: 'ArrowLeft' })).toEqual({ type: 'focusChip' });
    expect(entityPickerKey({ ...multiple, key: 'ArrowRight' })).toEqual({ type: 'none' });
    expect(entityPickerKey({ ...multiple, key: 'ArrowRight', dir: 'rtl' })).toEqual({
      type: 'focusChip',
    });
    expect(entityPickerKey({ ...multiple, empty: false, key: 'Backspace' })).toEqual({
      type: 'none',
    });
  });

  it('leaves every key to an IME composition and to a shortcut', () => {
    expect(entityPickerKey({ ...base, key: 'ArrowDown', composing: true })).toEqual({
      type: 'none',
    });
    expect(entityPickerKey({ ...base, key: 'ArrowDown', metaKey: true })).toEqual({
      type: 'none',
    });
  });
});

describe('createEntitySearch', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function deferredSource() {
    const calls: {
      query: string;
      page: number;
      signal: AbortSignal;
      resolve: (result: EntitySearchResult) => void;
      reject: (error: unknown) => void;
    }[] = [];
    const source: EntitySource = {
      search: ({ query, page }, { signal }) =>
        new Promise((resolve, reject) => {
          calls.push({ query, page, signal, resolve, reject });
        }),
    };
    return { calls, source };
  }

  function session(source: EntitySource, minQueryLength = 0) {
    const states: EntitySearchState[] = [];
    const search = createEntitySearch({
      source,
      delay: 250,
      minQueryLength,
      onChange: (state) => states.push(state),
      now: () => Date.now(),
    });
    return { search, states };
  }

  it('waits after the last keystroke, then asks once', async () => {
    const { calls, source } = deferredSource();
    const { search } = session(source);
    search.search({ query: 'a', scope: null, selected: [] });
    search.search({ query: 'an', scope: null, selected: [] });
    expect(search.state.status).toBe('waiting');
    await vi.advanceTimersByTimeAsync(249);
    expect(calls).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls.map((call) => call.query)).toEqual(['an']);
  });

  it('asks at once for the empty query and for a new scope', () => {
    const { calls, source } = deferredSource();
    const { search } = session(source);
    search.search({ query: '', scope: null, selected: [] });
    search.search({ query: '', scope: 'teams', selected: [] });
    expect(calls).toHaveLength(2);
  });

  it('aborts a request a newer one replaced and ignores its late answer', async () => {
    const { calls, source } = deferredSource();
    const { search } = session(source);
    search.search({ query: 'ana', scope: null, selected: [], immediate: true });
    search.search({ query: 'an', scope: null, selected: [], immediate: true });
    expect(calls[0]!.signal.aborted).toBe(true);
    calls[1]!.resolve({ items: [bruno] });
    calls[0]!.resolve({ items: [ana] });
    await vi.runAllTimersAsync();
    expect(search.state.items).toEqual([bruno]);
    expect(search.state.answered).toBe(true);
  });

  it('keeps the previous rows while a new query loads', async () => {
    const { calls, source } = deferredSource();
    const { search } = session(source);
    search.search({ query: 'a', scope: null, selected: [], immediate: true });
    calls[0]!.resolve({ items: [ana] });
    await vi.runAllTimersAsync();
    search.search({ query: 'ab', scope: null, selected: [], immediate: true });
    expect(search.state.status).toBe('loading');
    expect(search.state.items).toEqual([ana]);
    expect(search.state.answered).toBe(false);
  });

  it('asks nothing below the minimum length', () => {
    const { calls, source } = deferredSource();
    const { search } = session(source, 2);
    search.search({ query: 'a', scope: null, selected: [], immediate: true });
    expect(search.state.status).toBe('short');
    expect(calls).toHaveLength(0);
  });

  it('empties the list on a failure and asks again on retry', async () => {
    const { calls, source } = deferredSource();
    const { search } = session(source);
    search.search({ query: 'a', scope: null, selected: [], immediate: true });
    calls[0]!.resolve({ items: [ana] });
    await vi.runAllTimersAsync();
    search.search({ query: 'ab', scope: null, selected: [], immediate: true });
    calls[1]!.reject(new Error('offline'));
    await vi.runAllTimersAsync();
    expect(search.state.status).toBe('error');
    expect(search.state.items).toEqual([]);
    search.retry();
    expect(calls[2]!.query).toBe('ab');
  });

  it('appends the next page and keeps the pages before a failed one', async () => {
    const { calls, source } = deferredSource();
    const { search } = session(source);
    search.search({ query: '', scope: null, selected: [] });
    calls[0]!.resolve({ items: [ana], hasMore: true, cursor: 'c1' });
    await vi.runAllTimersAsync();
    search.more();
    expect(search.state.loadingMore).toBe(true);
    calls[1]!.reject(new Error('offline'));
    await vi.runAllTimersAsync();
    expect(search.state.items).toEqual([ana]);
    search.retry();
    expect(calls[2]!.page).toBe(1);
    calls[2]!.resolve({ items: [bruno], hasMore: false });
    await vi.runAllTimersAsync();
    expect(search.state.items).toEqual([ana, bruno]);
    expect(search.state.hasMore).toBe(false);
  });

  it('draws the wait only after 200ms and holds it 400ms', async () => {
    const { calls, source } = deferredSource();
    const { search } = session(source);
    search.search({ query: '', scope: null, selected: [] });
    expect(search.state.indicator).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(search.state.indicator).toBe(true);
    calls[0]!.resolve({ items: [ana] });
    await vi.advanceTimersByTimeAsync(0);
    expect(search.state.status).toBe('ready');
    expect(search.state.indicator).toBe(true);
    await vi.advanceTimersByTimeAsync(400);
    expect(search.state.indicator).toBe(false);
  });

  it('draws nothing for an answer that arrives inside the delay', async () => {
    const { calls, source } = deferredSource();
    const { search, states } = session(source);
    search.search({ query: '', scope: null, selected: [] });
    calls[0]!.resolve({ items: [ana] });
    await vi.runAllTimersAsync();
    expect(states.some((state) => state.indicator)).toBe(false);
  });
});

describe('createEntityResolver', () => {
  it('asks once for every id wanted in the same task and marks what did not come back', async () => {
    const resolve = vi.fn(async (ids: readonly string[]) =>
      [ana, bruno].filter((entity) => ids.includes(entity.id)),
    );
    const cache = createEntityCache();
    const changed = vi.fn();
    const resolver = createEntityResolver({
      source: { search: async () => ({ items: [] }), resolve },
      cache,
      onChange: changed,
    });
    resolver.require(['ana', 'gone']);
    resolver.require(['bruno', 'ana']);
    expect(resolver.status('ana')).toBe('pending');
    await Promise.resolve();
    await Promise.resolve();
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(resolve.mock.calls[0]![0]).toEqual(['ana', 'gone', 'bruno']);
    expect(resolver.status('ana')).toBe('known');
    expect(resolver.status('gone')).toBe('missing');
    expect(changed).toHaveBeenCalled();

    resolver.require(['gone']);
    await Promise.resolve();
    expect(resolve).toHaveBeenCalledTimes(1);
    resolver.retry();
    resolver.require(['gone']);
    await Promise.resolve();
    expect(resolve).toHaveBeenCalledTimes(2);
  });

  it('marks every id missing when the source cannot resolve', async () => {
    const resolver = createEntityResolver({
      source: { search: async () => ({ items: [] }) },
      cache: createEntityCache(),
      onChange: () => {},
    });
    resolver.require(['x']);
    await Promise.resolve();
    expect(resolver.status('x')).toBe('missing');
  });
});
