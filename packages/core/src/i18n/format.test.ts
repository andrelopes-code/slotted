import { describe, expect, it } from 'vitest';

import { formatMessage, isWellFormed, messageSlots } from './format';

describe('formatMessage', () => {
  it('fills a slot by name and leaves text around it as written', () => {
    expect(formatMessage('Remove {name}', { name: 'Ada' }, 'en-US')).toBe('Remove Ada');
  });

  it('writes a number slot in the locale and a string slot as it is', () => {
    expect(
      formatMessage('{start}–{end} of {count}', { start: 1, end: 25, count: 1234 }, 'en-US'),
    ).toBe('1–25 of 1,234');
    expect(
      formatMessage('{start}–{end} de {count}', { start: 1, end: 25, count: 1234 }, 'pt-BR'),
    ).toBe('1–25 de 1.234');
    expect(formatMessage('± {margin}', { margin: '0,04' }, 'pt-BR')).toBe('± 0,04');
  });

  it('leaves a placeholder it has no value for untouched', () => {
    expect(formatMessage('{value} de {max}', { value: 3 }, 'pt-BR')).toBe('3 de {max}');
  });

  it('picks the plural form the locale asks for, with # standing for the number', () => {
    const template =
      // language: pt-BR
      '{level, plural, one {# estrela} other {# estrelas}}: {count, plural, one {# avaliação} other {# avaliações}}, {share}';

    expect(formatMessage(template, { level: 1, count: 1, share: '1%' }, 'pt-BR')).toBe(
      '1 estrela: 1 avaliação, 1%',
    );
    expect(formatMessage(template, { level: 5, count: 1052, share: '82%' }, 'pt-BR')).toBe(
      '5 estrelas: 1.052 avaliações, 82%',
    );
    // language: en-US
  });

  it('reads a plural by the rules of the locale, not of English', () => {
    const rows = '{count, plural, one {# row} other {# rows}}';
    expect(formatMessage(rows, { count: 1 }, 'en-US')).toBe('1 row');
    expect(formatMessage(rows, { count: 0 }, 'en-US')).toBe('0 rows');

    // language: pt-BR
    const linhas = '{count, plural, one {# linha} other {# linhas}}';
    expect(formatMessage(linhas, { count: 0 }, 'pt-BR')).toBe('0 linha');
    expect(formatMessage(linhas, { count: 2 }, 'pt-BR')).toBe('2 linhas');
    // language: en-US

    const polish = '{count, plural, one {# plik} few {# pliki} many {# plików} other {# pliku}}';
    expect(formatMessage(polish, { count: 3 }, 'pl')).toBe('3 pliki');
    expect(formatMessage(polish, { count: 5 }, 'pl')).toBe('5 plików');
  });

  // language: pt-BR
  /** CLDR files nought under `one` in Portuguese; "0 avaliação" is not how a page in Brazil reads. */
  it('takes an exact branch before the plural category', () => {
    const template = '{count, plural, =0 {# avaliações} one {# avaliação} other {# avaliações}}';

    expect(formatMessage(template, { count: 0 }, 'pt-BR')).toBe('0 avaliações');
    expect(formatMessage(template, { count: 1 }, 'pt-BR')).toBe('1 avaliação');
    // language: en-US
  });

  it('falls to other when the category has no branch', () => {
    expect(formatMessage('{count, plural, other {# items}}', { count: 1 }, 'en-US')).toBe(
      '1 items',
    );
  });

  it('fills simple slots inside a branch', () => {
    const template = '{count, plural, =0 {No results} other {{start}–{end} of {count}}}';

    expect(formatMessage(template, { start: 0, end: 0, count: 0 }, 'en-US')).toBe('No results');
    expect(formatMessage(template, { start: 1, end: 10, count: 42 }, 'en-US')).toBe('1–10 of 42');
  });

  it('picks a select branch by the string slot, and other when none matches', () => {
    const template = '{item} {operation, select, copy {copied} move {moved} other {dropped}}.';

    expect(formatMessage(template, { item: 'Row 3', operation: 'copy' }, 'en-US')).toBe(
      'Row 3 copied.',
    );
    expect(formatMessage(template, { item: 'Row 3', operation: 'link' }, 'en-US')).toBe(
      'Row 3 dropped.',
    );
  });

  it('leaves a plural or select untouched when its slot is missing or of the wrong kind', () => {
    const plural = '{count, plural, one {# row} other {# rows}}';
    expect(formatMessage(plural, {}, 'en-US')).toBe(plural);
    expect(formatMessage(plural, { count: 'many' }, 'en-US')).toBe(plural);
  });

  it('reads an apostrophe before a brace or # as a quote, and anywhere else as text', () => {
    expect(formatMessage("Type '{'name'}' to search", {}, 'en-US')).toBe('Type {name} to search');
    expect(formatMessage("{count, plural, other {# of '#'}}", { count: 2 }, 'en-US')).toBe(
      '2 of #',
    );
    expect(formatMessage("Can't open {name}", { name: 'report.pdf' }, 'en-US')).toBe(
      "Can't open report.pdf",
    );
    expect(formatMessage("It''s {name}", { name: 'here' }, 'en-US')).toBe("It's here");
  });

  it('writes # outside a plural as text', () => {
    expect(formatMessage('Issue #{id}', { id: '12' }, 'en-US')).toBe('Issue #12');
  });
});

describe('messageSlots', () => {
  it('names every slot once, including those a plural or select reads', () => {
    expect(
      messageSlots('{count, plural, =0 {No results} other {{start}–{end} of {count}}} for {query}'),
    ).toEqual(['count', 'start', 'end', 'query']);
    expect(messageSlots("Type '{'name'}'")).toEqual([]);
  });
});

describe('isWellFormed', () => {
  it('accepts every brace the grammar reads, quoted braces included', () => {
    expect(isWellFormed('{count, plural, one {# row} other {# rows}}')).toBe(true);
    expect(isWellFormed("Type '{'name'}' to search")).toBe(true);
    expect(isWellFormed('Plain text')).toBe(true);
  });

  it('rejects a brace left open, closed alone, or a plural without other', () => {
    expect(isWellFormed('{count, plural, one {# row}')).toBe(false);
    expect(isWellFormed('Rows }')).toBe(false);
    expect(isWellFormed('{count, plural, one {# row}}')).toBe(false);
    expect(isWellFormed('{count, plural, one {# row} other {{nested, plural, other {x}}}}')).toBe(
      false,
    );
  });
});
