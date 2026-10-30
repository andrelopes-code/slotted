import '@slotted/styles/dialog/dialog.css';

import { dialogMessages } from '@slotted/core/i18n';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { createControllable } from '@slotted/core/state';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useMessages } from '../i18n';
import { useDialogDefaults } from './dialog-defaults';
import type {
  AlertDialogProps,
  DialogContextValue,
  DialogFullscreenReason,
  DialogHandle,
  DialogMember,
  DialogOpenReason,
  DialogProps,
} from './dialog.types';

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

/**
 * What the layer around this part says. A part outside one has no layer to
 * belong to and no state to report, so this throws rather than rendering
 * something that looks right and closes nothing.
 */
export function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('Every dialog part must be rendered inside Dialog or AlertDialog.');
  }
  return context;
}

interface FamilyProps extends DialogProps {
  member: DialogMember;
  tone?: AlertDialogProps['tone'];
}

/**
 * The state, the presence and the identifiers — and no DOM at all.
 *
 * React needs a provider around both the trigger and the layer, because the
 * trigger renders in place and the layer is portalled out; Radix, Base UI and
 * Ark all reach the same shape. Angular needs no equivalent, because a template
 * reference variable plus `exportAs` links the two without one, and
 * `docs/history/designs/2026-09-04-dialog-and-alert-dialog-design.md` records
 * the asymmetry rather than levelling both down to the smaller shape.
 */
function DialogFamily({
  back,
  children,
  container,
  defaultFullscreen,
  defaultOpen,
  escape,
  finalFocus,
  fullscreen,
  fullScreen,
  fullscreenToggle,
  initialFocus,
  loading,
  member,
  messages,
  modal,
  mount,
  onFullscreenChange,
  onOpenChange,
  onOpenChangeComplete,
  open,
  outsidePress,
  placement,
  ref,
  scroll,
  size,
  surface,
  tone,
}: FamilyProps) {
  const defaults = useDialogDefaults();
  const t = useMessages(dialogMessages, messages);
  const baseId = useId();

  const [own, setOwn] = useState<boolean>(defaultOpen ?? false);
  const current = open ?? own;

  const isAlert = member === 'alertDialog';

  /**
   * The reader's own state, and a confirmation never holds it: an alert dialog
   * has no corner controls at all, for the reason it has no close button.
   */
  const [ownFullscreen, setOwnFullscreen] = useState<boolean>(defaultFullscreen ?? false);
  const currentFullscreen = !isAlert && (fullscreen ?? ownFullscreen);
  const resolvedFullscreenToggle = !isAlert && fullscreenToggle === true;

  const resolvedModal = isAlert ? true : (modal ?? defaults.modal);
  const resolvedOutsidePress = isAlert ? 'none' : (outsidePress ?? defaults.outsidePress);
  const resolvedMount = mount ?? defaults.mount;
  const resolvedSize = size ?? (isAlert ? 'sm' : defaults.size);
  const resolvedFullScreen = fullScreen ?? (isAlert ? 'never' : defaults.fullScreen);
  const resolvedInitialFocus = initialFocus ?? (isAlert ? 'cancel' : 'first');
  const resolvedEscape = escape ?? defaults.escape;
  const resolvedBack = back ?? defaults.back;
  const resolvedPlacement = placement ?? defaults.placement;
  const resolvedScroll = scroll ?? defaults.scroll;
  const resolvedSurface = surface ?? defaults.surface;

  /**
   * The status rather than a boolean. `entering` is one frame long and it is
   * the whole reason it exists: a layer that appears already open gives its CSS
   * transition no closed style to start from.
   */
  const [status, setStatus] = useState<PresenceStatus>(current ? 'entering' : 'unmounted');
  const presence = useRef<PresenceHandle | null>(null);
  const settled = useRef(onOpenChangeComplete);
  settled.current = onOpenChangeComplete;
  if (presence.current === null) {
    /* A layer mounted open enters as one opened later does: an application
       that renders it conditionally, `{subject && <Drawer open />}`, saw it
       appear in its final state with no entrance. */
    presence.current = createPresence({
      onEnterComplete: () => settled.current?.(true),
      onExitComplete: () => settled.current?.(false),
      onStatusChange: setStatus,
      present: current,
      skipInitialAnimation: false,
    });
  }

  useEffect(() => {
    presence.current?.sync(current);
  }, [current]);

  /* Stopped, not destroyed: StrictMode mounts again on the same handle. */
  useEffect(() => {
    const handle = presence.current;
    return () => handle?.stop();
  }, []);

  /** Whether this layer has ever been open, which is what `lazy` reads. */
  const seen = useRef(current);
  if (current) seen.current = true;

  const mounted =
    resolvedMount === 'eager'
      ? true
      : resolvedMount === 'lazy'
        ? seen.current
        : status !== 'unmounted';

  /**
   * Ref objects rather than state, and stable for the life of the family, which
   * is what lets them sit on a memoised context value without changing its
   * identity on every render.
   */
  const nodes = useRef({
    cancel: null as HTMLElement | null,
    content: null as HTMLElement | null,
    trigger: null as HTMLElement | null,
  });

  const [titleRendered, setTitleRendered] = useState(false);
  const [descriptionRendered, setDescriptionRendered] = useState(false);

  /**
   * A part says it exists, so the panel wires only what was rendered. The ids
   * are generated before the parts are known, and an `aria-labelledby` pointing
   * at an id nothing carries is worse than no accessible name at all.
   */
  const announce = useCallback<DialogContextValue['announce']>((part, node) => {
    if (part === 'cancel') nodes.current.cancel = node;
    if (part === 'title') setTitleRendered(true);
    if (part === 'description') setDescriptionRendered(true);

    return () => {
      if (part === 'cancel') nodes.current.cancel = null;
      if (part === 'title') setTitleRendered(false);
      if (part === 'description') setDescriptionRendered(false);
    };
  }, []);

  const request = useCallback(
    (next: boolean, reason: DialogOpenReason, result: string | undefined, source: unknown) => {
      if (next === current) return;

      let cancelled = false;
      const state = createControllable<boolean>({
        controlled: open,
        initial: current,
        onRequest: (raw) => {
          cancelled = raw.cancelled;
          onOpenChange?.(raw.value, {
            get cancelled() {
              return raw.cancelled;
            },
            cancel: () => raw.cancel(),
            previous: raw.previous,
            reason,
            result,
            source: raw.source,
            value: raw.value,
          });
        },
      });

      const moved = state.request(next, reason, source);
      if (cancelled) return;
      if (moved) setOwn(next);
    },
    [current, onOpenChange, open],
  );

  const setFullscreen = useCallback(
    (next: boolean, reason: DialogFullscreenReason, source: unknown) => {
      if (next === currentFullscreen) return;

      const state = createControllable<boolean>({
        controlled: fullscreen,
        initial: currentFullscreen,
        onRequest: (raw) => {
          onFullscreenChange?.(raw.value, {
            get cancelled() {
              return raw.cancelled;
            },
            cancel: () => raw.cancel(),
            previous: raw.previous,
            reason,
            source: raw.source,
            value: raw.value,
          });
        },
      });

      if (state.request(next, reason, source)) setOwnFullscreen(next);
    },
    [currentFullscreen, fullscreen, onFullscreenChange],
  );

  useImperativeHandle<DialogHandle, DialogHandle>(
    ref,
    () => ({
      open: () => request(true, 'programmatic', undefined, undefined),
      close: (result?: string) => request(false, 'programmatic', result, undefined),
      focus: () => nodes.current.content?.focus(),
      get content() {
        return nodes.current.content;
      },
    }),
    [request],
  );

  const value = useMemo<DialogContextValue>(
    () => ({
      announce,
      close: (reason, result, source) => request(false, reason, result, source),
      container,
      descriptionId: descriptionRendered ? `${baseId}description` : '',
      back: resolvedBack,
      escape: resolvedEscape,
      finalFocus,
      fullScreen: resolvedFullScreen,
      fullscreen: currentFullscreen,
      fullscreenToggle: resolvedFullscreenToggle,
      initialFocus: resolvedInitialFocus,
      setFullscreen,
      loading: loading === true,
      member,
      modal: resolvedModal,
      mount: resolvedMount,
      mounted,
      nodes: nodes.current,
      open: current,
      openWith: (reason, source) => request(true, reason, undefined, source),
      outsidePress: resolvedOutsidePress,
      placement: resolvedPlacement,
      registerContent: (node) => {
        nodes.current.content = node;
      },
      registerLayer: (node) => presence.current?.setNode(node),
      registerTrigger: (node) => {
        nodes.current.trigger = node;
      },
      scroll: resolvedScroll,
      size: resolvedSize,
      surface: resolvedSurface,
      t,
      titleId: titleRendered ? `${baseId}title` : '',
      tone: isAlert ? (tone ?? 'danger') : undefined,
      triggerId: `${baseId}trigger`,
      /** What the stylesheet keys on, which is a frame behind what was asked. */
      visible: status === 'open',
      interactive: status === 'entering' || status === 'open',
    }),
    [
      announce,
      baseId,
      container,
      current,
      currentFullscreen,
      descriptionRendered,
      finalFocus,
      isAlert,
      loading,
      member,
      mounted,
      request,
      resolvedBack,
      resolvedEscape,
      resolvedFullScreen,
      resolvedFullscreenToggle,
      resolvedInitialFocus,
      resolvedModal,
      resolvedMount,
      resolvedOutsidePress,
      resolvedPlacement,
      resolvedScroll,
      resolvedSize,
      setFullscreen,
      resolvedSurface,
      status,
      t,
      titleRendered,
      tone,
    ],
  );

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

/**
 * A window over the page, and the scrim that says the page is out of reach.
 *
 * The layer is composed from `packages/core` and rewritten nowhere: `portal`
 * decides where it lives and keeps the theme of the region that opened it,
 * `dismissable-layer` owns Escape, outside press, `inert`, the scroll lock and
 * the single z-index stack, `presence` keeps it mounted long enough to leave,
 * and `focus` contains the keyboard and gives it back to the trigger.
 *
 * The platform's own `<dialog>` is declined, and the reason is the top layer:
 * an element promoted to it paints above everything regardless of `z-index`, so
 * a `select` opened inside one would portal to the body and paint behind the
 * dialog it belongs to. The cost — this family needs JavaScript for containment,
 * inertness and Escape — is written in
 * `docs/history/designs/2026-09-04-dialog-and-alert-dialog-capability-inventory.md`.
 */
export function Dialog(props: DialogProps) {
  return <DialogFamily {...props} member="dialog" />;
}

/**
 * A dialog that interrupts to confirm something irreversible.
 *
 * Two rules are fixed rather than left to a prop: outside press never closes
 * it, and it is always modal. Ark and React Aria make the role a prop, so a
 * consumer who sets `role="alertdialog"` and forgets the dismissal policy ships
 * a destructive confirmation a stray click dismisses.
 *
 * Focus lands on `AlertDialogCancel` rather than on the first tabbable element,
 * which is the APG's own advice for a step that is not easily reversible, and a
 * description is required rather than optional, which the alert dialog pattern
 * requires and the modal dialog pattern does not.
 */
export function AlertDialog(props: AlertDialogProps) {
  return <DialogFamily {...props} member="alertDialog" />;
}
