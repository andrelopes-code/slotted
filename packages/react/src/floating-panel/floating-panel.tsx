import { clampPlace, cornerPlace, stepPlace } from '@slotted/core/floating-panel';
import type { FloatingPlace } from '@slotted/core/floating-panel';
import { floatingPanelMessages } from '@slotted/core/i18n';
import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/floating-panel/floating-panel.css';

import { createContext, useContext, useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';

import { useMessages } from '../i18n';
import type { FloatingPanelContextValue, FloatingPanelProps } from './floating-panel.types';

const FloatingPanelContext = createContext<FloatingPanelContextValue | undefined>(undefined);

/** What the panel hands its parts; a part outside a panel is a mistake. */
export function useFloatingPanel(): FloatingPanelContextValue {
  const context = useContext(FloatingPanelContext);
  if (context === undefined) throw new Error('A floating panel part is outside a FloatingPanel.');

  return context;
}

/**
 * A tool that stays over the page while the page stays usable: a calculator,
 * a notepad, a timer. It is non-modal by definition (no scrim, no focus trap,
 * no inert page) and a named region rather than a dialog, so the shortcuts an
 * application holds back while a dialog is open keep working. The reader moves
 * it by its handle, with the pointer or with the arrow keys on its grip, and
 * it stays whole inside the viewport; Escape inside it closes it and focus
 * returns to the element that held it before it opened.
 */
export function FloatingPanel({
  'aria-label': ariaLabel,
  children,
  defaultPlace = 'bottom-end',
  messages,
  onKeyDown,
  onOpenChange,
  onPlaceChange,
  open,
  place,
  style,
  ...nativeProps
}: FloatingPanelProps) {
  const t = useMessages(floatingPanelMessages, messages);
  const titleId = useId();
  const root = useRef<HTMLElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const drag = useRef<{ pointer: FloatingPlace; from: FloatingPlace } | null>(null);
  const [own, setOwn] = useState<FloatingPlace | null>(null);
  const [live, setLive] = useState<FloatingPlace | null>(null);

  const shown = live ?? place ?? own;

  /* The element that held focus is where focus returns on close. */
  useLayoutEffect(() => {
    if (!open) return;

    const active = document.activeElement;
    opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
  }, [open]);

  /* An uncontrolled panel opens in its corner, from its own size. */
  useLayoutEffect(() => {
    if (!open || place !== undefined || own !== null || root.current === null) return;

    const direction = getComputedStyle(root.current).direction === 'rtl' ? 'rtl' : 'ltr';
    setOwn(cornerPlace(defaultPlace, sizeOf(root.current), viewport(), 16, direction));
  }, [defaultPlace, open, own, place]);

  function clamped(next: FloatingPlace) {
    return root.current === null ? next : clampPlace(next, sizeOf(root.current), viewport());
  }

  function commit(next: FloatingPlace) {
    if (place === undefined) setOwn(next);
    onPlaceChange?.(next);
  }

  function close() {
    onOpenChange(false);
    opener.current?.focus();
  }

  function startDrag(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0 || shown === null) return;
    if ((event.target as Element).closest('[data-part="close"]') !== null) return;

    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    drag.current = { pointer: { x: event.clientX, y: event.clientY }, from: shown };

    const onMove = (move: globalThis.PointerEvent) => {
      const start = drag.current;
      if (start === null) return;
      setLive(
        clamped({
          x: start.from.x + move.clientX - start.pointer.x,
          y: start.from.y + move.clientY - start.pointer.y,
        }),
      );
    };
    const onEnd = (end: globalThis.PointerEvent) => {
      onMove(end);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
      drag.current = null;
      setLive((last) => {
        if (last !== null) commit(last);
        return null;
      });
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  }

  function move(event: KeyboardEvent) {
    if (shown === null) return;

    const next = stepPlace(shown, event.key, event.shiftKey);
    if (next === null) return;
    event.preventDefault();
    commit(clamped(next));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== 'Escape') return;
    event.stopPropagation();
    close();
  }

  if (!open) return null;

  const context: FloatingPanelContextValue = { close, move, startDrag, t, titleId };
  const rootProps = keyedProps({
    ...nativeProps,
    ...(ariaLabel === undefined ? { 'aria-labelledby': titleId } : { 'aria-label': ariaLabel }),
    children,
    ...(live === null ? {} : { 'data-dragging': '' }),
    'data-part': 'root',
    'data-ui': 'floating-panel',
    onKeyDown: handleKeyDown,
    role: 'region',
    style: {
      ...(shown === null
        ? { visibility: 'hidden' }
        : { '--_x': `${String(shown.x)}px`, '--_y': `${String(shown.y)}px` }),
      ...style,
    } as CSSProperties,
  });

  return (
    <FloatingPanelContext.Provider value={context}>
      <section {...rootProps} ref={root} />
    </FloatingPanelContext.Provider>
  );
}

function sizeOf(element: HTMLElement) {
  const box = element.getBoundingClientRect();

  return { width: box.width, height: box.height };
}

function viewport() {
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  };
}
