import {
  clampPlace,
  FLOATING_LARGE_STEP,
  FLOATING_STEP,
  stepPlace,
} from '@slotted/core/floating-panel';
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
  largeStep = FLOATING_LARGE_STEP,
  messages,
  onKeyDown,
  onOpenChange,
  onPlaceChange,
  open,
  place,
  step = FLOATING_STEP,
  style,
  ...nativeProps
}: FloatingPanelProps) {
  const t = useMessages(floatingPanelMessages, messages);
  const titleId = useId();
  const root = useRef<HTMLElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [own, setOwn] = useState<FloatingPlace | null>(null);
  const [live, setLive] = useState<FloatingPlace | null>(null);

  const shown = live ?? place ?? own;

  /* The element that held focus is where focus returns on close. */
  useLayoutEffect(() => {
    if (!open) return;

    const active = document.activeElement;
    opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
  }, [open]);

  function commit(next: FloatingPlace) {
    if (place === undefined) setOwn(next);
    onPlaceChange?.(next);
  }

  function close() {
    onOpenChange(false);
    opener.current?.focus();
  }

  function startDrag(event: PointerEvent<HTMLElement>) {
    const panel = root.current;
    if (event.button !== 0 || panel === null) return;
    if ((event.target as Element).closest('[data-part="close"]') !== null) return;

    const handle = event.currentTarget;
    const from = placeOf(panel);
    const pressed = { x: event.clientX, y: event.clientY };
    let last: FloatingPlace | null = null;
    handle.setPointerCapture(event.pointerId);

    const onMove = (move: globalThis.PointerEvent) => {
      const by = { x: move.clientX - pressed.x, y: move.clientY - pressed.y };
      if (last === null && by.x === 0 && by.y === 0) return;

      last = clampPlace({ x: from.x + by.x, y: from.y + by.y }, sizeOf(panel), viewport());
      setLive(last);
    };
    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
      if (last === null) return;

      setLive(null);
      commit(last);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  }

  function move(event: KeyboardEvent) {
    if (root.current === null) return;

    const from = placeOf(root.current);
    const next = stepPlace(from, event.key, event.shiftKey ? largeStep : step);
    if (next === null) return;

    event.preventDefault();
    commit(clampPlace(next, sizeOf(root.current), viewport()));
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
    ...(shown === null ? { 'data-corner': defaultPlace } : {}),
    onKeyDown: handleKeyDown,
    role: 'region',
    style: {
      ...(shown === null ? {} : { '--_x': `${String(shown.x)}px`, '--_y': `${String(shown.y)}px` }),
      ...style,
    } as CSSProperties,
  });

  return (
    <FloatingPanelContext.Provider value={context}>
      <section {...rootProps} ref={root} />
    </FloatingPanelContext.Provider>
  );
}

/** Where the panel is drawn, which is not its stored place when that lies outside the viewport. */
function placeOf(element: HTMLElement): FloatingPlace {
  const box = element.getBoundingClientRect();

  return { x: box.left, y: box.top };
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
