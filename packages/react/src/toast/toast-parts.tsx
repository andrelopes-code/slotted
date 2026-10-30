import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import { createPresence } from '@slotted/core/presence';
import type { PresenceStatus } from '@slotted/core/presence';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';

import { Glyph, Icon } from '../icon';
import { Loader } from '../progress-indicator';
import type { GlyphName } from '../icon';
import { useToastRegion } from './toast';
import type {
  ToastCloseProps,
  ToastDescriptionProps,
  ToastIconProps,
  ToastPartProps,
  ToastPartRenderProps,
  ToastProps,
  ToastTone,
} from './toast.types';

/**
 * The glyph each tone draws: `specs/components/toast/contract.json` holds the
 * map, and the binding draws it because a stylesheet paints no icon.
 * `secondary` draws none: a neutral message has no severity to state.
 */
const TONE_GLYPH: Record<ToastTone, GlyphName | null> = {
  accent: 'status-info',
  secondary: null,
  info: 'status-info',
  success: 'status-success',
  warning: 'status-warning',
  danger: 'status-danger',
};

/**
 * What the mark needs from the message it sits in, so a `ToastIcon` the page
 * composes itself draws the same glyph as the family's own arrangement.
 */
const ToastItemContext = createContext<{ tone: ToastTone; loading: boolean }>({
  tone: 'accent',
  loading: false,
});

/**
 * How long a message stays in the document after it has left the queue.
 *
 * `packages/core/src/presence` reads the exit the stylesheet declares and
 * completes it on a timer when the browser never reports it — a backgrounded
 * tab, a `display: none` ancestor, a stylesheet that was swapped out. Ark
 * guesses two hundred milliseconds instead, and a message caught by any of
 * those three cases stays in the document for the life of the page.
 */
function useLeaving(open: boolean, onGone: () => void) {
  const [status, setStatus] = useState<PresenceStatus>(open ? 'entering' : 'unmounted');
  const [node, setNode] = useState<HTMLElement | null>(null);
  const gone = useRef(onGone);
  gone.current = onGone;

  const [presence] = useState(() =>
    createPresence({
      initialPresent: open,
      /* A message that mounts already open still animates: it is arriving. */
      skipInitialAnimation: false,
      onStatusChange: setStatus,
      onExitComplete: () => gone.current(),
    }),
  );

  useEffect(() => {
    presence.setNode(node);
  }, [presence, node]);

  useEffect(() => {
    presence.request(open, 'programmatic');
  }, [presence, open]);

  /* Stopped, not destroyed: StrictMode mounts again on the same handle. */
  useEffect(() => () => presence.stop(), [presence]);

  return { open: status === 'open', ref: setNode };
}

/** Which way a message is dragged away, given the edge its region sits at. */
function swipeAxis(placement: string | undefined, direction: string) {
  const block = placement?.startsWith('top') ? -1 : 1;
  const rtl = direction === 'rtl';
  const inline = placement?.endsWith('-start')
    ? rtl
      ? 1
      : -1
    : placement?.endsWith('-end')
      ? rtl
        ? -1
        : 1
      : 0;
  return { block, inline };
}

/**
 * One message.
 *
 * It renders the family's own anatomy from what the call carried. A page that
 * wants another arrangement passes a function to `ToastRegion` and composes
 * the parts below itself; everything here — the timer, the swipe, the exit,
 * the keyboard — is the same either way, because all of it is the region's and
 * the store's rather than this component's.
 */
export function Toast({ children, index = 0, message, ref, ...nativeProps }: ToastProps) {
  const region = useToastRegion();
  const content = message.data ?? {};

  const { open, ref: setNode } = useLeaving(message.status !== 'closing', () =>
    region.store.remove(message.id),
  );

  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);

  const tone = content.tone ?? region.defaults.tone;
  const variant = content.variant ?? region.defaults.variant;
  const dismissible = content.dismissible ?? region.defaults.dismissible;
  const progress = (content.progress ?? region.defaults.progress) && message.duration > 0;
  const item = useMemo(() => ({ tone, loading: message.loading }), [tone, message.loading]);

  function endDrag(element: HTMLElement, pointerId: number, distance: number) {
    drag.current = null;
    setDragging(false);
    setOffset(null);
    if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
    /* Past the threshold the gesture was a dismissal; short of it the message
       springs back, which is the only way a reader can change their mind. */
    if (distance >= region.swipeThreshold) region.store.dismiss(message.id, 'pointer');
  }

  /**
   * The three values the stylesheet cannot work out for itself: where this
   * message is in the pile, how long it was given, and how far the pointer has
   * taken it. They are runtime properties rather than tokens, and
   * `packages/styles/src/runtime-properties.mjs` says why.
   */
  const style = {
    ...(nativeProps.style ?? {}),
    '--slotted-toast-index': index,
    ...(message.duration > 0 ? { '--slotted-toast-duration': `${message.duration}ms` } : {}),
    ...(offset === null
      ? {}
      : { '--slotted-toast-swipe-x': `${offset.x}px`, '--slotted-toast-swipe-y': `${offset.y}px` }),
  } as CSSProperties;

  return (
    <li
      {...withSelectorKey(nativeProps, 'part', 'item')}

      data-tone={tone}
      data-variant={variant}
      {...(open ? { 'data-open': '' } : {})}
      {...(message.loading ? { 'data-loading': '' } : {})}
      {...(dragging ? { 'data-dragging': '' } : {})}
      onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
        nativeProps.onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== 'Escape') return;
        /* Only the message the keyboard is in, and only from the message
           itself: a page whose dialog is open must keep its own Escape. */
        event.stopPropagation();
        region.store.dismiss(message.id, 'escape');
      }}
      onPointerDown={(event: PointerEvent<HTMLLIElement>) => {
        nativeProps.onPointerDown?.(event);
        if (!region.swipe || event.button !== 0) return;
        /* A control inside the message is what the pointer came for. */
        if ((event.target as HTMLElement).closest('button, a, input, select, textarea')) return;
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event: PointerEvent<HTMLLIElement>) => {
        nativeProps.onPointerMove?.(event);
        const start = drag.current;
        if (!start || start.id !== event.pointerId) return;

        const element = event.currentTarget;
        const view = element.ownerDocument.defaultView;
        const axis = swipeAxis(
          region.placement,
          view?.getComputedStyle(element).direction ?? 'ltr',
        );
        /* Only movement toward the edge the region sits at counts. Dragging a
           message into the page is not a gesture, it is a slip. */
        const x = axis.inline === 0 ? 0 : Math.max(0, (event.clientX - start.x) * axis.inline);
        const y = Math.max(0, (event.clientY - start.y) * axis.block);
        const moved = Math.max(x, y);
        if (!dragging && moved < 2) return;

        setDragging(true);
        setOffset({ x: x * axis.inline, y: y * axis.block });
      }}
      onPointerUp={(event: PointerEvent<HTMLLIElement>) => {
        nativeProps.onPointerUp?.(event);
        if (!drag.current || drag.current.id !== event.pointerId) return;
        const moved = offset === null ? 0 : Math.max(Math.abs(offset.x), Math.abs(offset.y));
        endDrag(event.currentTarget, event.pointerId, moved);
      }}
      onPointerCancel={(event: PointerEvent<HTMLLIElement>) => {
        nativeProps.onPointerCancel?.(event);
        if (!drag.current || drag.current.id !== event.pointerId) return;
        endDrag(event.currentTarget, event.pointerId, 0);
      }}
      ref={(element: HTMLLIElement | null) => {
        setNode(element);
        if (typeof ref === 'function') ref(element as HTMLLIElement & null);
        else if (ref) ref.current = element as HTMLLIElement & null;
      }}
      style={style}
      tabIndex={nativeProps.tabIndex ?? -1}
    >
      <ToastItemContext.Provider value={item}>
        {children ?? content.render?.(message) ?? (
          <>
            {content.hideIcon ? null : <ToastIcon>{content.icon}</ToastIcon>}
            <ToastContent>
              {content.title === undefined ? null : <ToastTitle>{content.title}</ToastTitle>}
              {content.description === undefined ? null : (
                <ToastDescription>{content.description}</ToastDescription>
              )}
            </ToastContent>
            {dismissible ? (
              <ToastClose
                aria-label={region.t('close')}
                onClick={() => region.store.dismiss(message.id, 'dismiss')}
              />
            ) : null}
            {content.actions === undefined ? null : <ToastActions>{content.actions}</ToastActions>}
            {progress ? <ToastProgress /> : null}
          </>
        )}
      </ToastItemContext.Provider>
    </li>
  );
}

/**
 * The tone's mark, or the page's own. While a promise is in flight it is
 * `progress-indicator`'s contained loader: the loader belongs to that family,
 * and the stylesheet sizes it to the mark and paints it in the mark's ink, so
 * the disc that waits and the disc that answers are one silhouette. A tone with
 * no mark and no mark of the page's draws no part at all, and the words start
 * at the message's own inset.
 */
export function ToastIcon({ children, render, ...nativeProps }: ToastIconProps) {
  const item = useContext(ToastItemContext);
  const glyph = TONE_GLYPH[item.tone];
  const mark =
    children ??
    (item.loading ? (
      <Loader contained decorative delay={0} minDuration={0} tone={item.tone} />
    ) : glyph === null ? null : (
      <Icon>
        <Glyph name={glyph} solid />
      </Icon>
    ));
  if (mark === null) return null;

  const partProps = keyedProps({
    ...nativeProps,
    'aria-hidden': true,
    children: mark,
    'data-part': 'icon',
  } as const);

  return render === undefined ? <span {...partProps} /> : render(partProps);
}

/** The words, and the one column that is allowed to shrink. */
export function ToastContent({ children, render, ...nativeProps }: ToastPartRenderProps) {
  const partProps: ToastPartProps = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'content',
  });

  return render === undefined ? <div {...partProps} /> : render(partProps);
}

/**
 * The message's name. A `div` rather than a heading: a message that is gone in
 * five seconds is not a section of the document, and a page that puts one in
 * its outline has told a reader it can be navigated back to.
 */
export function ToastTitle({ children, render, ...nativeProps }: ToastPartRenderProps) {
  const partProps: ToastPartProps = keyedProps({ ...nativeProps, children, 'data-part': 'title' });

  return render === undefined ? <div {...partProps} /> : render(partProps);
}

/** The message. A `p`, because that is what a sentence of prose is. */
export function ToastDescription({ children, render, ...nativeProps }: ToastDescriptionProps) {
  const partProps = keyedProps({ ...nativeProps, children, 'data-part': 'description' } as const);

  return render === undefined ? <p {...partProps} /> : render(partProps);
}

/**
 * The controls that act on the message. What goes in is the consumer's own
 * `Button`s: `button` already owns what a button is, and naming one of two
 * controls `cancel` would privilege one arrangement over every other.
 */
export function ToastActions({ children, render, ...nativeProps }: ToastPartRenderProps) {
  const partProps: ToastPartProps = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'actions',
  });

  return render === undefined ? <div {...partProps} /> : render(partProps);
}

/** The control that puts the message away. A real button with a real name. */
export function ToastClose({ children, render, ...nativeProps }: ToastCloseProps) {
  const partProps = keyedProps({
    type: 'button' as const,
    ...nativeProps,
    /* The cross is drawn unless the consumer wrote content of their own. */
    children: children ?? (
      <Icon>
        <Glyph name="x" />
      </Icon>
    ),
    'data-part': 'close',
  });

  return render === undefined ? <button {...partProps} /> : render(partProps);
}

/**
 * How much of the duration is left. It reads the same number the timer does,
 * and the same play state, so the picture and the clock cannot disagree.
 */
export function ToastProgress({ render, ...nativeProps }: ToastPartRenderProps) {
  const partProps: ToastPartProps = keyedProps({
    ...nativeProps,
    'aria-hidden': true,
    'data-part': 'progress',
  });

  return render === undefined ? <div {...partProps} /> : render(partProps);
}
