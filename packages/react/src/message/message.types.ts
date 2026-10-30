import type { FamilyTranslator, MessageMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import type {
  ComponentPropsWithRef,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  SyntheticEvent,
} from 'react';

export type MessageAlign = 'start' | 'end';
export type MessageLayout = 'bubble' | 'thread';
export type MessageActionsVisibility = 'always' | 'hover';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'streaming';
export type BubbleVariant = 'solid' | 'soft' | 'outline' | 'plain';
export type BubbleTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
export type MessageActivityStepStatus = 'complete' | 'current' | 'pending';

/** Why a version, a reaction or a clamp moved: the reader's pointer or keyboard. */
export type MessageChangeReason = Extract<ChangeReason, 'pointer' | 'keyboard'>;

export interface MessageDefaults {
  layout: MessageLayout;
  actionsVisibility: MessageActionsVisibility;
  /** The painting of a bubble that states none and whose row infers none. */
  variant: BubbleVariant;
  tone: BubbleTone;
}

export interface MessageDefaultsProviderProps extends Partial<MessageDefaults> {
  children?: ReactNode | undefined;
}

/** A request to send a message again, from its retry control. It carries no value. */
export interface MessageRetryRequest {
  readonly reason: MessageChangeReason;
  readonly source: SyntheticEvent;
}

/** What a row hands its parts and the bubbles inside it. */
export interface MessageContextValue {
  align: MessageAlign;
  layout: MessageLayout;
  status: MessageStatus | undefined;
  /** The family's words in the language in force, with this row's `messages` laid over them. */
  t: FamilyTranslator<MessageMessages>;
  authorId: string;
  registerAuthor: (present: boolean) => void;
  version: number;
  versionCount: number;
  requestVersion: (next: number, reason: MessageChangeReason, source: SyntheticEvent) => void;
  onRetry: ((request: MessageRetryRequest) => void) | undefined;
}

type DataAttributes = { [key: `data-${string}`]: string | number | undefined };

export type MessageRootProps = HTMLAttributes<HTMLElement> &
  DataAttributes & {
    children?: ReactNode | undefined;
  };

type RenderProp = ((props: MessageRootProps) => ReactElement) | undefined;

export interface MessageProps extends ComponentPropsWithRef<'article'> {
  /** The sender's side. `end` is the reader's own message. */
  align?: MessageAlign | undefined;
  /** Bubbles in a conversation, or rows of a comment thread. Falls back to the group, then the provider. */
  layout?: MessageLayout | undefined;
  /** Actions painted at rest, or revealed by the pointer, by focus and on a touch screen. */
  actionsVisibility?: MessageActionsVisibility | undefined;
  /**
   * Where the message is in its delivery. `sending` and `streaming` put
   * `aria-busy` on the article; `failed` is `data-invalid`; `read` is
   * `data-read`.
   */
  status?: MessageStatus | undefined;
  /** The version on screen, from 0. Controlled when present. */
  version?: number | undefined;
  /** The version an uncontrolled message starts on. */
  defaultVersion?: number | undefined;
  /** How many versions exist; the pager draws when there are two or more. */
  versionCount?: number | undefined;
  onVersionChange?: ((version: number, request: ChangeRequest<number>) => void) | undefined;
  /** Asks to send the message again. `BubbleRetry` calls it. */
  onRetry?: ((request: MessageRetryRequest) => void) | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key, for
   * this row and every part and bubble inside it.
   */
  messages?: PartialMessages<MessageMessages> | undefined;
  render?: RenderProp;
}

export interface MessageGroupProps extends ComponentPropsWithRef<'div'> {
  /** The layout every row in the run takes unless it states its own. */
  layout?: MessageLayout | undefined;
  render?: RenderProp;
}

export interface MessagePartProps extends ComponentPropsWithRef<'div'> {
  render?: RenderProp;
}

export interface MessageSpanProps extends ComponentPropsWithRef<'span'> {
  render?: RenderProp;
}

export interface BubbleStreamProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** The whole reply received so far. Text that extends it enters word by word. */
  text: string;
  /** Let arrivals enter. Falls back to whether the row is `streaming`. */
  animate?: boolean | undefined;
  render?: RenderProp;
}

export interface MessageTimeProps extends ComponentPropsWithRef<'time'> {
  render?: RenderProp;
}

export interface MessageReceiptProps extends ComponentPropsWithRef<'span'> {
  /** Falls back to the row's status. */
  status?: Exclude<MessageStatus, 'streaming'> | undefined;
  render?: RenderProp;
}

export interface MessageActivityStepProps extends ComponentPropsWithRef<'div'> {
  status?: MessageActivityStepStatus | undefined;
  render?: RenderProp;
}

export interface MessageVersionsProps extends ComponentPropsWithRef<'div'> {
  render?: RenderProp;
}

export interface BubbleContextValue {
  contentId: string;
  clamped: boolean;
  revealed: boolean;
  overflowing: boolean;
  setOverflowing: (value: boolean) => void;
  requestRevealed: (next: boolean, reason: MessageChangeReason, source: SyntheticEvent) => void;
  variant: BubbleVariant;
}

export interface BubbleProps extends ComponentPropsWithRef<'div'> {
  /** The painting. Falls back to the row (`end` is `solid`, `thread` is `plain`), then the provider, then `soft`. */
  variant?: BubbleVariant | undefined;
  /** Falls back to the row (`end` is `accent`), then the provider, then `secondary`. */
  tone?: BubbleTone | undefined;
  /** Lines shown before the text is clamped behind a “show more” control. */
  maxLines?: number | undefined;
  revealed?: boolean | undefined;
  defaultRevealed?: boolean | undefined;
  onRevealedChange?: ((revealed: boolean, request: ChangeRequest<boolean>) => void) | undefined;
  render?: RenderProp;
}

export interface BubbleContentProps extends ComponentPropsWithRef<'div'> {
  /** Makes the surface itself a `button` or an `a`: `render={(props) => <button type="button" {...props} />}`. */
  render?: RenderProp;
}

export interface BubbleQuoteProps extends ComponentPropsWithRef<'div'> {
  /** The quoted message's author, set over its words. */
  author?: ReactNode | undefined;
  /** Makes the quote a button that asks the page to scroll to the quoted message. */
  onJump?: ((event: SyntheticEvent) => void) | undefined;
  render?: RenderProp;
}

/** The accessible name is the `typing` message; a consumer's `aria-label` wins. */
export type BubbleTypingProps = ComponentPropsWithRef<'span'>;

export interface BubbleRetryProps extends ComponentPropsWithRef<'button'> {
  render?: RenderProp;
}

export interface BubbleReactionProps extends ComponentPropsWithRef<'button'> {
  pressed?: boolean | undefined;
  defaultPressed?: boolean | undefined;
  onPressedChange?: ((pressed: boolean, request: ChangeRequest<boolean>) => void) | undefined;
  /** The count the consumer's store holds. */
  count?: number | undefined;
}
