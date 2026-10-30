import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/message/message.css';

import { type FamilyTranslator, type MessageMessages, messageMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import { createContext, useCallback, useContext, useId, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';

import { useMessages } from '../i18n';
import { useMessageDefaults } from './message-defaults';
import type {
  MessageChangeReason,
  MessageContextValue,
  MessageGroupProps,
  MessageLayout,
  MessageProps,
  MessageRootProps,
} from './message.types';

const GroupContext = createContext<{ layout: MessageLayout | undefined } | null>(null);
export const MessageContext = createContext<MessageContextValue | null>(null);

/** What the row around a part knows. A part outside a row is a mistake the page can see at once. */
export function useMessage(): MessageContextValue {
  const context = useContext(MessageContext);
  if (context === null) throw new Error('A Message part is rendered outside a Message.');
  return context;
}

/** The row around a bubble, when there is one: a bubble stands alone as well. */
export function useOptionalMessage(): MessageContextValue | null {
  return useContext(MessageContext);
}

/**
 * The family's words: the row's, with its `messages` laid over the language
 * in force, or the language alone for a bubble that stands outside a row.
 */
export function useMessageWords(): FamilyTranslator<MessageMessages> {
  const own = useMessages(messageMessages);
  return useContext(MessageContext)?.t ?? own;
}

/** Whether a click came from the keyboard: a synthetic click from Enter or Space has no detail. */
export function reasonOf(event: SyntheticEvent): MessageChangeReason {
  return (event.nativeEvent as MouseEvent).detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * A run of messages from one sender. The rows inside it stand two pixels
 * apart, the corners that face each other on the sender's side are drawn in,
 * and a row with no avatar still stands on the column the avatar of the run
 * holds — read from the DOM by the stylesheet, so no row states its place in
 * the run.
 */
export function MessageGroup({ layout, render, ...nativeProps }: MessageGroupProps) {
  const rootProps: MessageRootProps = keyedProps({
    ...nativeProps,
    'data-part': 'group',
    'data-ui': 'message',
  });
  const value = useMemo(() => ({ layout }), [layout]);
  return (
    <GroupContext.Provider value={value}>
      {render === undefined ? <div {...rootProps} /> : render(rootProps)}
    </GroupContext.Provider>
  );
}

/**
 * One message of a conversation: an `article`, named by its author, holding
 * the avatar, the words and what is said about them.
 *
 * **The side is asked once, here.** A bubble inside the row follows `align`
 * and, when it states no painting, takes the reader's own for `end` — the
 * accent's fill — and none for a thread.
 *
 * **The status is a fact about delivery.** `sending` and `streaming` are
 * `aria-busy` and `data-loading`, `failed` is `data-invalid`, `read` is
 * `data-read`; the receipt inside a bubble's meta, or in the footer, says it
 * in a mark and a word.
 *
 * **Versions.** With `versionCount` of two or more, `MessageVersions` pages
 * between them; the version on screen is `version` / `defaultVersion` /
 * `onVersionChange`, and what each version says is the consumer's.
 */
export function Message({
  actionsVisibility,
  align = 'start',
  defaultVersion = 0,
  layout,
  messages,
  onRetry,
  onVersionChange,
  render,
  status,
  version,
  versionCount = 1,
  ...nativeProps
}: MessageProps) {
  const defaults = useMessageDefaults();
  const t = useMessages(messageMessages, messages);
  const group = useContext(GroupContext);
  const authorId = useId();
  const [authorPresent, setAuthorPresent] = useState(false);
  const [ownVersion, setOwnVersion] = useState(defaultVersion);
  const currentVersion = version ?? ownVersion;

  const resolvedLayout = layout ?? group?.layout ?? defaults.layout;
  const resolvedActions = actionsVisibility ?? defaults.actionsVisibility;
  const busy = status === 'sending' || status === 'streaming';

  const requestVersion = useCallback(
    (next: number, reason: MessageChangeReason, source: SyntheticEvent) => {
      const bounded = Math.min(Math.max(0, next), Math.max(0, versionCount - 1));
      const state = createControllable<number>({
        controlled: version,
        initial: currentVersion,
        onRequest: (request) => onVersionChange?.(request.value, request),
      });
      if (state.request(bounded, reason, source)) setOwnVersion(bounded);
    },
    [currentVersion, onVersionChange, version, versionCount],
  );

  const registerAuthor = useCallback((present: boolean) => setAuthorPresent(present), []);

  const context: MessageContextValue = {
    align,
    authorId,
    layout: resolvedLayout,
    onRetry,
    registerAuthor,
    requestVersion,
    status,
    t,
    version: currentVersion,
    versionCount,
  };

  const rootProps: MessageRootProps = keyedProps({
    /* The author names the article unless the consumer named it: `aria-labelledby` would outrank their `aria-label`. */
    ...(authorPresent && nativeProps['aria-label'] === undefined
      ? { 'aria-labelledby': authorId }
      : {}),
    ...(busy ? { 'aria-busy': true } : {}),
    ...nativeProps,
    'data-actions': resolvedActions,
    'data-align': align,
    'data-layout': resolvedLayout,
    ...(busy ? { 'data-loading': '' } : {}),
    ...(status === 'failed' ? { 'data-invalid': '' } : {}),
    ...(status === 'read' ? { 'data-read': '' } : {}),
    'data-part': 'root',
    ...(status === undefined ? {} : { 'data-status': status }),
    'data-ui': 'message',
  });

  return (
    <MessageContext.Provider value={context}>
      {render === undefined ? <article {...rootProps} /> : render(rootProps)}
    </MessageContext.Provider>
  );
}
