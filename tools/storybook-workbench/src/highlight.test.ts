import { describe, expect, it } from 'vitest';

import { highlight } from './highlight';

const kinds = (source: string, language: Parameters<typeof highlight>[1]) =>
  highlight(source, language)
    .filter((token) => token.text.trim().length > 0)
    .map((token) => `${token.kind}:${token.text.trim()}`);

describe('highlight', () => {
  it('returns the source unchanged when the tokens are joined again', () => {
    const source = '<a slLink href="/terms">terms</a>\n<!-- a note -->';
    expect(
      highlight(source, 'angular')
        .map((token) => token.text)
        .join(''),
    ).toBe(source);
  });

  it('colors a template by tag, attribute and string', () => {
    expect(kinds('<a slLink href="/terms">terms</a>', 'angular')).toEqual([
      'tag:<a',
      'attr:slLink',
      'attr:href',
      'plain:=',
      'string:"/terms"',
      'tag:>',
      'plain:terms',
      'tag:</a',
      'tag:>',
    ]);
  });

  it('colors a stylesheet by custom property and value', () => {
    expect(kinds("[data-ui='link'] {\n  --slotted-link-radius: 4px;\n}", 'css')).toContain(
      'property:--slotted-link-radius',
    );
  });

  it('colors TypeScript by keyword and string', () => {
    const tokens = kinds("import { Link } from '@slotted/react';", 'tsx');
    expect(tokens).toContain('keyword:import');
    expect(tokens).toContain('keyword:from');
    expect(tokens).toContain("string:'@slotted/react'");
  });

  /**
   * A comment inside JSX is written `{/* … *\/}`, and a highlighter that only
   * knows `//` colors the braces and leaves the sentence looking like code.
   */
  it('knows a JSX comment from the code around it', () => {
    expect(kinds('{/* Rendered only for a new tab. */}', 'tsx')).toEqual([
      'comment:{/* Rendered only for a new tab. */}',
    ]);
  });

  it('colors Markdown source by its syntax, and gives the source back whole', () => {
    const source =
      '## Passos\n\n> [!NOTE]\n> Use `--wait`.\n\n- [ ] [docs](/cli)\n\n```ts\nlet a;\n```';
    expect(
      highlight(source, 'markdown')
        .map((token) => token.text)
        .join(''),
    ).toBe(source);
    const found = kinds(source, 'markdown');
    for (const expected of [
      'keyword:##',
      'keyword:[!NOTE]',
      'string:`--wait`',
      'keyword:[ ]',
      'property:](/cli)',
      'tag:```ts',
    ]) {
      expect(found).toContain(expected);
    }
  });
});
