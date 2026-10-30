import '@slotted/styles/popover/popover.css';

import { popoverMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { useMessages } from '../i18n';
import { usePopoverDefaults } from './popover-defaults';
import type { PopoverContextValue, PopoverOpenReason, PopoverProps } from './popover.types';

const PopoverContext = createContext<PopoverContextValue | undefined>(undefined);

/**
 * Where the layer publishes its own `update`, so `reposition()` on the handle
 * reaches it. A context of its own, because it is written by a descendant and
 * read by an ancestor.
 */
const PopoverRepositionContext = createContext<{ current: (() => void) | undefined }>({
  current: undefined,
});

/** Read by the layer, which is the only part that holds a positioner. */
export function usePopoverReposition() {
  return useContext(PopoverRepositionContext);
}

/**
 * What the popover around this part says. A part outside one has no state to
 * report and nothing to be anchored to, so this throws rather than rendering
 * markup that looks right and never opens.
 */
export function usePopover(): PopoverContextValue {
  const context = useContext(PopoverContext);
  if (context === undefined) {
    throw new Error('Every Popover part has to be inside a Popover.');
  }
  return context;
}

/**
 * Interactive, non-modal content anchored to the control that opened it.
 *
 * It is the APG's non-modal dialog — the pattern the tooltip page names for a
 * surface that holds focusable elements — and it is deliberately **not** modal.
 * Nothing behind it becomes `inert`, the page keeps scrolling, `aria-modal` is
 * never written, and focus is not contained. The modal surface is `Dialog`.
 *
 * Like `Tooltip`, this component owns the state and renders nothing: the
 * trigger stays where the consumer wrote it and the layer is portalled to the
 * end of the document.
 */
export function Popover({
  align,
  alignOffset,
  arrow,
  arrowPadding,
  autoFocus,
  children,
  closeOnEscape,
  closeOnOutsidePress,
  collisionPadding,
  defaultOpen,
  disabled,
  finalFocus,
  flip,
  hideWhenDetached,
  initialFocus,
  messages,
  mount,
  onOpenChange,
  open,
  portal,
  ref,
  shift,
  side,
  sideOffset,
  size,
  strategy,
  width,
}: PopoverProps) {
  const defaults = usePopoverDefaults();
  const t = useMessages(popoverMessages, messages);
  const base = useId();

  const [own, setOwn] = useState<boolean>(defaultOpen ?? false);
  const [triggerNode, setTriggerNode] = useState<HTMLElement | null>(null);
  const [anchorNode, setAnchorNode] = useState<HTMLElement | null>(null);
  const [arrowNode, setArrowNode] = useState<HTMLElement | null>(null);
  const [contentNode, setContentNode] = useState<HTMLElement | null>(null);
  const [hasTitle, setHasTitle] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);
  const reposition = useRef<(() => void) | undefined>(undefined);

  const resolvedDisabled = disabled === true;
  const current = (open ?? own) && !resolvedDisabled;

  const seen = useRef(current);
  if (current) seen.current = true;

  const latest = useRef({ current, onOpenChange, open });
  latest.current = { current, onOpenChange, open };

  const toggle = useCallback((next: boolean, reason: PopoverOpenReason, source?: unknown) => {
    const state = latest.current;
    if (next === state.current) return;

    let cancelled = false;
    const controllable = createControllable<boolean>({
      controlled: state.open,
      initial: state.current,
      onRequest: (request) => {
        cancelled = request.cancelled;
        state.onOpenChange?.(request.value, request);
      },
    });
    const moved = controllable.request(next, reason, source);
    if (cancelled) return;
    if (moved) setOwn(next);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      close: () => toggle(false, 'programmatic'),
      open: () => toggle(true, 'programmatic'),
      reposition: () => reposition.current?.(),
    }),
    [toggle],
  );

  const context: PopoverContextValue = {
    align: align ?? defaults.align,
    alignOffset: alignOffset ?? defaults.alignOffset,
    anchorNode,
    arrowNode,
    arrowPadding: arrowPadding ?? defaults.arrowPadding,
    autoFocus: autoFocus ?? defaults.autoFocus,
    closeOnEscape: closeOnEscape ?? defaults.closeOnEscape,
    closeOnOutsidePress: closeOnOutsidePress ?? defaults.closeOnOutsidePress,
    collisionPadding: collisionPadding ?? defaults.collisionPadding,
    contentId: `${base}panel`,
    contentNode,
    descriptionId: `${base}description`,
    disabled: resolvedDisabled,
    finalFocus,
    flip: flip ?? defaults.flip,
    hasDescription,
    hasTitle,
    hideWhenDetached: hideWhenDetached ?? defaults.hideWhenDetached,
    initialFocus,
    mount: mount ?? defaults.mount,
    open: current,
    portal: portal ?? defaults.portal,
    seen: seen.current,
    setAnchorNode,
    setArrowNode,
    setContentNode,
    setHasDescription,
    setHasTitle,
    setTriggerNode,
    shift: shift ?? defaults.shift,
    showArrow: arrow ?? defaults.arrow,
    side: side ?? defaults.side,
    sideOffset: sideOffset ?? defaults.sideOffset,
    size: size ?? defaults.size,
    strategy: strategy ?? defaults.strategy,
    t,
    titleId: `${base}title`,
    toggle,
    triggerNode,
    width: width ?? defaults.width,
  };

  return (
    <PopoverContext.Provider value={context}>
      <PopoverRepositionContext.Provider value={reposition}>
        {children}
      </PopoverRepositionContext.Provider>
    </PopoverContext.Provider>
  );
}
