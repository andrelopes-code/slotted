/**
 * What a Markdown document is once it reaches the `markdown` family: a tree in
 * the shape of mdast, prepared into one document both bindings walk.
 *
 * The parser is outside this package. `docs/process/build-order.md` makes it an
 * adapter: remark's `fromMarkdown` already produces mdast and passes through
 * untouched, and `fromMarkedTokens` maps marked's lexer output. The family
 * never receives a string of HTML and never writes `innerHTML`, so sanitising
 * is two decisions made here — which node types render, and which URLs survive
 * — rather than a pass over markup.
 *
 * `prepareMarkdown` does, once and for both frameworks, everything that is not
 * choosing an element: it resolves references against definitions, applies the
 * URL policy and the allowlist, slugs headings, numbers footnotes, reads
 * GitHub's alerts and parses a fence's info string.
 */

/**
 * A node of the input tree. Built-in types follow the mdast specification
 * (https://github.com/syntax-tree/mdast) for CommonMark and GFM; any other
 * `type` is an extension — `math` from remark-math, a directive, a mention —
 * that renders only when the consumer names a renderer for it.
 */
export interface MarkdownNode {
  readonly type: string;
  readonly children?: readonly MarkdownNode[];
  readonly value?: string;
  readonly depth?: number;
  readonly ordered?: boolean | null;
  readonly start?: number | null;
  readonly spread?: boolean | null;
  readonly checked?: boolean | null;
  readonly lang?: string | null;
  readonly meta?: string | null;
  readonly url?: string;
  readonly title?: string | null;
  readonly alt?: string | null;
  readonly identifier?: string;
  readonly label?: string | null;
  readonly referenceType?: 'shortcut' | 'collapsed' | 'full';
  readonly align?: readonly ('left' | 'right' | 'center' | null)[] | null;
  readonly position?: { readonly start?: { readonly offset?: number | undefined } | undefined };
  readonly [field: string]: unknown;
}

/** The mdast types rendered when the consumer states no allowlist. `html` is not one. */
export const MARKDOWN_TYPES: readonly string[] = [
  'blockquote',
  'break',
  'code',
  'definition',
  'delete',
  'emphasis',
  'footnoteDefinition',
  'footnoteReference',
  'heading',
  'image',
  'imageReference',
  'inlineCode',
  'link',
  'linkReference',
  'list',
  'listItem',
  'paragraph',
  'strong',
  'table',
  'tableCell',
  'tableRow',
  'text',
  'thematicBreak',
];

export const LINK_PROTOCOLS: readonly string[] = ['http', 'https', 'mailto', 'tel'];
export const IMAGE_PROTOCOLS: readonly string[] = ['http', 'https'];

export type MarkdownAlertType = 'note' | 'tip' | 'important' | 'warning' | 'caution';
export type MarkdownTone = 'accent' | 'success' | 'secondary' | 'warning' | 'danger';
export type MarkdownAlign = 'start' | 'center' | 'end' | null;
export type MarkdownUrlKind = 'link' | 'image';

export const MARKDOWN_ALERT_TONES: Readonly<Record<MarkdownAlertType, MarkdownTone>> = {
  note: 'accent',
  tip: 'success',
  important: 'secondary',
  warning: 'warning',
  caution: 'danger',
};

interface Keyed {
  /** The path of the element in the document; appending never changes an existing one. */
  readonly key: string;
}

export interface MarkdownHeadingElement extends Keyed {
  readonly kind: 'heading';
  readonly level: 1 | 2 | 3 | 4 | 5 | 6;
  readonly id: string;
  readonly text: string;
  readonly children: readonly MarkdownElement[];
}
export interface MarkdownParentElement extends Keyed {
  readonly kind: 'paragraph' | 'blockquote' | 'emphasis' | 'strong' | 'delete';
  readonly children: readonly MarkdownElement[];
}
export interface MarkdownAlertElement extends Keyed {
  readonly kind: 'alert';
  readonly type: MarkdownAlertType;
  readonly tone: MarkdownTone;
  readonly children: readonly MarkdownElement[];
}
export interface MarkdownItemElement extends Keyed {
  readonly kind: 'item';
  /** `true` or `false` on a task; `null` on an ordinary item. */
  readonly checked: boolean | null;
  /** The task's place among the document's tasks, counted from zero. */
  readonly task: number | null;
  /** The item's plain text: the name of its checkbox. */
  readonly label: string;
  /** Where the item starts in the source, when the adapter kept positions. */
  readonly offset: number | null;
  readonly children: readonly MarkdownElement[];
}
export interface MarkdownListElement extends Keyed {
  readonly kind: 'list';
  readonly ordered: boolean;
  readonly start: number | null;
  /** A loose list keeps a paragraph per item; a tight one draws the item's text bare. */
  readonly spread: boolean;
  /** At least one item is a task. Each task item draws no marker; an ordinary item beside it keeps its own, as on GitHub. */
  readonly task: boolean;
  readonly children: readonly MarkdownItemElement[];
}
export interface MarkdownCodeElement extends Keyed {
  readonly kind: 'code';
  readonly code: string;
  readonly language: string | null;
  readonly meta: string | null;
  readonly title: string | null;
  /** Line ranges in `code-block`'s own syntax, `1,4-6`. */
  readonly highlight: string | null;
  readonly lineNumbers: boolean;
}
export interface MarkdownCell {
  readonly key: string;
  readonly align: MarkdownAlign;
  readonly children: readonly MarkdownElement[];
}
export interface MarkdownTableElement extends Keyed {
  readonly kind: 'table';
  readonly align: readonly MarkdownAlign[];
  readonly head: readonly MarkdownCell[];
  readonly rows: readonly (readonly MarkdownCell[])[];
}
export interface MarkdownLeafElement extends Keyed {
  readonly kind: 'thematicBreak' | 'break';
}
export interface MarkdownValueElement extends Keyed {
  readonly kind: 'text' | 'inlineCode';
  readonly value: string;
}
export interface MarkdownLinkElement extends Keyed {
  readonly kind: 'link';
  readonly href: string;
  readonly title: string | null;
  readonly external: boolean;
  readonly children: readonly MarkdownElement[];
}
export interface MarkdownImageElement extends Keyed {
  readonly kind: 'image';
  readonly src: string;
  readonly alt: string;
  readonly title: string | null;
}
export interface MarkdownFootnoteReferenceElement extends Keyed {
  readonly kind: 'footnoteReference';
  /** This reference's own id, the one the footnote's back link returns to. */
  readonly id: string;
  /** The footnote's id. */
  readonly target: string;
  readonly number: number;
}
export interface MarkdownCustomElement extends Keyed {
  readonly kind: 'custom';
  /** The node's own type — `math`, `html`, a directive's name. */
  readonly type: string;
  readonly node: MarkdownNode;
  readonly children: readonly MarkdownElement[];
}

export type MarkdownElement =
  | MarkdownHeadingElement
  | MarkdownParentElement
  | MarkdownAlertElement
  | MarkdownListElement
  | MarkdownItemElement
  | MarkdownCodeElement
  | MarkdownTableElement
  | MarkdownLeafElement
  | MarkdownValueElement
  | MarkdownLinkElement
  | MarkdownImageElement
  | MarkdownFootnoteReferenceElement
  | MarkdownCustomElement;

export type MarkdownKind = MarkdownElement['kind'];

export const MARKDOWN_KINDS: readonly MarkdownKind[] = [
  'heading',
  'paragraph',
  'blockquote',
  'alert',
  'list',
  'item',
  'code',
  'thematicBreak',
  'table',
  'text',
  'emphasis',
  'strong',
  'delete',
  'inlineCode',
  'break',
  'link',
  'image',
  'footnoteReference',
  'custom',
];

export interface MarkdownHeading {
  readonly id: string;
  readonly text: string;
  readonly level: number;
}

export interface MarkdownFootnote {
  readonly key: string;
  readonly id: string;
  readonly number: number;
  /** The ids of every reference to it, in document order: one back link each. */
  readonly references: readonly string[];
  readonly children: readonly MarkdownElement[];
}

export interface MarkdownDocument {
  readonly children: readonly MarkdownElement[];
  /** Every heading, in order, with the id it renders under: a table of contents' input. */
  readonly headings: readonly MarkdownHeading[];
  readonly footnotes: readonly MarkdownFootnote[];
  /** The id of the footnotes section's heading. */
  readonly footnoteLabelId: string;
  readonly empty: boolean;
}

export interface MarkdownOptions {
  /** The mdast types that render. Defaults to `MARKDOWN_TYPES`. */
  readonly allow?: readonly string[] | undefined;
  /** A disallowed node gives its children to its parent instead of taking them away. */
  readonly unwrapDisallowed?: boolean | undefined;
  /** Types the consumer renders itself; each becomes a `custom` element. */
  readonly custom?: readonly string[] | undefined;
  /** The URL a link or an image takes, or `null` to refuse it. Defaults to `safeUrl`. */
  readonly transformUrl?:
    ((url: string, kind: MarkdownUrlKind, node: MarkdownNode) => string | null) | undefined;
  /** Whether a link leaves the application. Defaults to `isExternalUrl`. */
  readonly isExternal?: ((href: string) => boolean) | undefined;
  /** Written before every generated id. */
  readonly idPrefix?: string | undefined;
  /** Added to every heading's depth, and clamped to six. */
  readonly headingOffset?: number | undefined;
  /** Whether `> [!NOTE]` and its siblings become alerts. */
  readonly alerts?: boolean | undefined;
}

/*
 * ── URLs ─────────────────────────────────────────────────────────────────
 */

/**
 * The URL, or `null` when its scheme is not in the list. A URL with no scheme
 * — a path, a query, a fragment — is relative and always kept.
 *
 * The scheme is read after removing ASCII control characters and whitespace,
 * because a browser removes them too: `java\tscript:` runs as `javascript:`.
 * A colon after the first `/`, `?` or `#` belongs to the path, not a scheme.
 */
export function safeUrl(url: string, protocols: readonly string[]): string | null {
  const value = url.trim();
  // eslint-disable-next-line no-control-regex
  const probe = value.replace(/[\u0000- \u007f-\u009f]/g, '');
  const colon = probe.indexOf(':');
  if (colon === -1) return value;
  const boundary = probe.search(/[/?#]/);
  if (boundary !== -1 && boundary < colon) return value;
  const scheme = probe.slice(0, colon).toLowerCase();
  return protocols.includes(scheme) ? value : null;
}

/** An absolute web address, or one relative to the protocol: it leaves the application. */
export function isExternalUrl(href: string): boolean {
  return /^(?:https?:)?\/\//i.test(href.trim());
}

function defaultTransformUrl(url: string, kind: MarkdownUrlKind): string | null {
  return safeUrl(url, kind === 'image' ? IMAGE_PROTOCOLS : LINK_PROTOCOLS);
}

/*
 * ── Slugs ────────────────────────────────────────────────────────────────
 */

/**
 * A slug function with the memory of one document. The algorithm is
 * github-slugger's: lower case, every character that is not a letter, a mark,
 * a number, a connector, a hyphen or a space removed, spaces turned to
 * hyphens; a repeat takes `-1`, `-2` in order. An empty slug is `section`, so
 * a heading of punctuation alone still has an id to link to.
 */
export function slugger(): (text: string) => string {
  const seen = new Set<string>();
  return (text: string) => {
    const base =
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
        .replace(/ /g, '-') || 'section';
    let slug = base;
    for (let count = 1; seen.has(slug); count += 1) slug = `${base}-${count}`;
    seen.add(slug);
    return slug;
  };
}

/*
 * ── Fences ───────────────────────────────────────────────────────────────
 */

export interface FenceMeta {
  readonly title: string | null;
  readonly highlight: string | null;
  readonly lineNumbers: boolean;
}

/**
 * What a fence's info string says beyond its language, in the convention
 * Docusaurus, rehype-pretty-code and Expressive Code share:
 * `title="app.ts" {1,4-6} showLineNumbers`.
 */
export function parseFenceMeta(meta: string | null | undefined): FenceMeta {
  if (!meta) return { title: null, highlight: null, lineNumbers: false };
  const title = /\btitle=(?:"([^"]*)"|'([^']*)'|(\S+))/.exec(meta);
  const ranges = /\{([\d,\s-]+)\}/.exec(meta);
  return {
    title: title ? (title[1] ?? title[2] ?? title[3] ?? null) : null,
    highlight: ranges?.[1] ? ranges[1].replace(/\s+/g, '') : null,
    lineNumbers: /\bshowLineNumbers\b/.test(meta),
  };
}

/*
 * ── Text ─────────────────────────────────────────────────────────────────
 */

/** The text a reader would copy from these elements, footnote marks excluded. */
export function plainText(elements: readonly MarkdownElement[]): string {
  let text = '';
  for (const element of elements) {
    switch (element.kind) {
      case 'text':
      case 'inlineCode':
        text += element.value;
        break;
      case 'image':
        text += element.alt;
        break;
      case 'break':
        text += ' ';
        break;
      case 'footnoteReference':
      case 'thematicBreak':
      case 'code':
      case 'table':
        break;
      case 'item':
      case 'list':
      case 'heading':
      case 'paragraph':
      case 'blockquote':
      case 'alert':
      case 'emphasis':
      case 'strong':
      case 'delete':
      case 'link':
      case 'custom':
        text += plainText(element.children);
        break;
    }
  }
  return text;
}

/*
 * ── Preparing a document ─────────────────────────────────────────────────
 */

const ALERT_MARKER = /^\[!(note|tip|important|warning|caution)\][ \t]*(?:\r?\n|$)/i;

function normalizeIdentifier(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function clampLevel(level: number): 1 | 2 | 3 | 4 | 5 | 6 {
  return Math.min(6, Math.max(1, Math.round(level))) as 1 | 2 | 3 | 4 | 5 | 6;
}

function toAlign(align: 'left' | 'right' | 'center' | null | undefined): MarkdownAlign {
  if (align === 'left') return 'start';
  if (align === 'right') return 'end';
  if (align === 'center') return 'center';
  return null;
}

interface Definition {
  readonly url: string;
  readonly title: string | null;
}

export function prepareMarkdown(
  tree: MarkdownNode | null | undefined,
  options: MarkdownOptions = {},
): MarkdownDocument {
  const prefix = options.idPrefix ?? '';
  const allow = new Set(options.allow ?? MARKDOWN_TYPES);
  const custom = new Set(options.custom ?? []);
  const transformUrl = options.transformUrl ?? defaultTransformUrl;
  const isExternal = options.isExternal ?? isExternalUrl;
  const offset = options.headingOffset ?? 0;
  const alerts = options.alerts ?? true;
  const unwrap = options.unwrapDisallowed ?? false;

  const definitions = new Map<string, Definition>();
  const footnoteDefinitions = new Map<string, MarkdownNode>();
  const collect = (node: MarkdownNode) => {
    if (node.type === 'definition' && node.identifier !== undefined) {
      const id = normalizeIdentifier(node.identifier);
      if (!definitions.has(id))
        definitions.set(id, { url: node.url ?? '', title: node.title ?? null });
    } else if (node.type === 'footnoteDefinition' && node.identifier !== undefined) {
      const id = normalizeIdentifier(node.identifier);
      if (!footnoteDefinitions.has(id)) footnoteDefinitions.set(id, node);
      return;
    }
    for (const child of node.children ?? []) collect(child);
  };
  if (tree) collect(tree);

  const slug = slugger();
  const footnoteSlug = slugger();
  const headings: MarkdownHeading[] = [];
  const footnotes = new Map<
    string,
    { id: string; number: number; slug: string; references: string[]; node: MarkdownNode }
  >();
  let tasks = 0;

  const allowed = (type: string) => custom.has(type) || allow.has(type);

  const prepareChildren = (
    nodes: readonly MarkdownNode[] | undefined,
    path: string,
    tight = false,
  ): MarkdownElement[] => {
    const out: MarkdownElement[] = [];
    (nodes ?? []).forEach((node, index) => {
      const key = path ? `${path}.${index}` : `${index}`;
      if (tight && node.type === 'paragraph' && allowed('paragraph')) {
        out.push(...prepareChildren(node.children, key));
        return;
      }
      out.push(...prepareNode(node, key));
    });
    return out;
  };

  const resolveUrl = (url: string, kind: MarkdownUrlKind, node: MarkdownNode) =>
    transformUrl(url, kind, node);

  const text = (key: string, value: string): MarkdownValueElement => ({ key, kind: 'text', value });

  const prepareNode = (node: MarkdownNode, key: string): MarkdownElement[] => {
    const type = node.type;

    if (custom.has(type)) {
      return [{ key, kind: 'custom', type, node, children: prepareChildren(node.children, key) }];
    }
    if (!allow.has(type) || !MARKDOWN_TYPES.includes(type)) {
      return unwrap || type === 'root' ? prepareChildren(node.children, key) : [];
    }

    switch (type) {
      case 'text':
        return [text(key, node.value ?? '')];
      case 'inlineCode':
        return [{ key, kind: 'inlineCode', value: node.value ?? '' }];
      case 'break':
        return [{ key, kind: 'break' }];
      case 'thematicBreak':
        return [{ key, kind: 'thematicBreak' }];
      case 'paragraph':
      case 'emphasis':
      case 'strong':
      case 'delete': {
        const children = prepareChildren(node.children, key);
        return type === 'paragraph' && children.length === 0 ? [] : [{ key, kind: type, children }];
      }
      case 'heading': {
        const children = prepareChildren(node.children, key);
        const content = plainText(children);
        const level = clampLevel((node.depth ?? 1) + offset);
        const id = `${prefix}${slug(content)}`;
        headings.push({ id, text: content, level });
        return [{ key, kind: 'heading', level, id, text: content, children }];
      }
      case 'blockquote':
        return [prepareBlockquote(node, key)];
      case 'list':
        return [prepareList(node, key)];
      case 'listItem':
        return [prepareItem(node, key, Boolean(node.spread))];
      case 'code': {
        const meta = parseFenceMeta(node.meta);
        return [
          {
            key,
            kind: 'code',
            code: node.value ?? '',
            language: node.lang || null,
            meta: node.meta ?? null,
            ...meta,
          },
        ];
      }
      case 'table':
        return [prepareTable(node, key)];
      case 'tableRow':
      case 'tableCell':
        return prepareChildren(node.children, key);
      case 'link':
        return prepareLink(node, key, node.url ?? '', node.title ?? null);
      case 'image':
        return prepareImage(node, key, node.url ?? '', node.title ?? null);
      case 'linkReference':
      case 'imageReference': {
        const definition = definitions.get(normalizeIdentifier(node.identifier ?? ''));
        if (definition) {
          return type === 'linkReference'
            ? prepareLink(node, key, definition.url, definition.title)
            : prepareImage(node, key, definition.url, definition.title);
        }
        return revertReference(node, key);
      }
      case 'footnoteReference':
        return prepareFootnoteReference(node, key);
      case 'definition':
      case 'footnoteDefinition':
        return [];
      default:
        return [];
    }
  };

  const prepareLink = (
    node: MarkdownNode,
    key: string,
    url: string,
    title: string | null,
  ): MarkdownElement[] => {
    const children = prepareChildren(node.children, key);
    const href = resolveUrl(url, 'link', node);
    if (href === null) return children;
    return [{ key, kind: 'link', href, title, external: isExternal(href), children }];
  };

  const prepareImage = (
    node: MarkdownNode,
    key: string,
    url: string,
    title: string | null,
  ): MarkdownElement[] => {
    const alt = node.alt ?? '';
    const src = resolveUrl(url, 'image', node);
    if (src === null) return alt ? [text(key, alt)] : [];
    return [{ key, kind: 'image', src, alt, title }];
  };

  /** An unresolved reference is the source a reader typed, as CommonMark's reference renderer leaves it. */
  const revertReference = (node: MarkdownNode, key: string): MarkdownElement[] => {
    const label = node.label ?? node.identifier ?? '';
    const suffix =
      node.referenceType === 'full' ? `[${label}]` : node.referenceType === 'collapsed' ? '[]' : '';
    if (node.type === 'imageReference') {
      return [text(key, `![${node.alt ?? ''}]${suffix}`)];
    }
    return [
      text(`${key}.open`, '['),
      ...prepareChildren(node.children, key),
      text(`${key}.close`, `]${suffix}`),
    ];
  };

  const prepareFootnoteReference = (node: MarkdownNode, key: string): MarkdownElement[] => {
    const identifier = normalizeIdentifier(node.identifier ?? '');
    const definition = footnoteDefinitions.get(identifier);
    if (!definition || !allowed('footnoteDefinition')) {
      return [text(key, `[^${node.label ?? node.identifier ?? ''}]`)];
    }
    let footnote = footnotes.get(identifier);
    if (!footnote) {
      const s = footnoteSlug(identifier);
      footnote = {
        id: `${prefix}fn-${s}`,
        number: footnotes.size + 1,
        slug: s,
        references: [],
        node: definition,
      };
      footnotes.set(identifier, footnote);
    }
    const count = footnote.references.length + 1;
    const id = `${prefix}fnref-${footnote.slug}${count > 1 ? `-${count}` : ''}`;
    footnote.references.push(id);
    return [{ key, kind: 'footnoteReference', id, target: footnote.id, number: footnote.number }];
  };

  const prepareBlockquote = (node: MarkdownNode, key: string): MarkdownElement => {
    const children = prepareChildren(node.children, key);
    if (!alerts) return { key, kind: 'blockquote', children };
    const [first, ...rest] = children;
    if (first?.kind !== 'paragraph') return { key, kind: 'blockquote', children };
    const [lead, ...inline] = first.children;
    if (lead?.kind !== 'text') return { key, kind: 'blockquote', children };
    const match = ALERT_MARKER.exec(lead.value);
    if (!match?.[1]) return { key, kind: 'blockquote', children };

    const alertType = match[1].toLowerCase() as MarkdownAlertType;
    const remainder = lead.value.slice(match[0].length);
    const body: MarkdownElement[] = [
      ...(remainder ? [{ ...lead, value: remainder }] : []),
      ...(remainder || inline[0]?.kind !== 'break' ? inline : inline.slice(1)),
    ];
    return {
      key,
      kind: 'alert',
      type: alertType,
      tone: MARKDOWN_ALERT_TONES[alertType],
      children: body.length > 0 ? [{ ...first, children: body }, ...rest] : rest,
    };
  };

  const prepareList = (node: MarkdownNode, key: string): MarkdownListElement => {
    const nodes = node.children ?? [];
    const spread = Boolean(node.spread) || nodes.some((item) => Boolean(item.spread));
    const children = nodes
      .map((item, index) => ({ item, key: `${key}.${index}` }))
      .filter(({ item }) => item.type === 'listItem' && allowed('listItem'))
      .map(({ item, key: itemKey }) => prepareItem(item, itemKey, spread));
    return {
      key,
      kind: 'list',
      ordered: Boolean(node.ordered),
      start: typeof node.start === 'number' ? node.start : null,
      spread,
      task: children.some((item) => item.checked !== null),
      children,
    };
  };

  const prepareItem = (node: MarkdownNode, key: string, spread: boolean): MarkdownItemElement => {
    const checked = typeof node.checked === 'boolean' ? node.checked : null;
    const task = checked === null ? null : tasks++;
    const children = prepareChildren(node.children, key, !spread);
    const firstBlock = node.children?.[0];
    const labelSource =
      firstBlock?.type === 'paragraph' ? prepareLabel(firstBlock) : plainText(children);
    return {
      key,
      kind: 'item',
      checked,
      task,
      label: labelSource.trim(),
      offset: node.position?.start?.offset ?? null,
      children,
    };
  };

  /** The label reads the node's text without numbering its footnotes a second time. */
  const prepareLabel = (paragraph: MarkdownNode): string => {
    const walk = (node: MarkdownNode): string => {
      if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
      if (node.type === 'image') return node.alt ?? '';
      if (node.type === 'break') return ' ';
      if (node.type === 'footnoteReference' || node.type === 'html') return '';
      return (node.children ?? []).map(walk).join('');
    };
    return walk(paragraph);
  };

  const prepareTable = (node: MarkdownNode, key: string): MarkdownTableElement => {
    const rows = (node.children ?? []).filter((row) => row.type === 'tableRow');
    const align = (node.align ?? []).map(toAlign);
    const columns = Math.max(align.length, ...rows.map((row) => row.children?.length ?? 0));
    const cells = (row: MarkdownNode | undefined, rowKey: string): MarkdownCell[] =>
      Array.from({ length: columns }, (_, index) => {
        const cell = row?.children?.[index];
        const cellKey = `${rowKey}.${index}`;
        return {
          key: cellKey,
          align: align[index] ?? null,
          children: cell ? prepareChildren(cell.children, cellKey) : [],
        };
      });
    return {
      key,
      kind: 'table',
      align: Array.from({ length: columns }, (_, index) => align[index] ?? null),
      head: cells(rows[0], `${key}.0`),
      rows: rows.slice(1).map((row, index) => cells(row, `${key}.${index + 1}`)),
    };
  };

  const children = tree
    ? tree.type === 'root'
      ? prepareChildren(tree.children, '')
      : prepareNode(tree, '0')
    : [];

  /*
   * Footnotes are prepared after the body, in the order they were first
   * referenced; a footnote that references another numbers it here, which is
   * why this loop reads the map's size on every turn instead of a copy.
   */
  const prepared: MarkdownFootnote[] = [];
  const pending = [...footnotes.values()];
  for (let index = 0; index < pending.length; index += 1) {
    const footnote = pending[index];
    if (!footnote) continue;
    const before = footnotes.size;
    const content = prepareChildren(footnote.node.children, `fn.${footnote.slug}`);
    prepared.push({
      key: `fn.${footnote.slug}`,
      id: footnote.id,
      number: footnote.number,
      references: footnote.references,
      children: content,
    });
    if (footnotes.size > before) pending.push(...[...footnotes.values()].slice(before));
  }

  return {
    children,
    headings,
    footnotes: prepared,
    footnoteLabelId: `${prefix}footnote-label`,
    empty: children.length === 0 && prepared.length === 0,
  };
}
