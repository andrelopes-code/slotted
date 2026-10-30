import type { CodeHighlighter, CodeLine, CodeMarks, CodeToken } from '@slotted/core/code';
import type { CodeBlockMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode, RefObject } from 'react';

export type CodeBlockWrapReason = Extract<ChangeReason, 'pointer' | 'keyboard' | 'programmatic'>;
export type CodeBlockRevealedReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'escape' | 'programmatic'
>;

export interface CodeBlockWrapRequest extends ChangeRequest<boolean> {
  readonly reason: CodeBlockWrapReason;
}
export interface CodeBlockRevealedRequest extends ChangeRequest<boolean> {
  readonly reason: CodeBlockRevealedReason;
}

export interface CodeBlockCopyRequest {
  /** The exact text handed to the clipboard. */
  readonly value: string;
  readonly reason: 'pointer' | 'keyboard';
  /** `false` when the platform refused the write or offers no clipboard. */
  readonly copied: boolean;
  readonly source?: unknown;
}

export interface CodeBlockLineProps {
  /** One-based. */
  number: number;
  line: CodeLine;
  mark: 'highlight' | 'add' | 'remove' | 'error' | 'warning' | undefined;
  dim: boolean;
}

export interface CodeBlockHandle {
  /** Writes the code to the clipboard, as the control does. */
  copy: () => Promise<boolean>;
  /** Brings a one-based line into view. */
  scrollToLine: (line: number) => void;
  readonly root: HTMLDivElement | null;
}

export interface CodeBlockDefaults {
  highlight?: CodeHighlighter | undefined;
  lineNumbers?: boolean | undefined;
  copy?: boolean | undefined;
}

export interface CodeBlockDefaultsProviderProps extends CodeBlockDefaults {
  children?: ReactNode;
}

export interface CodeBlockProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'onCopy' | 'ref' | 'title'
> {
  /** The source, as text. Never HTML. */
  code: string;
  /** Written as `data-language` and as `class="language-<x>"` on the `code` element. */
  language?: string | undefined;
  /**
   * The engine, outside the family. Resolved after the first paint and
   * swapped line by line into the grid the text already laid out.
   */
  highlight?: CodeHighlighter | null | undefined;
  /** Already-tokenized lines, when the consumer ran the engine itself. */
  tokens?: readonly CodeLine[] | undefined;
  onHighlightError?: ((error: unknown) => void) | undefined;

  title?: ReactNode | undefined;
  /** The file's name, for the glyph beside the title. Defaults to `title` when it is a string. */
  fileName?: string | undefined;
  lineNumbers?: boolean | undefined;
  /** The first line's number. */
  start?: number | undefined;
  marks?: CodeMarks | undefined;

  wrap?: boolean | undefined;
  defaultWrap?: boolean | undefined;
  onWrapChange?: ((wrap: boolean, request: CodeBlockWrapRequest) => void) | undefined;

  /** Lines shown before the block collapses behind the reveal control. */
  collapseAfter?: number | undefined;
  revealed?: boolean | undefined;
  defaultRevealed?: boolean | undefined;
  onRevealedChange?: ((revealed: boolean, request: CodeBlockRevealedRequest) => void) | undefined;
  /** Lines the body shows before it scrolls. */
  maxLines?: number | undefined;

  copy?: boolean | undefined;
  /** Keep the lines marked `remove` in what the control copies. */
  copyRemoved?: boolean | undefined;
  onCopy?: ((request: CodeBlockCopyRequest) => void) | undefined;

  loading?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * scroll region's name when the block has no title (`region`), the controls,
   * and the announcements.
   */
  messages?: PartialMessages<CodeBlockMessages> | undefined;
  /** Tab width in characters, for the wrapped continuation's indent. */
  tabSize?: number | undefined;

  /** Replaces the run of tokens a line draws. The gutter stays the family's. */
  renderLine?: ((props: CodeBlockLineProps) => ReactNode) | undefined;
  /** Replaces one token. */
  renderToken?: ((token: CodeToken, index: number, line: number) => ReactNode) | undefined;
  /** Controls of the consumer's own, beside copy and wrap. */
  actions?: ReactNode | undefined;
  preProps?: Omit<ComponentPropsWithRef<'pre'>, 'children'> | undefined;
  ref?: RefObject<CodeBlockHandle | null> | ((handle: CodeBlockHandle | null) => void) | undefined;
}
