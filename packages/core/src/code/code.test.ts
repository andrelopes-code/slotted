import { describe, expect, it } from 'vitest';

import {
  copyText,
  fromPrismTokens,
  fromShikiTokens,
  gutterDigits,
  leadingColumns,
  lineMarks,
  lineText,
  parseLineRanges,
  plainLines,
  splitLines,
} from './code';

describe('lines', () => {
  it('splits on every newline convention and drops the trailing one', () => {
    expect(splitLines('a\nb\r\nc\rd\n')).toEqual(['a', 'b', 'c', 'd']);
    expect(splitLines('')).toEqual(['']);
    expect(splitLines('\n')).toEqual(['']);
  });

  it('draws one unscoped token per line before an engine answers', () => {
    expect(plainLines('const a = 1;\n')).toEqual([[{ text: 'const a = 1;' }]]);
    expect(lineText([{ text: 'a' }, { text: 'b', scope: 'keyword' }])).toBe('ab');
  });
});

describe('fromPrismTokens', () => {
  it('folds standard names and aliases onto the twelve scopes, and splits a token at a newline', () => {
    const lines = fromPrismTokens([
      { type: 'comment', content: '/* a\nb */' },
      '\n',
      { type: 'keyword', content: 'const' },
      ' ',
      { type: 'binary-number', alias: 'number', content: '0b1' },
      { type: 'punctuation', content: ';' },
      {
        type: 'template-string',
        content: [{ type: 'template-punctuation', alias: 'string', content: '`' }, 'x'],
      },
      { type: 'unknown', content: '?' },
    ]);
    expect(lines).toEqual([
      [{ text: '/* a', scope: 'comment' }],
      [{ text: 'b */', scope: 'comment' }],
      [
        { text: 'const', scope: 'keyword' },
        { text: ' ' },
        { text: '0b1', scope: 'number' },
        { text: ';', scope: 'punctuation' },
        { text: '`', scope: 'string' },
        { text: 'x', scope: 'string' },
        { text: '?' },
      ],
    ]);
  });
});

describe('fromShikiTokens', () => {
  it('reads the most specific TextMate scope and leaves an unexplained token plain', () => {
    const lines = fromShikiTokens({
      tokens: [
        [
          {
            content: 'function',
            explanation: [
              { scopes: [{ scopeName: 'source.ts' }, { scopeName: 'storage.type.function.ts' }] },
            ],
          },
          { content: ' ' },
          {
            content: 'go',
            explanation: [
              {
                scopes: [
                  { scopeName: 'meta.function.ts' },
                  { scopeName: 'entity.name.function.ts' },
                ],
              },
            ],
          },
          { content: '(', explanation: [{ scopes: [{ scopeName: 'meta.brace.round.ts' }] }] },
        ],
        [{ content: '', explanation: [] }],
      ],
    });
    expect(lines).toEqual([
      [
        { text: 'function', scope: 'keyword' },
        { text: ' ' },
        { text: 'go', scope: 'function' },
        { text: '(', scope: 'punctuation' },
      ],
      [],
    ]);
    expect(fromShikiTokens([[{ content: 'x' }]])).toEqual([[{ text: 'x' }]]);
  });
});

describe('marks', () => {
  it('parses ranges, orders a reversed one and skips what is not a number', () => {
    expect([...parseLineRanges('1, 4-6,x, 9-8')]).toEqual([1, 4, 5, 6, 8, 9]);
    expect([...parseLineRanges([3, 0, 2.5, 1])]).toEqual([3, 1]);
    expect(parseLineRanges(undefined).size).toBe(0);
  });

  it('resolves one mark per line in precedence order and dims outside the focus', () => {
    const marks = lineMarks({ highlight: '1-3', remove: '2', add: [3], focus: '2-3' }, 4);
    expect(marks).toEqual([
      { mark: 'highlight', dim: true },
      { mark: 'remove', dim: false },
      { mark: 'add', dim: false },
      { mark: undefined, dim: true },
    ]);
    expect(lineMarks(undefined, 2).every((line) => !line.dim && line.mark === undefined)).toBe(
      true,
    );
  });
});

describe('copyText', () => {
  it('drops removed lines unless asked to keep them', () => {
    const code = 'a\nb\nc';
    expect(copyText(code, { remove: '2' })).toBe('a\nc');
    expect(copyText(code, { remove: '2' }, { includeRemoved: true })).toBe(code);
    expect(copyText(code, undefined)).toBe(code);
  });
});

describe('geometry', () => {
  it('measures the indent in columns and the gutter in digits', () => {
    expect(leadingColumns('    x')).toBe(4);
    expect(leadingColumns('\t\tx', 4)).toBe(8);
    expect(leadingColumns('x')).toBe(0);
    expect(gutterDigits(9)).toBe(1);
    expect(gutterDigits(10)).toBe(2);
    expect(gutterDigits(5, 998)).toBe(4);
    expect(gutterDigits(0)).toBe(1);
  });
});
