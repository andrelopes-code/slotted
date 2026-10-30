import '@slotted/styles/action-sheet/action-sheet.css';
import '@slotted/styles/spinner/spinner.css';

import { actionSheetMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import {
  createContext,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Drawer } from '../drawer';
import { useMessages } from '../i18n';
import type { DrawerChangeRequest, DrawerHandle } from '../drawer';
import { useActionSheetDefaults } from './action-sheet-defaults';
import { entryTarget } from './action-sheet-entry';
import type {
  ActionSheetContextValue,
  ActionSheetHandle,
  ActionSheetOpenReason,
  ActionSheetProps,
} from './action-sheet.types';

const ActionSheetContext = createContext<ActionSheetContextValue | undefined>(undefined);

/**
 * What the sheet around this part says. A part outside one has no sheet to
 * belong to and no state to report, so this throws rather than rendering
 * something that looks right and closes nothing.
 */
export function useActionSheet(): ActionSheetContextValue {
  const context = useContext(ActionSheetContext);
  if (context === undefined) {
    throw new Error('Every action sheet part must be rendered inside ActionSheet.');
  }
  return context;
}

/**
 * A `scrimFrom` no extent reaches. A sheet that is not modal keeps the page
 * live, and a scrim over a live page would promise an inertness that is not
 * there, so `drawer` is asked to leave it undimmed at every height.
 */
const NEVER_DIMMED = 2;

/**
 * A short list of actions that rises from the bottom edge, and the explicit
 * way out beneath it.
 *
 * The sheet is `drawer`'s — `side="bottom"`, `size="content"` — which owns the
 * layer, the portal, the scrim, the slide, the width, Escape, the press
 * outside, the way back, the drag that closes it and the virtual keyboard.
 * This family owns what is inside: the title and message, the menu of actions
 * and the cancel, and the state, because only it knows that a close was a
 * choice (`select`) and what was chosen.
 *
 * `docs/history/designs/2026-09-25-action-sheet-on-drawer-design.md`.
 */
export function ActionSheet({
  back,
  children,
  closeOnSelect,
  container,
  defaultOpen,
  escape,
  finalFocus,
  initialFocus,
  messages,
  modal,
  mount,
  onOpenChange,
  open,
  outsidePress,
  ref,
}: ActionSheetProps) {
  const defaults = useActionSheetDefaults();
  const t = useMessages(actionSheetMessages, messages);

  const [ownOpen, setOwnOpen] = useState<boolean>(defaultOpen ?? false);
  const currentOpen = open ?? ownOpen;
  const resolvedModal = modal ?? defaults.modal;

  const drawer = useRef<DrawerHandle>(null);
  const nodes = useRef({ list: null as HTMLElement | null, panel: null as HTMLElement | null });

  /**
   * Asks to move, and answers whether the move stands. `drawer`'s own request
   * — Escape, the press outside, the way back, the drag — is refused when this
   * one is, so the consumer's `cancel()` holds whichever family asked first.
   */
  const requestOpen = useCallback(
    (
      next: boolean,
      reason: ActionSheetOpenReason,
      result: string | undefined,
      source: unknown,
    ): boolean => {
      if (next === currentOpen) return true;

      let cancelled = false;
      const state = createControllable<boolean>({
        controlled: open,
        initial: currentOpen,
        onRequest: (raw) => {
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
          cancelled = raw.cancelled;
        },
      });

      const moved = state.request(next, reason, source);
      if (cancelled) return false;
      if (moved) setOwnOpen(next);
      return true;
    },
    [currentOpen, onOpenChange, open],
  );

  const fromDrawer = useCallback(
    (next: boolean, request: DrawerChangeRequest) => {
      if (!requestOpen(next, request.reason, undefined, request.source)) request.cancel();
    },
    [requestOpen],
  );

  /**
   * Where focus enters, decided when the sheet has opened and its actions
   * exist: the consumer's element, or the least destructive action. `drawer`
   * reads `current` at that moment, which is why this is a getter.
   */
  const entry = useMemo(
    () =>
      initialFocus === false
        ? (false as const)
        : {
            get current(): HTMLElement | null {
              const panel = drawer.current?.panel ?? null;
              return initialFocus?.current ?? (panel === null ? null : entryTarget(panel));
            },
          },
    [initialFocus],
  );

  useImperativeHandle<ActionSheetHandle, ActionSheetHandle>(
    ref,
    () => ({
      open: () => void requestOpen(true, 'programmatic', undefined, undefined),
      close: () => void requestOpen(false, 'programmatic', undefined, undefined),
      focus: () => {
        const stop = nodes.current.list?.querySelector<HTMLElement>(
          "[data-part='item'][tabindex='0']",
        );
        (stop ?? nodes.current.panel)?.focus();
      },
    }),
    [requestOpen],
  );

  const value = useMemo<ActionSheetContextValue>(
    () => ({
      close: (reason, result, source) => void requestOpen(false, reason, result, source),
      closeOnSelect: closeOnSelect ?? defaults.closeOnSelect,
      nodes: nodes.current,
      t,
    }),
    [closeOnSelect, defaults, requestOpen, t],
  );

  return (
    <Drawer
      back={back ?? defaults.back}
      container={container}
      drag="panel"
      escape={escape ?? defaults.escape}
      initialFocus={entry}
      modal={resolvedModal}
      mode="overlay"
      mount={mount ?? defaults.mount}
      onOpenChange={fromDrawer}
      open={currentOpen}
      outsidePress={outsidePress ?? defaults.outsidePress}
      ref={drawer}
      scrimFrom={resolvedModal ? 0 : NEVER_DIMMED}
      side="bottom"
      size="content"
      {...(finalFocus === undefined ? {} : { finalFocus })}
    >
      <ActionSheetContext.Provider value={value}>{children}</ActionSheetContext.Provider>
    </Drawer>
  );
}
