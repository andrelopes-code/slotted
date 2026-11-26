import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { attachGripDismiss } from '@slotted/core/extent';
import { useEffect, useLayoutEffect, useRef } from 'react';

import { useMenu } from './menu';
import type { MenuOpenReason } from './menu.types';

/**
 * The bottom sheet of a menu on a phone: a modal layer over a scrim, focus in
 * its items and given back to the trigger as it closes, its grip pulled down
 * to dismiss it. A submenu is a second step of the same sheet: a layer over
 * the first, at least as tall, whose scrim is clear because the first one
 * already dims the page.
 */
export function useMenuSheet(
  layer: HTMLElement | null,
  surface: HTMLElement | null,
  onShown: () => void,
) {
  const menu = useMenu();
  const latest = useRef({ menu, onShown });
  latest.current = { menu, onShown };

  const { closeOnEscape, closeOnOutsidePress, open, parent, sheet, triggerNode } = menu;
  const shown = sheet && open ? surface : null;
  const parentSurface = parent?.node ?? null;

  /* No positioner places a sheet, so nothing else writes the open state. */
  useLayoutEffect(() => {
    if (layer === null || shown === null) return;

    layer.setAttribute('data-open', '');
    if (parentSurface !== null) {
      layer.style.setProperty('--_step-floor', `${String(parentSurface.offsetHeight)}px`);
    }
    const view = layer.ownerDocument.defaultView;
    const frame = view?.requestAnimationFrame(() => latest.current.onShown());

    return () => {
      if (frame !== undefined) view?.cancelAnimationFrame(frame);
      layer.removeAttribute('data-open');
      layer.style.removeProperty('--_step-floor');
    };
  }, [layer, parentSurface, shown]);

  useEffect(() => {
    if (layer === null || shown === null) return;

    const dismissable = createDismissableLayer(layer, {
      back: true,
      branches: triggerNode === null ? [] : [triggerNode],
      content: shown,
      escape: closeOnEscape,
      modal: true,
      outsidePress: closeOnOutsidePress,
      outsidePressEvent: 'click',
      onDismiss: (request) => {
        const reason: MenuOpenReason =
          request.reason === 'outsidePress' ? 'outsidePress' : 'escape';
        latest.current.menu.toggle(false, reason, request.source);
        /* A press on the scrim dismisses every step; Escape and the way back take one. */
        if (reason === 'outsidePress') latest.current.menu.parent?.closeAll(reason, request.source);
      },
    });

    return () => {
      const { activeElement, body } = layer.ownerDocument;
      /* Focus on a step above this one is the sheet's as well. */
      const held =
        activeElement === null ||
        activeElement === body ||
        layer.contains(activeElement) ||
        activeElement.closest('[data-ui="menu"][data-step]') !== null;
      /* The layer first: focus given back to an `inert` trigger is refused. */
      dismissable.destroy();
      /* A step gives focus back to its item only while the first step stays open. */
      const above = parentSurface?.parentElement ?? null;
      if (held && (above === null || above.hasAttribute('data-open'))) {
        triggerNode?.focus({ preventScroll: true });
      }
    };
  }, [closeOnEscape, closeOnOutsidePress, layer, parentSurface, shown, triggerNode]);

  useEffect(() => {
    const grip = shown?.querySelector<HTMLElement>(':scope > [data-part="grip"]');
    if (shown == null || grip == null) return;

    return attachGripDismiss({
      grip,
      scrim: layer?.querySelector<HTMLElement>(':scope > [data-part="backdrop"]'),
      sheet: shown,
      onDismiss: (event) => latest.current.menu.toggle(false, 'pointer', event),
    });
  }, [layer, shown]);
}
