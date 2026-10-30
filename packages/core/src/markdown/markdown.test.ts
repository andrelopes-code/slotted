import { describe, expect, it } from 'vitest';

import {
  completeMarkdown,
  fromMarkedTokens,
  isExternalUrl,
  type MarkdownElement,
  type MarkdownNode,
  type MarkedTokenLike,
  parseFenceMeta,
  plainText,
  prepareMarkdown,
  safeUrl,
  slugger,
} from './index';

const root = (...children: MarkdownNode[]): MarkdownNode => ({ type: 'root', children });
const p = (...children: MarkdownNode[]): MarkdownNode => ({ type: 'paragraph', children });
const t = (value: string): MarkdownNode => ({ type: 'text', value });
const h = (depth: number, ...children: MarkdownNode[]): MarkdownNode => ({
  type: 'heading',
  depth,
  children,
});

function kinds(elements: readonly MarkdownElement[]): string[] {
  return elements.map((element) => element.kind);
}

describe('safeUrl', () => {
  const links = ['http', 'https', 'mailto', 'tel'];

  it('keeps the schemes it is given and every relative form', () => {
    expect(safeUrl('https://example.com/a', links)).toBe('https://example.com/a');
    expect(safeUrl('MAILTO:a@b.c', links)).toBe('MAILTO:a@b.c');
    expect(safeUrl('/docs/a:b', links)).toBe('/docs/a:b');
    expect(safeUrl('#install', links)).toBe('#install');
    expect(safeUrl('guide?x=a:b', links)).toBe('guide?x=a:b');
    expect(safeUrl('', links)).toBe('');
  });

  it('refuses an executable scheme however it is spelt', () => {
    for (const hostile of [
      'javascript:alert(1)',
      'jAvAsCrIpT:alert(1)',
      ' javascript:alert(1)',
      'java\tscript:alert(1)',
      'java\nscript:alert(1)',
      '\u0000javascript:alert(1)',
      'vbscript:msgbox(1)',
      'data:text/html;base64,PHNjcmlwdD4=',
      'file:///etc/passwd',
    ]) {
      expect(safeUrl(hostile, links), JSON.stringify(hostile)).toBeNull();
    }
  });
});

describe('isExternalUrl', () => {
  it('is an absolute web address, and nothing else', () => {
    expect(isExternalUrl('https://example.com')).toBe(true);
    expect(isExternalUrl('//cdn.example.com/x')).toBe(true);
    expect(isExternalUrl('/docs')).toBe(false);
    expect(isExternalUrl('#top')).toBe(false);
    expect(isExternalUrl('mailto:a@b.c')).toBe(false);
  });
});

describe('slugger', () => {
  it('follows github-slugger and suffixes repeats in order', () => {
    const slug = slugger();
    expect(slug('Getting Started!')).toBe('getting-started');
    expect(slug('Getting Started')).toBe('getting-started-1');
    expect(slug('getting started')).toBe('getting-started-2');
    expect(slug('Über uns — Größe')).toBe('über-uns--größe');
    expect(slug('C++ & Rust')).toBe('c--rust');
    expect(slug('')).toBe('section');
  });
});

describe('parseFenceMeta', () => {
  it('reads a title, highlighted ranges and line numbers from the info string', () => {
    expect(parseFenceMeta('title="app.ts" {1,4-6} showLineNumbers')).toEqual({
      title: 'app.ts',
      highlight: '1,4-6',
      lineNumbers: true,
    });
    expect(parseFenceMeta("title='a b.ts'")).toEqual({
      title: 'a b.ts',
      highlight: null,
      lineNumbers: false,
    });
    expect(parseFenceMeta(null)).toEqual({ title: null, highlight: null, lineNumbers: false });
  });
});

describe('prepareMarkdown', () => {
  it('reports an empty document for no content, whitespace or definitions alone', () => {
    expect(prepareMarkdown(root()).empty).toBe(true);
    expect(prepareMarkdown(null).empty).toBe(true);
    expect(prepareMarkdown(root({ type: 'definition', identifier: 'a', url: '/a' })).empty).toBe(
      true,
    );
    expect(prepareMarkdown(root(p(t('x')))).empty).toBe(false);
  });

  it('keys every element by its path, so appending never rekeys what is there', () => {
    const before = prepareMarkdown(root(p(t('a')), p(t('b'))));
    const after = prepareMarkdown(root(p(t('a')), p(t('b')), p(t('c'))));
    expect(before.children.map((e) => e.key)).toEqual(['0', '1']);
    expect(after.children.map((e) => e.key)).toEqual(['0', '1', '2']);
  });

  it('writes a stable id on every heading, through the prefix, and lists the outline', () => {
    const doc = prepareMarkdown(root(h(1, t('Intro')), h(2, t('Intro')), h(2, t('Use'))), {
      idPrefix: 'msg-4-',
    });
    expect(doc.headings).toEqual([
      { id: 'msg-4-intro', text: 'Intro', level: 1 },
      { id: 'msg-4-intro-1', text: 'Intro', level: 2 },
      { id: 'msg-4-use', text: 'Use', level: 2 },
    ]);
  });

  it('moves every heading by the offset and stops at six', () => {
    const doc = prepareMarkdown(root(h(1, t('a')), h(5, t('b'))), { headingOffset: 2 });
    expect(doc.children.map((e) => (e.kind === 'heading' ? e.level : 0))).toEqual([3, 6]);
  });

  it('drops raw HTML and types nobody named', () => {
    const doc = prepareMarkdown(
      root(
        { type: 'html', value: '<script>alert(1)</script>' },
        p(t('a'), { type: 'html', value: '<b>' }, t('b')),
        { type: 'math', value: 'x^2' },
      ),
    );
    expect(kinds(doc.children)).toEqual(['paragraph']);
    const [paragraph] = doc.children;
    expect(paragraph?.kind === 'paragraph' && kinds(paragraph.children)).toEqual(['text', 'text']);
  });

  it('renders a type a renderer names, html included, as custom', () => {
    const doc = prepareMarkdown(
      root({ type: 'math', value: 'x^2' }, { type: 'html', value: '<b>' }),
      {
        custom: ['math', 'html'],
      },
    );
    expect(doc.children.map((e) => (e.kind === 'custom' ? e.type : e.kind))).toEqual([
      'math',
      'html',
    ]);
  });

  it('drops a disallowed type, or unwraps it into its parent when asked', () => {
    const tree = root(p(t('a '), { type: 'strong', children: [t('b')] }));
    const dropped = prepareMarkdown(tree, { allow: ['paragraph', 'text'] });
    const unwrapped = prepareMarkdown(tree, {
      allow: ['paragraph', 'text'],
      unwrapDisallowed: true,
    });
    expect(plainText(dropped.children)).toBe('a ');
    expect(plainText(unwrapped.children)).toBe('a b');
  });

  it('renders a refused link as its text and a refused image as its alt text', () => {
    const doc = prepareMarkdown(
      root(
        p(
          { type: 'link', url: 'javascript:alert(1)', children: [t('click')] },
          { type: 'image', url: 'data:image/png;base64,AA', alt: 'chart' },
        ),
      ),
    );
    const [paragraph] = doc.children;
    expect(paragraph?.kind === 'paragraph' && kinds(paragraph.children)).toEqual(['text', 'text']);
    expect(plainText(doc.children)).toBe('clickchart');
  });

  it('asks the consumer policy for every URL and marks absolute web links external', () => {
    const seen: string[] = [];
    const doc = prepareMarkdown(
      root(
        p(
          { type: 'link', url: 'https://a.example', children: [t('a')] },
          { type: 'link', url: '/local', children: [t('b')] },
        ),
      ),
      {
        transformUrl: (url, kind) => {
          seen.push(`${kind}:${url}`);
          return url;
        },
      },
    );
    expect(seen).toEqual(['link:https://a.example', 'link:/local']);
    const [paragraph] = doc.children;
    const links = paragraph?.kind === 'paragraph' ? paragraph.children : [];
    expect(links.map((l) => l.kind === 'link' && l.external)).toEqual([true, false]);
  });

  it('resolves references against definitions, and leaves an unresolved one as its source', () => {
    const doc = prepareMarkdown(
      root(
        p(
          {
            type: 'linkReference',
            identifier: 'Docs',
            referenceType: 'shortcut',
            children: [t('Docs')],
          },
          t(' '),
          {
            type: 'linkReference',
            identifier: 'missing',
            label: 'missing',
            referenceType: 'full',
            children: [t('gone')],
          },
        ),
        { type: 'definition', identifier: 'docs', url: '/docs', title: 'The docs' },
      ),
    );
    const [paragraph] = doc.children;
    const first = paragraph?.kind === 'paragraph' ? paragraph.children[0] : undefined;
    expect(first).toMatchObject({ kind: 'link', href: '/docs', title: 'The docs' });
    expect(plainText(doc.children)).toBe('Docs [gone][missing]');
  });

  it('reads a GitHub alert and removes its marker', () => {
    const doc = prepareMarkdown(
      root({ type: 'blockquote', children: [p(t('[!WARNING]\nMind the gap.'))] }),
    );
    expect(doc.children[0]).toMatchObject({ kind: 'alert', type: 'warning', tone: 'warning' });
    expect(plainText(doc.children)).toBe('Mind the gap.');
  });

  it('leaves a blockquote alone when alerts are off', () => {
    const doc = prepareMarkdown(root({ type: 'blockquote', children: [p(t('[!NOTE]\nx'))] }), {
      alerts: false,
    });
    expect(doc.children[0]?.kind).toBe('blockquote');
  });

  it('numbers task items in document order and names each by its text', () => {
    const item = (checked: boolean | null, text: string, offset: number): MarkdownNode => ({
      type: 'listItem',
      checked,
      spread: false,
      children: [p(t(text))],
      position: { start: { offset } },
    });
    const doc = prepareMarkdown(
      root({
        type: 'list',
        ordered: false,
        spread: false,
        children: [item(false, 'Ship', 10), item(null, 'Plain', 20), item(true, 'Test', 30)],
      }),
    );
    const [list] = doc.children;
    expect(list).toMatchObject({ kind: 'list', task: true, spread: false });
    const items = list?.kind === 'list' ? list.children : [];
    expect(items.map((i) => [i.checked, i.task, i.label, i.offset])).toEqual([
      [false, 0, 'Ship', 10],
      [null, null, 'Plain', 20],
      [true, 1, 'Test', 30],
    ]);
  });

  it('carries the fence language and its metadata to the code block', () => {
    const doc = prepareMarkdown(
      root({ type: 'code', lang: 'ts', meta: 'title="a.ts" {2}', value: 'let a;\nlet b;' }),
    );
    expect(doc.children[0]).toMatchObject({
      kind: 'code',
      code: 'let a;\nlet b;',
      language: 'ts',
      title: 'a.ts',
      highlight: '2',
      lineNumbers: false,
    });
  });

  it('turns a table into a head and rows with logical alignment', () => {
    const cell = (value: string): MarkdownNode => ({ type: 'tableCell', children: [t(value)] });
    const doc = prepareMarkdown(
      root({
        type: 'table',
        align: ['left', 'center', 'right', null],
        children: [
          { type: 'tableRow', children: [cell('a'), cell('b'), cell('c'), cell('d')] },
          { type: 'tableRow', children: [cell('1'), cell('2'), cell('3')] },
        ],
      }),
    );
    const [table] = doc.children;
    expect(table?.kind === 'table' && table.align).toEqual(['start', 'center', 'end', null]);
    expect(table?.kind === 'table' && table.head.length).toBe(4);
    expect(table?.kind === 'table' && table.rows[0]?.length).toBe(4);
  });

  it('numbers footnotes by first reference, links both ways and drops the unreferenced', () => {
    const ref = (identifier: string): MarkdownNode => ({ type: 'footnoteReference', identifier });
    const doc = prepareMarkdown(
      root(
        p(t('a'), ref('b'), t(' c'), ref('a'), t(' d'), ref('b')),
        { type: 'footnoteDefinition', identifier: 'a', children: [p(t('First'))] },
        { type: 'footnoteDefinition', identifier: 'b', children: [p(t('Second'))] },
        { type: 'footnoteDefinition', identifier: 'unused', children: [p(t('Never'))] },
      ),
      { idPrefix: 'x-' },
    );
    expect(doc.footnotes.map((f) => [f.number, f.id, f.references])).toEqual([
      [1, 'x-fn-b', ['x-fnref-b', 'x-fnref-b-2']],
      [2, 'x-fn-a', ['x-fnref-a']],
    ]);
    const [paragraph] = doc.children;
    const refs =
      paragraph?.kind === 'paragraph'
        ? paragraph.children.filter((c) => c.kind === 'footnoteReference')
        : [];
    expect(refs).toMatchObject([
      { id: 'x-fnref-b', target: 'x-fn-b', number: 1 },
      { id: 'x-fnref-a', target: 'x-fn-a', number: 2 },
      { id: 'x-fnref-b-2', target: 'x-fn-b', number: 1 },
    ]);
    expect(doc.footnoteLabelId).toBe('x-footnote-label');
  });

  it('renders a reference to a missing footnote as its source', () => {
    const doc = prepareMarkdown(
      root(p(t('a'), { type: 'footnoteReference', identifier: 'z', label: 'z' })),
    );
    expect(plainText(doc.children)).toBe('a[^z]');
    expect(doc.footnotes).toEqual([]);
  });
});

describe('completeMarkdown', () => {
  it('completes a table delimiter row cut before its last column', () => {
    expect(completeMarkdown('Totals:\n| a | b |\n| :-')).toBe('Totals:\n| a | b |\n| :- | --- |');
    expect(completeMarkdown('| a | b |\n|')).toBe('| a | b |\n| --- | --- |');
    expect(completeMarkdown('| a | b |\n| :--- | ---: |')).toBe('| a | b |\n| :--- | ---: |');
    expect(completeMarkdown('| a |\n| - |\n| 1 |\n|')).toBe('| a |\n| - |\n| 1 |\n|');
  });

  it('closes an open fence', () => {
    expect(completeMarkdown('Text\n\n```ts\nconst a')).toBe('Text\n\n```ts\nconst a\n```');
    expect(completeMarkdown('~~~~\nx\n~~~~')).toBe('~~~~\nx\n~~~~');
  });

  it('closes inline markers in the order they were opened', () => {
    expect(completeMarkdown('A **bold and *it')).toBe('A **bold and *it***');
    expect(completeMarkdown('Some `code')).toBe('Some `code`');
    expect(completeMarkdown('Gone ~~soon')).toBe('Gone ~~soon~~');
    expect(completeMarkdown('Done **here** now')).toBe('Done **here** now');
  });

  it('ignores markers inside code and list bullets', () => {
    expect(completeMarkdown('Use `a*b` here')).toBe('Use `a*b` here');
    expect(completeMarkdown('* one\n* two')).toBe('* one\n* two');
  });

  it('turns a link cut before its end into its text, and drops a cut image', () => {
    expect(completeMarkdown('See [the docs](https://exa')).toBe('See the docs');
    expect(completeMarkdown('Chart ![sales](https://im')).toBe('Chart ');
  });
});

describe('fromMarkedTokens', () => {
  it('maps the lexer output onto the same tree', () => {
    const tokens = [
      { type: 'heading', depth: 2, tokens: [{ type: 'text', text: 'Tom &amp; Jerry' }] },
      { type: 'space' },
      {
        type: 'list',
        ordered: false,
        start: '',
        loose: false,
        items: [
          {
            type: 'list_item',
            task: true,
            checked: true,
            loose: false,
            tokens: [
              { type: 'checkbox', checked: true },
              {
                type: 'text',
                text: 'done',
                tokens: [{ type: 'strong', tokens: [{ type: 'text', text: 'done' }] }],
              },
            ],
          },
        ],
      },
      { type: 'code', lang: 'ts title="a.ts"', text: 'let a;' },
      {
        type: 'table',
        align: ['left', null],
        header: [
          { text: 'a', tokens: [{ type: 'text', text: 'a' }], header: true, align: 'left' },
          {
            text: 'b',
            tokens: [{ type: 'codespan', text: '&lt;b&gt;' }],
            header: true,
            align: null,
          },
        ],
        rows: [
          [
            {
              text: '1',
              tokens: [
                { type: 'link', href: '/x', title: null, tokens: [{ type: 'text', text: 'x' }] },
              ],
              header: false,
              align: 'left',
            },
            { text: '', tokens: [], header: false, align: null },
          ],
        ],
      },
      { type: 'html', block: true, text: '<div>raw</div>' },
      { type: 'def', tag: 'r', href: '/r' },
      { type: 'hr' },
      {
        type: 'paragraph',
        tokens: [
          { type: 'escape', text: '*' },
          { type: 'br' },
          { type: 'image', href: '/i.png', title: 't', text: 'alt' },
          { type: 'del', tokens: [{ type: 'text', text: 'x' }] },
          { type: 'em', tokens: [{ type: 'text', text: '&#169;' }] },
        ],
      },
      {
        type: 'blockquote',
        tokens: [{ type: 'paragraph', tokens: [{ type: 'text', text: 'q' }] }],
      },
    ];
    expect(fromMarkedTokens(tokens as readonly MarkedTokenLike[])).toEqual({
      type: 'root',
      children: [
        { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Tom & Jerry' }] },
        {
          type: 'list',
          ordered: false,
          start: null,
          spread: false,
          children: [
            {
              type: 'listItem',
              checked: true,
              spread: false,
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'strong', children: [{ type: 'text', value: 'done' }] }],
                },
              ],
            },
          ],
        },
        { type: 'code', lang: 'ts', meta: 'title="a.ts"', value: 'let a;' },
        {
          type: 'table',
          align: ['left', null],
          children: [
            {
              type: 'tableRow',
              children: [
                { type: 'tableCell', children: [{ type: 'text', value: 'a' }] },
                { type: 'tableCell', children: [{ type: 'inlineCode', value: '<b>' }] },
              ],
            },
            {
              type: 'tableRow',
              children: [
                {
                  type: 'tableCell',
                  children: [
                    {
                      type: 'link',
                      url: '/x',
                      title: null,
                      children: [{ type: 'text', value: 'x' }],
                    },
                  ],
                },
                { type: 'tableCell', children: [] },
              ],
            },
          ],
        },
        { type: 'html', value: '<div>raw</div>' },
        { type: 'thematicBreak' },
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: '*' },
            { type: 'break' },
            { type: 'image', url: '/i.png', title: 't', alt: 'alt' },
            { type: 'delete', children: [{ type: 'text', value: 'x' }] },
            { type: 'emphasis', children: [{ type: 'text', value: '©' }] },
          ],
        },
        {
          type: 'blockquote',
          children: [{ type: 'paragraph', children: [{ type: 'text', value: 'q' }] }],
        },
      ],
    });
  });
});
