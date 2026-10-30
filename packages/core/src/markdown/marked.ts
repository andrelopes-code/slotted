import type { MarkdownNode } from './markdown';

/**
 * The part of a marked token this mapping reads. marked is not imported: its
 * `Lexer` output is a plain array, and the shape here is what `marked.lexer()`
 * returns in version 18, read from its own output rather than its types.
 */
export interface MarkedTokenLike {
  readonly type: string;
  readonly text?: string;
  readonly tokens?: readonly MarkedTokenLike[];
  readonly depth?: number;
  readonly ordered?: boolean;
  readonly start?: number | '';
  readonly loose?: boolean;
  readonly items?: readonly MarkedTokenLike[];
  readonly task?: boolean;
  readonly checked?: boolean;
  readonly lang?: string;
  readonly href?: string;
  readonly title?: string | null;
  readonly align?: readonly ('left' | 'right' | 'center' | null)[];
  readonly header?: readonly MarkedCellLike[] | boolean;
  readonly rows?: readonly (readonly MarkedCellLike[])[];
}

/** A table cell, which marked writes without a `type`. */
export interface MarkedCellLike {
  readonly tokens?: readonly MarkedTokenLike[];
}

const ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
};

/**
 * marked leaves character references in its tokens for the HTML renderer to
 * resolve; a tree rendered as text has to resolve them itself. Numeric
 * references are resolved in full, named ones for the set above, and an
 * unknown name stays as written.
 */
function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body.startsWith('#')) {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '�';
    }
    return ENTITIES[body.toLowerCase()] ?? match;
  });
}

function inline(tokens: readonly MarkedTokenLike[] | undefined): MarkdownNode[] {
  return (tokens ?? []).flatMap(inlineNode);
}

function inlineNode(token: MarkedTokenLike): MarkdownNode[] {
  switch (token.type) {
    case 'text':
      return token.tokens
        ? inline(token.tokens)
        : [{ type: 'text', value: decode(token.text ?? '') }];
    case 'escape':
      return [{ type: 'text', value: token.text ?? '' }];
    case 'codespan':
      return [{ type: 'inlineCode', value: decode(token.text ?? '') }];
    case 'strong':
      return [{ type: 'strong', children: inline(token.tokens) }];
    case 'em':
      return [{ type: 'emphasis', children: inline(token.tokens) }];
    case 'del':
      return [{ type: 'delete', children: inline(token.tokens) }];
    case 'br':
      return [{ type: 'break' }];
    case 'link':
      return [
        {
          type: 'link',
          url: token.href ?? '',
          title: token.title ?? null,
          children: inline(token.tokens),
        },
      ];
    case 'image':
      return [
        {
          type: 'image',
          url: token.href ?? '',
          title: token.title ?? null,
          alt: decode(token.text ?? ''),
        },
      ];
    case 'html':
      return [{ type: 'html', value: token.text ?? '' }];
    case 'checkbox':
      return [];
    default:
      return [];
  }
}

function block(token: MarkedTokenLike): MarkdownNode[] {
  switch (token.type) {
    case 'space':
    case 'def':
      return [];
    case 'heading':
      return [{ type: 'heading', depth: token.depth ?? 1, children: inline(token.tokens) }];
    case 'paragraph':
      return [{ type: 'paragraph', children: inline(token.tokens) }];
    case 'text':
      return [{ type: 'paragraph', children: inlineNode(token) }];
    case 'blockquote':
      return [{ type: 'blockquote', children: blocks(token.tokens) }];
    case 'hr':
      return [{ type: 'thematicBreak' }];
    case 'html':
      return [{ type: 'html', value: token.text ?? '' }];
    case 'code': {
      const info = (token.lang ?? '').trim();
      const space = info.search(/\s/);
      return [
        {
          type: 'code',
          lang: (space === -1 ? info : info.slice(0, space)) || null,
          meta: space === -1 ? null : info.slice(space + 1).trim() || null,
          value: token.text ?? '',
        },
      ];
    }
    case 'list':
      return [
        {
          type: 'list',
          ordered: Boolean(token.ordered),
          start: typeof token.start === 'number' ? token.start : null,
          spread: Boolean(token.loose),
          children: (token.items ?? []).map((item) => ({
            type: 'listItem',
            checked: item.task ? Boolean(item.checked) : null,
            spread: Boolean(item.loose),
            children: blocks(item.tokens),
          })),
        },
      ];
    case 'table': {
      const cell = (value: MarkedCellLike): MarkdownNode => ({
        type: 'tableCell',
        children: inline(value.tokens),
      });
      const header = Array.isArray(token.header) ? (token.header as readonly MarkedCellLike[]) : [];
      return [
        {
          type: 'table',
          align: token.align ?? [],
          children: [
            { type: 'tableRow', children: header.map(cell) },
            ...(token.rows ?? []).map((row) => ({ type: 'tableRow', children: row.map(cell) })),
          ],
        },
      ];
    }
    default:
      return [];
  }
}

function blocks(tokens: readonly MarkedTokenLike[] | undefined): MarkdownNode[] {
  return (tokens ?? []).flatMap(block);
}

/**
 * marked's lexer output as the tree the family takes. Reference links arrive
 * already resolved, because marked resolves them in the lexer; footnotes and
 * alerts are extensions marked does not ship, and an extension's token is
 * dropped unless it is mapped before this call.
 */
export function fromMarkedTokens(tokens: readonly MarkedTokenLike[]): MarkdownNode {
  return { type: 'root', children: blocks(tokens) };
}
