import type { AttachmentMessages, FamilyTranslator, PartialMessages } from '@slotted/core/i18n';
import type { ChangeReason } from '@slotted/core/state';
import type { FileKind } from '@slotted/core/upload';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentPropsWithRef,
  HTMLAttributes,
  ReactNode,
  SyntheticEvent,
} from 'react';

export type AttachmentSize = 'sm' | 'md' | 'lg';
export type AttachmentOrientation = 'horizontal' | 'vertical';
export type AttachmentLayout = 'list' | 'grid' | 'strip';

/**
 * What the family needs to know about a file, and a `File` already is one. A
 * record from a server needs only the name: the kind is read from the media
 * type when there is one and from the extension when there is not.
 */
export interface AttachmentFile {
  readonly name: string;
  /** The media type, as `File.type` states it. */
  readonly type?: string | undefined;
  /** Bytes, as `File.size` states it. */
  readonly size?: number | undefined;
}

/** How the removal was asked for: the remove control, or `Backspace` / `Delete`. */
export type AttachmentRemoveReason = Extract<ChangeReason, 'remove' | 'keyboard'>;

/**
 * A request to be taken out of the list that holds the attachment. It carries
 * no value: the list is the consumer's, and the family commits nothing.
 */
export interface AttachmentRemoveRequest {
  readonly reason: AttachmentRemoveReason;
  readonly file: AttachmentFile;
  /** The event the request came from. */
  readonly source: SyntheticEvent;
}

/** What an application sets once for every attachment under it. */
export interface AttachmentDefaults {
  layout: AttachmentLayout;
  orientation: AttachmentOrientation;
  size: AttachmentSize;
}

export interface AttachmentDefaultsProviderProps extends Partial<AttachmentDefaults> {
  children?: ReactNode | undefined;
}

/** What the attachment hands every part inside it. */
export interface AttachmentContextValue {
  disabled: boolean;
  extension: string;
  file: AttachmentFile;
  ids: { detail: string; message: string };
  invalid: boolean;
  kind: FileKind;
  loading: boolean;
  /** The language in force, which writes the size the detail line shows. */
  locale: string;
  /**
   * Records the id a describing part carries while it is on the page — the
   * page's own when it passed one — so the trigger names only what exists.
   */
  describe: (part: 'detail' | 'message', id: string | null) => void;
  described: { detail: string | null; message: string | null };
  orientation: AttachmentOrientation;
  removable: boolean;
  request: (reason: AttachmentRemoveReason, source: SyntheticEvent) => void;
  stem: string;
  /** The family's words in the language in force, with this attachment's `messages` laid over them. */
  t: FamilyTranslator<AttachmentMessages>;
}

export interface AttachmentRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-kind': FileKind;
  'data-loading'?: '' | undefined;
  'data-orientation': AttachmentOrientation;
  'data-part': string;
  'data-size': AttachmentSize;
  'data-ui': string;
}

export interface AttachmentProps extends ComponentPropsWithRef<'li'> {
  /** The file: its name, and its media type and size when they are known. */
  file: AttachmentFile;
  /** The room the attachment gets. Falls back to the group, then the provider, then `md`. */
  size?: AttachmentSize | undefined;
  /** A row, or a card stood on end. Falls back to the group, then the provider. */
  orientation?: AttachmentOrientation | undefined;
  /**
   * The file failed. Painted from `data-invalid`, because ARIA 1.2 deprecates
   * `aria-invalid` on `listitem`; `AttachmentMessage` says why, and the
   * trigger names it as its description.
   */
  invalid?: boolean | undefined;
  /**
   * The file is still on its way. `aria-busy` on the root, the trigger
   * refused, `remove` still operable so the transfer can be abandoned.
   */
  loading?: boolean | undefined;
  /** The file cannot be reached: the trigger, every action and `remove` are refused. */
  disabled?: boolean | undefined;
  /**
   * Asks to take the attachment out of its list. Its presence is what makes
   * the attachment removable: `AttachmentRemove` renders and `Backspace` and
   * `Delete` answer.
   */
  onRemove?: ((request: AttachmentRemoveRequest) => void) | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * remove control's name (`remove`, with the file's `{name}`) and the tile's
   * word for a file without an extension.
   */
  messages?: PartialMessages<AttachmentMessages> | undefined;
  render?: ((props: AttachmentRootProps) => ReactNode) | undefined;
}

export interface AttachmentGroupRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-layout': AttachmentLayout;
  'data-orientation': AttachmentOrientation;
  'data-part': string;
  'data-size': AttachmentSize;
  'data-ui': string;
  tabIndex: number;
}

export interface AttachmentGroupProps extends ComponentPropsWithRef<'ul'> {
  /** A column, a grid that wraps, or one line that scrolls. Falls back to the provider. */
  layout?: AttachmentLayout | undefined;
  /** Handed to every attachment that does not state its own. */
  orientation?: AttachmentOrientation | undefined;
  /** Handed to every attachment that does not state its own. */
  size?: AttachmentSize | undefined;
  render?: ((props: AttachmentGroupRootProps) => ReactNode) | undefined;
}

export interface AttachmentPartRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
}

export interface AttachmentPartProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: AttachmentPartRootProps) => ReactNode) | undefined;
}

export interface AttachmentPreviewRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-extension': string;
  'data-kind': FileKind;
  'data-part': string;
}

export interface AttachmentPreviewProps extends ComponentPropsWithRef<'span'> {
  /** A thumbnail. Absent, or failing to load, the kind's tile is drawn instead. */
  src?: string | undefined;
  render?: ((props: AttachmentPreviewRootProps) => ReactNode) | undefined;
}

export interface AttachmentTriggerRootProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode | undefined;
  'data-part': string;
}

export interface AttachmentTriggerProps extends ComponentPropsWithRef<'button'> {
  render?: ((props: AttachmentTriggerRootProps) => ReactNode) | undefined;
}

export interface AttachmentLinkRootProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode | undefined;
  'data-part': string;
}

export interface AttachmentLinkProps extends ComponentPropsWithRef<'a'> {
  /** Renders the destination into another element — a router link, for one. */
  render?: ((props: AttachmentLinkRootProps) => ReactNode) | undefined;
}

export interface AttachmentTextProps extends ComponentPropsWithRef<'p'> {
  render?: ((props: AttachmentPartRootProps) => ReactNode) | undefined;
}

export interface AttachmentFilenameProps extends ComponentPropsWithRef<'span'> {
  render?: ((props: AttachmentPartRootProps) => ReactNode) | undefined;
}

export interface AttachmentProgressProps extends ComponentPropsWithRef<'div'> {
  /** Per cent, 0 to 100. Absent, the bar is indeterminate. */
  value?: number | null | undefined;
  render?: ((props: AttachmentPartRootProps) => ReactNode) | undefined;
}

/**
 * The wiring an action hands `render`. Typed on `HTMLElement` rather than on
 * the button, so an `a` with `download` takes it after dropping the two
 * attributes only a button has, `disabled` and `type`.
 */
export interface AttachmentActionRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
  disabled?: boolean | undefined;
  type?: 'button' | 'submit' | 'reset' | undefined;
}

export interface AttachmentActionProps extends ComponentPropsWithRef<'button'> {
  /** Renders the control into another element — an `a` with `download`, for one. */
  render?: ((props: AttachmentActionRootProps) => ReactNode) | undefined;
}
