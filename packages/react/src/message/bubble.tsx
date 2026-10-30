import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import { createControllable } from '@slotted/core/state';
import {
  advanceStream,
  initialStream,
  prefersReducedMotion,
  settleStream,
} from '@slotted/core/text-stream';
import type { StreamState } from '@slotted/core/text-stream';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, MouseEvent, Ref, SyntheticEvent } from 'react';

import { Glyph, Icon } from '../icon';
import { BubbleContext, BubbleMetaContext, useBubble } from './bubble-context';
import { useMessageDefaults } from './message-defaults';
import { reasonOf, useMessageWords, useOptionalMessage } from './message';
import type {
  BubbleContentProps,
  BubbleContextValue,
  BubbleProps,
  BubbleQuoteProps,
  BubbleReactionProps,
  BubbleRetryProps,
  BubbleStreamProps,
  BubbleTypingProps,
  MessageChangeReason,
  MessagePartProps,
  MessageRootProps,
  MessageSpanProps,
} from './message.types';

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref != null) (ref as { current: T | null }).current = value;
}

/**
 * The surface a message's words are painted on.
 *
 * **Painting.** `variant` (`solid`, `soft`, `outline`, `plain`) × `tone` (the
 * five tones). A bubble that states neither takes it from its row — the
 * reader's own message is the accent's fill, a thread paints no box — then
 * from the provider. The result is written as `data-variant` and
 * `data-tone`, so the DOM always states the painting.
 *
 * **Clamp.** With `maxLines`, a longer text shows its first lines and a
 * “show more” control under the surface, drawn only while the text overflows;
 * the whole text stays in the DOM. Shown whole is `revealed` /
 * `defaultRevealed` / `onRevealedChange`.
 */
export function Bubble({
  children,
  defaultRevealed = false,
  maxLines,
  onRevealedChange,
  render,
  revealed,
  style,
  tone,
  variant,
  ...nativeProps
}: BubbleProps) {
  const defaults = useMessageDefaults();
  const message = useOptionalMessage();
  const t = useMessageWords();
  const contentId = useId();
  const [ownRevealed, setOwnRevealed] = useState(defaultRevealed);
  const [overflowing, setOverflowing] = useState(false);
  const shown = revealed ?? ownRevealed;
  const clamped = maxLines !== undefined;

  const inferredVariant =
    message?.layout === 'thread' ? 'plain' : message?.align === 'end' ? 'solid' : undefined;
  const inferredTone =
    message?.align === 'end' && message.layout !== 'thread' ? 'accent' : undefined;
  const resolvedVariant = variant ?? inferredVariant ?? defaults.variant;
  const resolvedTone = tone ?? inferredTone ?? defaults.tone;

  const requestRevealed = useCallback(
    (next: boolean, reason: MessageChangeReason, source: SyntheticEvent) => {
      const state = createControllable<boolean>({
        controlled: revealed,
        initial: shown,
        onRequest: (request) => onRevealedChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnRevealed(next);
    },
    [onRevealedChange, revealed, shown],
  );

  const context: BubbleContextValue = {
    clamped,
    contentId,
    overflowing,
    requestRevealed,
    revealed: shown,
    setOverflowing,
    variant: resolvedVariant,
  };

  const more =
    clamped && (overflowing || shown) ? (
      <button
        aria-controls={contentId}
        aria-expanded={shown}
        data-part="more"
        data-part-more=""
        onClick={(event: MouseEvent<HTMLButtonElement>) =>
          requestRevealed(!shown, reasonOf(event), event)
        }
        type="button"
      >
        {shown ? t('less') : t('more')}
        <Icon>
          <Glyph name="chevron-down" />
        </Icon>
      </button>
    ) : null;

  const rootProps: MessageRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {children}
        {more}
      </>
    ),
    ...(clamped ? { 'data-clamped': '' } : {}),
    'data-part': 'bubble',
    ...(shown && clamped ? { 'data-revealed': '' } : {}),
    'data-tone': resolvedTone,
    'data-ui': 'message',
    'data-variant': resolvedVariant,
    style: clamped
      ? ({ ...style, '--slotted-message-max-lines': maxLines } as CSSProperties)
      : style,
  });

  return (
    <BubbleContext.Provider value={context}>
      {render === undefined ? <div {...rootProps} /> : render(rootProps)}
    </BubbleContext.Provider>
  );
}

/**
 * The painted surface itself. `render` makes it a `button` — a quick reply —
 * or an `a` — a way out of the thread — and it keeps the painting, the hover,
 * the press and the focus ring. Inside a clamped bubble it measures whether
 * its text overflows, which is what draws “show more”.
 */
export function BubbleContent({ id, ref, render, ...nativeProps }: BubbleContentProps) {
  const bubble = useBubble();
  const { clamped, revealed, setOverflowing } = bubble;
  const node = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = node.current;
    if (!clamped || element === null || revealed) return undefined;
    const measure = () => setOverflowing(element.scrollHeight > element.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [clamped, revealed, setOverflowing]);

  const attach = useCallback(
    (element: HTMLElement | null) => {
      node.current = element;
      assignRef(ref as Ref<HTMLElement> | undefined, element);
    },
    [ref],
  );

  const rootProps = keyedProps({
    ...nativeProps,
    'data-part': 'content',
    id: id ?? bubble.contentId,
    ref: attach,
  }) as MessageRootProps;

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * The hour and the delivery mark, riding at the end of the last line inside
 * the surface. Put `MessageTime` and `MessageReceipt` in it; the receipt draws
 * its mark here and keeps its word for assistive technology.
 */
export function BubbleMeta({ render, ...nativeProps }: MessageSpanProps) {
  const rootProps: MessageRootProps = keyedProps({ ...nativeProps, 'data-part': 'meta' });
  return (
    <BubbleMetaContext.Provider value={true}>
      {render === undefined ? <span {...rootProps} /> : render(rootProps)}
    </BubbleMetaContext.Provider>
  );
}

/**
 * The message a reply answers, at the head of the surface. With `onJump` it
 * is a button that asks the page to scroll to the quoted message — the
 * scroller's `scrollToMessage`.
 */
export function BubbleQuote({
  author,
  children,
  onJump,
  render,
  ...nativeProps
}: BubbleQuoteProps) {
  const body = (
    <>
      {author === undefined ? null : (
        <span data-part="quote-author" data-part-quote-author="">
          {author}
        </span>
      )}
      {children}
    </>
  );
  const rootProps: MessageRootProps = keyedProps({
    ...nativeProps,
    children: body,
    'data-part': 'quote',
  });
  if (render !== undefined) return render(rootProps);
  if (onJump !== undefined) {
    return (
      <button
        {...(rootProps as unknown as ButtonHTMLAttributes<HTMLButtonElement>)}
        onClick={(event) => onJump(event)}
        type="button"
      />
    );
  }
  return <div {...rootProps} />;
}

/**
 * The words of a streamed reply, entering as they arrive.
 *
 * `text` is everything received so far. What extends the previous text is
 * split into words by `@slotted/core/text-stream`; each word is in the DOM at
 * once and enters as a `stream-chunk` after a delay of at most 320 ms, so a
 * burst from the transport reads as a wave rather than a block. A chunk that
 * has entered is folded back into plain text. Text that does not extend the
 * previous — a regenerated reply — replaces it at once, and so does every
 * arrival under reduced motion.
 *
 * Arrivals animate while the row is `streaming`, and the arrival that ends
 * the stream with it; `animate` states it outright.
 */
export function BubbleStream({ text, animate, render, ...nativeProps }: BubbleStreamProps) {
  const message = useOptionalMessage();
  const streaming = animate ?? message?.status === 'streaming';
  const [current, setCurrent] = useState<{ stream: StreamState; streaming: boolean }>(() => ({
    stream: initialStream(text),
    streaming,
  }));
  /* Derived from the previous render, during render, so no frame paints the old text. */
  let { stream } = current;
  if (stream.text !== text || current.streaming !== streaming) {
    const view = typeof window === 'undefined' ? null : window;
    stream = advanceStream(stream, text, {
      animate: (streaming || current.streaming) && !prefersReducedMotion(view),
      now: typeof performance === 'undefined' ? 0 : performance.now(),
    });
    setCurrent({ stream, streaming });
  }
  const rootProps: MessageRootProps = keyedProps({
    ...nativeProps,
    'data-part': 'stream',
    children: (
      <>
        {stream.settled}
        {stream.chunks.map((chunk) => (
          <span
            data-part="stream-chunk"
            data-part-stream-chunk=""
            key={chunk.key}
            onAnimationEnd={() =>
              setCurrent((previous) => ({
                ...previous,
                stream: settleStream(previous.stream, chunk.key),
              }))
            }
            style={{ animationDelay: `${chunk.delay}ms` }}
          >
            {chunk.text}
          </span>
        ))}
      </>
    ),
  });
  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}

/** The caret at the end of the words that have arrived while a reply streams. */
export function BubbleCaret(props: MessageSpanProps) {
  const { render, ...nativeProps } = props;
  const rootProps: MessageRootProps = keyedProps({
    'aria-hidden': true,
    ...nativeProps,
    'data-part': 'caret',
  });
  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}

/** Three dots in the bubble of someone writing, named for assistive technology. */
export function BubbleTyping(props: BubbleTypingProps) {
  const t = useMessageWords();
  return (
    <span aria-label={t('typing')} role="img" {...withSelectorKey(props, 'part', 'typing')}>
      <span />
      <span />
      <span />
    </span>
  );
}

/**
 * The round control beside a message that did not go, which sends it again.
 * It asks the row's `onRetry` with the reason, after the consumer's own
 * `onClick`.
 */
export function BubbleRetry({ children, onClick, render, ...nativeProps }: BubbleRetryProps) {
  const message = useOptionalMessage();
  const t = useMessageWords();
  const rootProps = keyedProps({
    'aria-label': t('retry'),
    type: 'button',
    ...nativeProps,
    children: children ?? (
      <Icon>
        <Glyph name="rotate-ccw" />
      </Icon>
    ),
    'data-part': 'retry',
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      message?.onRetry?.({ reason: reasonOf(event), source: event });
    },
  }) as MessageRootProps;
  return render === undefined ? (
    <button {...(rootProps as ButtonHTMLAttributes<HTMLButtonElement>)} />
  ) : (
    render(rootProps)
  );
}

/** The row of reactions straddling the surface's lower edge; in a thread, a row under the words. */
export function BubbleReactions({ render, ...nativeProps }: MessagePartProps) {
  const t = useMessageWords();
  const rootProps: MessageRootProps = keyedProps({
    'aria-label': t('reactions'),
    role: 'group',
    ...nativeProps,
    'data-part': 'reactions',
  });
  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * One reaction: the emoji or mark the consumer writes, and its count. The
 * reader's own reaction is `pressed` / `defaultPressed` / `onPressedChange`;
 * the count is the consumer's store's.
 */
export function BubbleReaction({
  children,
  count,
  defaultPressed = false,
  disabled,
  onClick,
  onPressedChange,
  pressed,
  ...nativeProps
}: BubbleReactionProps) {
  const [own, setOwn] = useState(defaultPressed);
  const current = pressed ?? own;

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const state = createControllable<boolean>({
      controlled: pressed,
      initial: current,
      onRequest: (request) => onPressedChange?.(request.value, request),
    });
    if (state.request(!current, reasonOf(event), event)) setOwn(!current);
  };

  return (
    <button
      aria-pressed={current}
      type="button"
      {...withSelectorKey(nativeProps, 'part', 'reaction')}

      {...(current ? { 'data-pressed': '' } : {})}
      {...(disabled ? { 'data-disabled': '' } : {})}
      disabled={disabled}
      onClick={toggle}
    >
      {children}
      {count === undefined ? null : (
        <span data-part="reaction-count" data-part-reaction-count="">
          {count}
        </span>
      )}
    </button>
  );
}
