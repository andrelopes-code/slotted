import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/message-scroller/message-scroller.css';

import { messageScrollerMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createMessageScroller } from '@slotted/core/message-scroller';
import type { MessageScrollerHandle as EngineHandle } from '@slotted/core/message-scroller';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { MouseEvent } from 'react';

import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { useMessageScrollerDefaults } from './message-scroller-defaults';
import type {
  MessageScrollerContextValue,
  MessageScrollerHandle,
  MessageScrollerItemProps,
  MessageScrollerJumpProps,
  MessageScrollerPartProps,
  MessageScrollerProps,
  MessageScrollerRootProps,
  MessageScrollerSeparatorProps,
} from './message-scroller.types';
import { SPINNER_RING } from '../button/spinner-ring';

const Context = createContext<MessageScrollerContextValue | null>(null);

/**
 * The scroller around a control: its commands and its state. A control
 * outside the frame — a header chip, a turn navigator in a footer — reaches
 * the same commands through the scroller's `ref`.
 */
export function useMessageScroller(): MessageScrollerContextValue {
  const context = useContext(Context);
  if (context === null)
    throw new Error('A MessageScroller part is rendered outside a MessageScroller.');
  return context;
}

function assignRef<T>(ref: unknown, value: T | null) {
  if (typeof ref === 'function') (ref as (value: T | null) => void)(value);
  else if (ref != null) (ref as { current: T | null }).current = value;
}

/**
 * The region a conversation scrolls in. It fills a parent whose height is
 * bounded; the viewport inside it scrolls and the jump control stands over
 * it.
 *
 * The behaviour is `@slotted/core/message-scroller`: where a saved
 * conversation opens (`defaultPosition`), whether new words pull the view
 * (`follow`), where a turn the reader sends stands (`anchor` on the item,
 * `peek`, `scrollMargin`), older rows arriving above without moving the
 * reader, and jumps (`ref.current.scrollToMessage`). The engine writes the
 * scroll state on the DOM itself, so scrolling and streaming re-render no row.
 */
export function MessageScroller({
  busy = false,
  children,
  defaultPosition,
  edgeThreshold,
  follow,
  messages,
  onAnchorChange,
  onReachStart,
  onScrollableChange,
  peek,
  preserveOnPrepend,
  ref,
  render,
  scrollMargin,
  ...nativeProps
}: MessageScrollerProps) {
  const defaults = useMessageScrollerDefaults();
  const t = useMessages(messageScrollerMessages, messages);
  const resolvedPosition = defaultPosition ?? defaults.defaultPosition;
  const callbacks = useRef({ onAnchorChange, onReachStart, onScrollableChange });
  callbacks.current = { onAnchorChange, onReachStart, onScrollableChange };

  const [engine] = useState<EngineHandle>(() =>
    createMessageScroller({
      defaultPosition: resolvedPosition,
      onAnchorChange: (id, reason) => callbacks.current.onAnchorChange?.(id, reason),
      onReachStart: (reason) => callbacks.current.onReachStart?.(reason),
      onScrollableChange: (edges) => callbacks.current.onScrollableChange?.(edges),
    }),
  );

  useEffect(() => {
    engine.update({
      edgeThreshold,
      follow: follow ?? defaults.follow,
      peek: peek ?? defaults.peek,
      preserveOnPrepend,
      scrollMargin: scrollMargin ?? defaults.scrollMargin,
    });
  }, [
    defaults.follow,
    defaults.peek,
    defaults.scrollMargin,
    edgeThreshold,
    engine,
    follow,
    peek,
    preserveOnPrepend,
    scrollMargin,
  ]);

  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [viewport, setViewport] = useState<HTMLElement | null>(null);
  const [content, setContent] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (viewport === null || content === null) return undefined;
    return engine.connect({ content, root, viewport });
  }, [content, engine, root, viewport]);

  const state = useSyncExternalStore(engine.subscribe, engine.getState, engine.getState);

  /* A streaming reply is announced once when it starts and once when it ends, never word by word. */
  const wasBusy = useRef(busy);
  useEffect(() => {
    if (wasBusy.current === busy) return;
    wasBusy.current = busy;
    getLiveAnnouncer().announce(busy ? t('busy') : t('idle'));
  }, [busy, t]);

  useImperativeHandle<MessageScrollerHandle, MessageScrollerHandle>(
    ref as never,
    () => ({
      focus: () => viewport?.focus(),
      get root() {
        return root;
      },
      scrollToEnd: (options) => engine.scrollToEnd(options),
      scrollToMessage: (id, options) => engine.scrollToMessage(id, options),
      scrollToStart: (options) => engine.scrollToStart(options),
    }),
    [engine, root, viewport],
  );

  const context: MessageScrollerContextValue = {
    busy,
    defaultPosition: resolvedPosition,
    registerContent: setContent,
    registerViewport: setViewport,
    scrollToEnd: engine.scrollToEnd,
    scrollToMessage: engine.scrollToMessage,
    scrollToStart: engine.scrollToStart,
    state,
    t,
  };

  const rootProps = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'root',
    'data-ui': 'message-scroller',
    ref: setRoot,
  }) as MessageScrollerRootProps;

  return (
    <Context.Provider value={context}>
      {render === undefined ? <div {...rootProps} /> : render(rootProps)}
    </Context.Provider>
  );
}

/**
 * The element that scrolls: a labelled region that takes focus, so the
 * keyboard scrolls it. It is hidden, laid out, until the opening position is
 * applied, so a conversation opened at its end never shows its oldest rows
 * first.
 */
export function MessageScrollerViewport({ ref, render, ...nativeProps }: MessageScrollerPartProps) {
  const scroller = useMessageScroller();
  const { registerViewport } = scroller;
  const attach = useCallback(
    (node: HTMLElement | null) => {
      registerViewport(node);
      assignRef(ref, node);
    },
    [ref, registerViewport],
  );
  const rootProps = keyedProps({
    'aria-label': scroller.t('label'),
    role: 'region',
    tabIndex: 0,
    ...nativeProps,
    'data-part': 'viewport',
    ...(scroller.defaultPosition === 'start' ? {} : { 'data-pending': '' }),
    ref: attach,
  }) as MessageScrollerRootProps;
  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * The rows: a WAI-ARIA `log`, so a row that arrives is read and a row that
 * grows is not; `busy` holds even the arrival back until a reply is whole.
 */
export function MessageScrollerContent({ ref, render, ...nativeProps }: MessageScrollerPartProps) {
  const scroller = useMessageScroller();
  const { registerContent } = scroller;
  const attach = useCallback(
    (node: HTMLElement | null) => {
      registerContent(node);
      assignRef(ref, node);
    },
    [ref, registerContent],
  );
  const rootProps = keyedProps({
    'aria-relevant': 'additions',
    role: 'log',
    ...(scroller.busy ? { 'aria-busy': true } : {}),
    ...nativeProps,
    'data-part': 'content',
    ref: attach,
  }) as MessageScrollerRootProps;
  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/** One row — a message, a separator, a line the system writes. */
export function MessageScrollerItem({
  anchor,
  messageId,
  render,
  ...nativeProps
}: MessageScrollerItemProps) {
  const rootProps: MessageScrollerRootProps = keyedProps({
    ...nativeProps,
    ...(anchor ? { 'data-anchor': 'true' } : {}),
    ...(messageId === undefined ? {} : { 'data-message-id': messageId }),
    'data-part': 'item',
  });
  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/** A day, or a line the system writes, between two rules; `sticky` keeps it at the top while its rows are in view. */
export function MessageScrollerSeparator({
  children,
  render,
  sticky,
  ...nativeProps
}: MessageScrollerSeparatorProps) {
  const rootProps: MessageScrollerRootProps = keyedProps({
    ...nativeProps,
    children: <span>{children}</span>,
    'data-part': 'separator',
    ...(sticky ? { 'data-sticky': '' } : {}),
  });
  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/** The line above the first message the reader has not seen. */
export function MessageScrollerUnread({
  children,
  render,
  ...nativeProps
}: MessageScrollerPartProps) {
  const { t } = useMessageScroller();
  const rootProps: MessageScrollerRootProps = keyedProps({
    ...nativeProps,
    children: <span>{children ?? t('unread')}</span>,
    'data-part': 'unread',
  });
  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/** Older rows on their way: the shared ring and a line of text, read once as a status. */
export function MessageScrollerLoader({
  children,
  render,
  ...nativeProps
}: MessageScrollerPartProps) {
  const { t } = useMessageScroller();
  const rootProps: MessageScrollerRootProps = keyedProps({
    role: 'status',
    ...nativeProps,
    children: (
      <>
        <span aria-hidden="true" data-ui="spinner" data-ui-spinner="">
          {SPINNER_RING}
        </span>
        <span>{children ?? t('loader')}</span>
      </>
    ),
    'data-part': 'loader',
  });
  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * The control that takes the reader to the latest row — or, with
 * `direction="start"`, to the first. With nowhere to go it is inert and out
 * of the tab order; when rows arrived out of view it says how many, in its
 * name and on its face.
 */
export function MessageScrollerJump({
  'aria-label': ariaLabel,
  behavior = 'smooth',
  children,
  direction = 'end',
  onClick,
  ...nativeProps
}: MessageScrollerJumpProps) {
  const scroller = useMessageScroller();
  const { state, t } = scroller;
  const active = direction === 'end' ? state.scrollable.end : state.scrollable.start;
  const count = direction === 'end' ? state.newCount : 0;
  const words = count > 0 ? t('jumpCount', { count }) : null;
  const name =
    direction === 'start'
      ? t('jumpToStart')
      : count > 0
        ? t('jumpToEndCount', { count })
        : t('jumpToEnd');

  return (
    <button
      aria-label={ariaLabel ?? name}
      type="button"
      {...withSelectorKey(nativeProps, 'part', 'jump')}
      data-active={String(active)}
      data-direction={direction}

      inert={!active}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (direction === 'end') scroller.scrollToEnd({ behavior });
        else scroller.scrollToStart({ behavior });
      }}
      tabIndex={active ? 0 : -1}
    >
      {children ?? (
        <>
          <Icon>
            <Glyph name="arrow-left" />
          </Icon>
          {words === null ? null : (
            <span data-part="jump-count" data-part-jump-count="">
              {words}
            </span>
          )}
        </>
      )}
    </button>
  );
}
