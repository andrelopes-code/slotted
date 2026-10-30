import type {
  MarkdownCustomElement,
  MarkdownElement,
  MarkdownKind,
  MarkdownNode,
  MarkdownUrlKind,
} from '@slotted/core/markdown';
import type { MarkdownMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

import type { ProseFlow, ProseSize } from '../prose';

/** Whether the source arrived. `loading` is separate, because a refresh keeps what is on screen. */
export type MarkdownStatus = 'ready' | 'error';

/** Where a link that leaves the application opens. */
export type MarkdownExternal = 'new-tab' | 'same-tab';

/** What an application sets once for every document under it. */
export interface MarkdownDefaults {
  alerts?: boolean | undefined;
  allow?: readonly string[] | undefined;
  external?: MarkdownExternal | undefined;
  headingAnchors?: boolean | undefined;
  isExternal?: ((href: string) => boolean) | undefined;
  transformUrl?:
    ((url: string, kind: MarkdownUrlKind, node: MarkdownNode) => string | null) | undefined;
}

export interface MarkdownDefaultsProviderProps extends MarkdownDefaults {
  children?: ReactNode | undefined;
}

/** What a renderer receives: the prepared element and its children, already rendered. */
export interface MarkdownRendererProps<E extends MarkdownElement = MarkdownElement> {
  element: E;
  children: ReactNode;
}

export type MarkdownRenderer<E extends MarkdownElement = MarkdownElement> = (
  props: MarkdownRendererProps<E>,
) => ReactNode;

/** One renderer per kind the document knows; each replaces the family's own element. */
export type MarkdownRenderers = {
  [K in Exclude<MarkdownKind, 'custom'>]?: MarkdownRenderer<Extract<MarkdownElement, { kind: K }>>;
};

/** Renderers for node types outside CommonMark and GFM, by the node's own `type`. */
export type MarkdownExtensions = Record<string, MarkdownRenderer<MarkdownCustomElement>>;

/** What a task checkbox asks for. The box moves when the consumer's tree does. */
export interface MarkdownTaskChange {
  /** The task's place among the document's tasks, counted from zero. */
  index: number;
  checked: boolean;
  /** Where the item starts in the source, when the adapter kept positions. */
  offset: number | null;
}

export interface MarkdownRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'aria-busy': true | undefined;
  'data-empty': true | undefined;
  'data-flow': ProseFlow;
  'data-loading': true | undefined;
  'data-part': string;
  'data-status': MarkdownStatus;
  'data-streaming': true | undefined;
  'data-ui': string;
}

export interface MarkdownProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The document, as mdast — remark's `fromMarkdown`, or `fromMarkedTokens(marked.lexer(source))`. */
  tree?: MarkdownNode | null | undefined;
  /**
   * The document as CommonMark text, read by `parseMarkdown` from `@slotted/core/markdown`: the
   * syntax of the types in `allow` is read and any other stays text. Takes the place of `tree`.
   */
  source?: string | undefined;

  /** The region's type step; falls back to `prose`'s defaults. */
  size?: ProseSize | undefined;
  /** The space between blocks; falls back to `prose`'s defaults. */
  flow?: ProseFlow | undefined;

  /** `error` replaces the document with the error part. */
  status?: MarkdownStatus | undefined;
  /** The source is on its way: a placeholder paragraph, after `skeleton`'s delay. */
  loading?: boolean | undefined;
  /** The source is still arriving: the region is busy and nothing is announced per token. */
  streaming?: boolean | undefined;

  /** Where a link that leaves the application opens. Defaults to `new-tab`. */
  external?: MarkdownExternal | undefined;
  /** Whether each heading carries a permalink. */
  headingAnchors?: boolean | undefined;
  /** Added to every heading's depth, clamped to six: `1` under a page's `h1`. */
  headingOffset?: number | undefined;
  /** Written before every generated id; required when two documents share a page. */
  idPrefix?: string | undefined;
  /** Whether `> [!NOTE]` and its siblings become alerts. Defaults to `true`. */
  alerts?: boolean | undefined;

  /** The mdast types that render. Defaults to CommonMark and GFM without `html`. */
  allow?: readonly string[] | undefined;
  /** A disallowed node gives its children to its parent. */
  unwrapDisallowed?: boolean | undefined;
  /** The URL a link or image takes, or `null` to refuse it. */
  transformUrl?:
    ((url: string, kind: MarkdownUrlKind, node: MarkdownNode) => string | null) | undefined;
  /** Whether a link leaves the application. */
  isExternal?: ((href: string) => boolean) | undefined;

  /** Replaces the family's element for a kind. */
  renderers?: MarkdownRenderers | undefined;
  /** Renders a node type the family does not know — `math`, `html`, a directive. */
  extensions?: MarkdownExtensions | undefined;

  /**
   * Words laid over the catalog of the language in force, key by key: the
   * empty, error, retry and loading texts, the footnotes heading, the back
   * link, the heading permalink, and each alert's title (`alerts.note`).
   */
  messages?: PartialMessages<MarkdownMessages> | undefined;
  /** Replaces the empty part's text — the place for the action that creates the first content. */
  empty?: ReactNode | undefined;

  /** Enables the task checkboxes. */
  onTaskChange?:
    ((change: MarkdownTaskChange, request: ChangeRequest<boolean>) => void) | undefined;
  /** Draws the retry button in the error part; `keyboard` when the press had no pointer. */
  onRetry?: ((reason: 'pointer' | 'keyboard') => void) | undefined;

  /** Renders the root into another element — `article`, `section`. */
  render?: ((props: MarkdownRootProps) => ReactNode) | undefined;
}
