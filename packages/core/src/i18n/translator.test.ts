import { describe, expect, it } from 'vitest';

import { createTranslator as create, type MessageFamily } from './translator';
import type { Message, MessageFn } from './types';

interface TableMessages {
  readonly selectRow: Message;
  readonly groupCount: Message<{ count: number }>;
  readonly range: Message<{ start: number; end: number; count: number }>;
  readonly filterOperators: {
    readonly contains: Message;
    readonly equals: Message;
  };
}

interface DragMessages {
  readonly dropped: MessageFn<{ item: string }>;
}

interface Messages {
  readonly table: TableMessages;
  readonly drag: DragMessages;
}

const EN: Messages = {
  table: {
    selectRow: 'Select row',
    groupCount: '{count, plural, one {# row} other {# rows}}',
    range: '{start}–{end} of {count}',
    filterOperators: { contains: 'contains', equals: 'equals' },
  },
  drag: { dropped: ({ item }) => `${item} dropped.` },
};

// language: pt-BR
const PT = {
  table: {
    selectRow: 'Selecionar linha',
    groupCount: '{count, plural, one {# linha} other {# linhas}}',
    filterOperators: { contains: 'contém' },
  },
};
// language: en-US

const createTranslator = create<Messages>;
const table: MessageFamily<'table', TableMessages> = { name: 'table', base: EN.table };
const drag: MessageFamily<'drag', DragMessages> = { name: 'drag', base: EN.drag };

describe('createTranslator', () => {
  it('writes the base catalog when no other is given', () => {
    const t = createTranslator({ locale: 'en-US' }).family(table);
    expect(t('selectRow')).toBe('Select row');
    expect(t('groupCount', { count: 1 })).toBe('1 row');
    expect(t('groupCount', { count: 2 })).toBe('2 rows');
  });

  it('writes the catalog of the negotiated locale, plural and digits included', () => {
    const translator = createTranslator({ locale: 'pt-BR', catalogs: { 'pt-BR': PT } });
    const t = translator.family(table);
    // language: pt-BR
    expect(t('selectRow')).toBe('Selecionar linha');
    expect(t('groupCount', { count: 1 })).toBe('1 linha');
    expect(t('groupCount', { count: 1200 })).toBe('1.200 linhas');
    // language: en-US
    expect(translator.messageLocale).toBe('pt-BR');
  });

  it('reaches a catalog through the language prefix', () => {
    const t = createTranslator({ locale: 'pt-PT', catalogs: { pt: PT } }).family(table);
    // language: pt-BR
    expect(t('selectRow')).toBe('Selecionar linha');
    // language: en-US
  });

  it('falls to the base for a key the catalog lacks, written in the base locale', () => {
    const t = createTranslator({ locale: 'pt-BR', catalogs: { 'pt-BR': PT } }).family(table);
    expect(t('range', { start: 1, end: 25, count: 1234 })).toBe('1–25 of 1,234');
  });

  it('merges a record entry by entry: a catalog that names one operator keeps the others', () => {
    const t = createTranslator({ locale: 'pt-BR', catalogs: { 'pt-BR': PT } }).family(table);
    // language: pt-BR
    expect(t('filterOperators.contains')).toBe('contém');
    // language: en-US
    expect(t('filterOperators.equals')).toBe('equals');
  });

  it('lets an instance override replace a message whole and merge a record', () => {
    const t = createTranslator({ locale: 'pt-BR', catalogs: { 'pt-BR': PT } }).family(table, {
      // language: pt-BR
      selectRow: 'Marcar',
      filterOperators: { equals: 'é igual a' },
    });
    expect(t('selectRow')).toBe('Marcar');
    expect(t('filterOperators.equals')).toBe('é igual a');
    expect(t('filterOperators.contains')).toBe('contém');
    // language: en-US
  });

  it("puts the application's resolve before every catalog, and falls through on undefined", () => {
    const t = createTranslator({
      locale: 'pt-BR',
      catalogs: { 'pt-BR': PT },
      resolve: (path, slots, locale) =>
        path === 'table.groupCount' ? `${String(slots['count'])} @ ${locale}` : undefined,
    }).family(table, { groupCount: 'never read' });
    expect(t('groupCount', { count: 3 })).toBe('3 @ pt-BR');
    // language: pt-BR
    expect(t('selectRow')).toBe('Selecionar linha');
    // language: en-US
  });

  it('calls a function message with its slots and the locale', () => {
    const t = createTranslator({ locale: 'en-US' }).family(drag);
    expect(t('dropped', { item: 'Row 3' })).toBe('Row 3 dropped.');
  });

  /** An application that rewords the base itself registers an `en-US` catalog of its own. */
  it('lays an en-US catalog over the base, and still ends the lookup', () => {
    const catalogs = { 'en-US': { table: { selectRow: 'Pick row' } } };
    for (const locale of ['en-US', 'pt-BR', 'fr-FR']) {
      const t = createTranslator({ locale, catalogs }).family(table);
      expect(t('selectRow')).toBe('Pick row');
      expect(t('groupCount', { count: 2 })).toBe('2 rows');
    }
  });

  it('keeps the requested locale for formatting and names the catalog locale apart', () => {
    const translator = createTranslator({ locale: 'fr-FR', catalogs: { 'pt-BR': PT } });
    expect(translator.locale).toBe('fr-FR');
    expect(translator.messageLocale).toBe('en-US');
  });

  it('types the keys and the slots of a family', () => {
    const t = createTranslator({ locale: 'en-US' }).family(table);
    // @ts-expect-error a key the family does not declare
    expect(t('selectColumn')).toBe('table.selectColumn');
    // @ts-expect-error a slot of the wrong kind
    expect(t('groupCount', { count: 'two' })).toBe('{count, plural, one {# row} other {# rows}}');
    // @ts-expect-error a record key that does not exist
    expect(t('filterOperators.between')).toBe('table.filterOperators.between');
  });
});
