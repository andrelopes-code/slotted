import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { attachGripDismiss } from '@slotted/core/extent';
import { createPortalRoot } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { useMediaQuery } from './use-media-query';
import { usePickerOpen } from './use-picker-open';
import type { PickerOpen, PickerOpenOptions } from './use-picker-open';

/** Below this width, on a finger, the surface is a sheet rather than a popover. */
const SHEET_QUERY = '(max-width: 480px) and (pointer: coarse)';

/** Below this width the panel is one column: one month, one part at a time. */
const NARROW_QUERY = '(max-width: 760px)';

export interface PickerLayerOptions extends PickerOpenOptions {
  /** Where focus goes once the panel is on screen, when the trigger opened it. */
  readonly focusPanel: (panel: HTMLElement) => void;
  /** Escape is the picker's own first: `true` when it took the key and the panel stays. */
  readonly onEscape?: (() => boolean) | undefined;
  readonly placement: string;
  readonly rootRef: RefObject<HTMLElement | null>;
}

export interface PickerLayer extends PickerOpen {
  /** Closes, with focus on the trigger: the reader is done. */
  readonly finish: (source: unknown) => void;
  /** Opens, with focus in the panel unless the reader is typing in the field. */
  readonly show: (reason: 'pointer' | 'keyboard', source: unknown, enter?: boolean) => void;
  /** Where the surface is drawn; `null` while the page has no place made for it. */
  readonly container: HTMLElement | null;
  readonly contentId: string;
  /** The surface is in the tree: open, or on its way out. */
  readonly mounted: boolean;
  readonly narrow: boolean;
  readonly setLayerNode: (node: HTMLElement | null) => void;
  readonly sheet: boolean;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
}

/**
 * The layer a picker opens: its place in the page, how it arrives and leaves,
 * and what dismisses it.
 */
export function usePickerLayer(options: PickerLayerOptions): PickerLayer {
  const { onEscape, placement, rootRef } = options;
  const { isOpen, setOpen } = usePickerOpen(options);
  const contentId = useId();
  const sheet = useMediaQuery(SHEET_QUERY);
  const narrow = useMediaQuery(NARROW_QUERY);

  const [layerNode, setLayerNode] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;
  const focusRef = useRef(options.focusPanel);
  focusRef.current = options.focusPanel;
  const owesFocus = useRef(false);

  const mounted = usePickerPresence(isOpen, layerNode);
  const container = usePickerContainer(mounted, rootRef, triggerRef);

  /* A pull down on the sheet's grip dismisses it, as the grip of every other sheet does. */
  useEffect(() => {
    const grip = layerNode?.querySelector<HTMLElement>(':scope > * > [data-part="grip"]');
    if (!sheet || !isOpen || layerNode === null || grip == null) return;

    return attachGripDismiss({
      grip,
      sheet: layerNode,
      onDismiss: (event) => setOpen(false, 'pointer', event),
    });
  }, [isOpen, layerNode, setOpen, sheet]);

  /* Placed before the first paint: the positioner writes `data-positioned` with the side. */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (layerNode === null || root === null || sheet) return;

    const anchor = root.querySelector<HTMLElement>('[data-part="control"]') ?? root;
    const [side, align = 'center'] = placement.split('-') as [
      'top' | 'bottom',
      'start' | 'end' | undefined,
    ];
    const handle = createPositioner(anchor, layerNode, { align, side, sideOffset: 4 });
    void handle.update();

    return () => {
      handle.destroy();
      layerNode.removeAttribute('data-positioned');
    };
  }, [layerNode, placement, rootRef, sheet]);

  /* The trigger is a branch, so pressing it again closes the surface instead
     of dismissing and reopening it in one gesture. */
  useEffect(() => {
    if (layerNode === null || !isOpen) return;

    const layer = createDismissableLayer(layerNode, {
      branches: triggerRef.current === null ? [] : [triggerRef.current],
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      onDismiss: ({ reason, source }) => {
        if (reason === 'escape' && escapeRef.current?.() === true) return;

        setOpen(false, reason === 'escape' ? 'escape' : 'outsidePress', source);
        /* Focus goes back to the trigger on a key and stays where the reader
           put it on a press outside. */
        if (reason === 'escape') triggerRef.current?.focus({ preventScroll: true });
      },
    });

    return () => layer.destroy();
  }, [isOpen, layerNode, setOpen]);

  /* Left on the trigger, focus would be a whole page away from a panel in a
     portal. It moves in the frame after the panel is in the node that stays. */
  useEffect(() => {
    if (layerNode === null || container === null || !isOpen || !owesFocus.current) return;
    if (!container.contains(layerNode)) return;

    owesFocus.current = false;
    let moved = false;
    const frame = requestAnimationFrame(() => {
      moved = true;
      focusRef.current(layerNode);
    });

    return () => {
      if (moved) return;
      cancelAnimationFrame(frame);
      owesFocus.current = true;
    };
  }, [container, isOpen, layerNode]);

  return {
    container,
    contentId,
    finish: (source) => {
      setOpen(false, 'select', source);
      triggerRef.current?.focus({ preventScroll: true });
    },
    isOpen,
    mounted,
    narrow,
    setLayerNode,
    setOpen,
    sheet,
    show: (reason, source, enter = true) => {
      owesFocus.current = enter;
      setOpen(true, reason, source);
    },
    triggerRef,
  };
}

/** Whether the surface is in the tree, its exit animation allowed to finish. */
function usePickerPresence(isOpen: boolean, layerNode: HTMLElement | null): boolean {
  const [status, setStatus] = useState<PresenceStatus>('unmounted');
  const presence = useRef<PresenceHandle | null>(null);

  useEffect(() => {
    const handle = createPresence({ present: isOpen, onStatusChange: setStatus });
    presence.current = handle;
    setStatus(handle.status);

    return () => {
      handle.destroy();
      presence.current = null;
    };
    /* Created once; the effects below keep it in step with the state. */
  }, []);
  useEffect(() => presence.current?.sync(isOpen), [isOpen]);
  useEffect(() => presence.current?.setNode(layerNode), [layerNode]);

  /* Open renders the surface in the commit that opens it. */
  return isOpen || status !== 'unmounted';
}

/**
 * The element the surface is moved into. It is made when the control takes
 * focus or a press: making it reads the trigger's computed style, and a read
 * in the open's own task is a style recalculation the first frame waits for.
 */
function usePickerContainer(
  mounted: boolean,
  rootRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLButtonElement | null>,
): HTMLElement | null {
  const [warm, setWarm] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const layered = mounted || warm;

  useEffect(() => {
    const root = rootRef.current;
    if (root === null || warm) return;

    const prepare = () => setWarm(true);
    root.addEventListener('focusin', prepare);
    root.addEventListener('pointerdown', prepare);

    return () => {
      root.removeEventListener('focusin', prepare);
      root.removeEventListener('pointerdown', prepare);
    };
  }, [rootRef, warm]);

  useLayoutEffect(() => {
    if (!layered) {
      setContainer(null);
      return;
    }

    const handle = createPortalRoot({ origin: triggerRef.current, disabled: false });
    setContainer(handle.container as HTMLElement);

    return () => handle.release();
  }, [layered, triggerRef]);

  return container;
}
