import { withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/toast/toast.css';

import { createRemovalFocus } from '@slotted/core/focus';
import { type FamilyTranslator, toastMessages, type ToastMessages } from '@slotted/core/i18n';
import { createPortalRoot } from '@slotted/core/portal';
import type { ToastMessage } from '@slotted/core/toast';
import { createToastStore } from '@slotted/core/toast';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { CSSProperties, FocusEvent, PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';

import { useMessages } from '../i18n';
import { useToastDefaults, useToaster } from './toast-defaults';
import { Toast } from './toast-parts';
import type { ToastContent, ToastDefaults, ToastRegionProps, ToastStore } from './toast.types';

export interface ToastRegionContextValue {
  store: ToastStore<ToastContent>;
  defaults: ToastDefaults;
  swipe: boolean;
  swipeThreshold: number;
  placement: ToastRegionProps['placement'];
  /** Where the keyboard was before the hotkey moved it into the region. */
  cameFrom: { current: HTMLElement | null };
  /** The family's words in the language in force, with this region's `messages` laid over them. */
  t: FamilyTranslator<ToastMessages>;
}

const ToastRegionContext = createContext<ToastRegionContextValue | undefined>(undefined);

/** What the region around this part is. A message outside one has no queue. */
export function useToastRegion(): ToastRegionContextValue {
  const context = useContext(ToastRegionContext);
  if (context === undefined) {
    throw new Error('Toast and its parts have to be rendered inside a ToastRegion.');
  }
  return context;
}

/**
 * A hotkey is written the way a reader would say it: `F6`, `Alt+T`, `Shift+F8`.
 * Comparing `event.key` is what makes it work on a layout whose `T` is not
 * where a US keyboard puts it.
 */
function matchesHotkey(event: KeyboardEvent, hotkey: string): boolean {
  const parts = hotkey.toLowerCase().split('+');
  const key = parts.at(-1) ?? '';
  const wants = (name: string) => parts.includes(name);

  return (
    event.key.toLowerCase() === key &&
    event.altKey === wants('alt') &&
    event.ctrlKey === wants('ctrl') &&
    event.shiftKey === wants('shift') &&
    event.metaKey === wants('meta')
  );
}

/**
 * A message's own height, which is not the height it is drawn at: a closed
 * pile draws every message at the front one's height, and an opening one
 * animates it. The override is lifted for the one read, and not at all while
 * the height is moving, because lifting it then cancels the movement — the
 * last measurement stands until the transition ends and the observer fires
 * again. Chrome names the logical property's transition by its physical one.
 */
function naturalHeight(item: HTMLElement): number {
  const moving =
    typeof item.getAnimations === 'function' &&
    item
      .getAnimations()
      .some((animation) =>
        ['block-size', 'height', 'width'].includes(
          (animation as Animation & { transitionProperty?: string }).transitionProperty ?? '',
        ),
      );
  if (moving) {
    const last = Number.parseFloat(item.style.getPropertyValue('--slotted-toast-height'));
    if (!Number.isNaN(last)) return last;
  }
  const inline = item.style.blockSize;
  item.style.blockSize = 'auto';
  const height = item.getBoundingClientRect().height;
  item.style.blockSize = inline;
  return height;
}

/**
 * The place transient messages appear, and the only part of this family a page
 * renders directly.
 *
 * **It is a landmark, not a live region.** A live role on a box holding a Close
 * and an Undo is read with both buttons inside the sentence, and a region
 * created in the same task as its text is silent under ARIA 1.2 §6.4. The
 * words are spoken by `packages/core/src/live-announcer`; this element is what
 * a reader navigates to, with the hotkey or with their own landmark list.
 *
 * **It never takes focus on its own.** The APG's Alert pattern is explicit that
 * a message must not affect the keyboard, and the whole of this family's claim
 * on it is one key the reader presses.
 */
export function ToastRegion({
  attach,
  children,
  container,
  defaultToasts,
  duration,
  hotkey,
  limit,
  messages,
  onToastsChange,
  pauseOnHover,
  pauseWhenHidden,
  placement,
  ref,
  stacking,
  swipe,
  toaster,
  toasts,
  ...nativeProps
}: ToastRegionProps) {
  const defaults = useToastDefaults();
  const shared = useToaster();
  const t = useMessages(toastMessages, messages);

  const resolvedAttach = attach ?? defaults.attach;
  const resolvedPlacement = placement ?? defaults.placement;
  const resolvedStacking = stacking ?? defaults.stacking;
  const resolvedSwipe = swipe ?? defaults.swipe;
  const resolvedHotkey = hotkey ?? defaults.hotkey;

  /**
   * A region the consumer's own array feeds cannot share the shared store: the
   * mode is decided once, for the life of the store, and the shared one is
   * uncontrolled by construction.
   */
  const controlled = toasts !== undefined;
  const [own] = useState(() =>
    controlled
      ? createToastStore<ToastContent>({
          toasts,
          defaultToasts: defaultToasts ?? [],
          limit: limit ?? defaults.limit,
          duration: duration ?? defaults.duration,
        })
      : null,
  );
  const store = own ?? (toaster ?? shared).store;

  useEffect(() => {
    store.configure({
      limit: limit ?? defaults.limit,
      duration: duration ?? defaults.duration,
      pauseOnHover: pauseOnHover ?? defaults.pauseOnHover,
      pauseWhenHidden: pauseWhenHidden ?? defaults.pauseWhenHidden,
    });
  }, [
    store,
    limit,
    duration,
    pauseOnHover,
    pauseWhenHidden,
    defaults.limit,
    defaults.duration,
    defaults.pauseOnHover,
    defaults.pauseWhenHidden,
  ]);

  useEffect(() => {
    if (onToastsChange === undefined) return;
    return store.onRequest((request) => onToastsChange(request.value, request));
  }, [store, onToastsChange]);

  useEffect(() => {
    if (controlled) store.sync(toasts);
  }, [store, controlled, toasts]);

  useEffect(() => () => own?.destroy(), [own]);

  const snapshot = useSyncExternalStore(
    store.subscribe,
    () => store.snapshot,
    () => store.snapshot,
  );

  const [node, setNode] = useState<HTMLElement | null>(null);
  const [origin, setOrigin] = useState<HTMLElement | null>(null);
  const [portal, setPortal] = useState<Element | null>(null);
  const cameFrom = useRef<HTMLElement | null>(null);

  /**
   * A portalled region inherits nothing from where it was written, so the
   * layer carries the four attributes of the region it came from. Every
   * surveyed implementation loses the theme here; in a library with one theme
   * that is invisible, and this one has three schemes and three densities.
   */
  useEffect(() => {
    if (resolvedAttach !== 'portal') {
      setPortal(null);
      return;
    }
    const handle = createPortalRoot({ origin, container: container ?? null });
    setPortal(handle.container);
    return () => handle.release();
  }, [resolvedAttach, origin, container]);

  /** The one key this family binds, and the only thing that moves focus here. */
  useEffect(() => {
    const doc = node?.ownerDocument ?? origin?.ownerDocument;
    if (!doc || snapshot.visible.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!matchesHotkey(event, resolvedHotkey)) return;
      const first = node?.querySelector<HTMLElement>('[data-part="item"]');
      if (!first) return;
      event.preventDefault();
      const active = doc.activeElement;
      cameFrom.current = active instanceof HTMLElement && !node?.contains(active) ? active : null;
      first.focus();
    };

    doc.addEventListener('keydown', onKeyDown);
    return () => doc.removeEventListener('keydown', onKeyDown);
  }, [node, origin, resolvedHotkey, snapshot.visible.length]);

  /**
   * Where the keyboard goes when the message it was in is taken away — by its
   * own control, or by a consumer's state update. Only React Aria answers this
   * at all, and only for its own close button; the third step, when no message
   * is left, is the one that is missing everywhere.
   */
  useEffect(() => {
    if (node === null) return;
    const handle = createRemovalFocus(node, {
      itemSelector: '[data-part="item"]',
      fallback: () => cameFrom.current,
    });
    return () => handle.destroy();
  }, [node]);

  /**
   * The pointer over the region and the keyboard inside it are the two pause
   * conditions the store cannot see for itself. The third — a hidden document
   * — is the store's own, because the Page Visibility API is not something two
   * bindings should each listen to.
   */
  const interacting = useRef({ pointer: false, focus: false });
  const report = useCallback(() => {
    store.setInteracting(interacting.current.pointer || interacting.current.focus);
  }, [store]);

  /**
   * Measured, and only for the pile. A column of messages that are not all the
   * same height cannot be opened from arithmetic alone, so each message's own
   * height and the room the messages in front of it take are written back as
   * the custom properties the stylesheet reads.
   */
  useEffect(() => {
    if (resolvedStacking !== 'stack' || node === null) return;
    const list = node.querySelector<HTMLElement>('[data-part="list"]');
    const view = node.ownerDocument.defaultView;
    if (!list || !view || typeof view.ResizeObserver !== 'function') return;

    const measure = () => {
      const items = [...list.querySelectorAll<HTMLElement>('[data-part="item"]')];
      const gap = Number.parseFloat(view.getComputedStyle(list).rowGap) || 0;
      let offset = 0;
      items.forEach((item, index) => {
        const height = naturalHeight(item);
        item.style.setProperty('--slotted-toast-height', `${height}px`);
        item.style.setProperty('--slotted-toast-stack-offset', `${offset}px`);
        if (index === 0) node.style.setProperty('--slotted-toast-front-height', `${height}px`);
        offset += height + gap;
      });
      /* The open pile's whole height, so its gaps are the region's. */
      node.style.setProperty('--slotted-toast-stack-height', `${Math.max(0, offset - gap)}px`);
    };

    const observer = new view.ResizeObserver(measure);
    for (const item of list.querySelectorAll('[data-part="item"]')) observer.observe(item);
    measure();
    return () => observer.disconnect();
  }, [node, resolvedStacking, snapshot.visible]);

  const style = {
    ...(nativeProps.style ?? {}),
    '--slotted-toast-count': snapshot.visible.length,
    '--slotted-toast-play-state': snapshot.paused ? 'paused' : 'running',
  } as CSSProperties;

  const region = (
    <ToastRegionContext.Provider
      value={{
        store,
        defaults,
        swipe: resolvedSwipe,
        swipeThreshold: defaults.swipeThreshold,
        placement: resolvedPlacement,
        cameFrom,
        t,
      }}
    >
      <section
        aria-label={t('label')}
        {...withSelectorKey(nativeProps, 'part', 'root')}
        data-attach={resolvedAttach}

        data-placement={resolvedPlacement}
        data-stacking={resolvedStacking}
        data-swipe={String(resolvedSwipe)}
        data-ui="toast"
        data-ui-toast=""
        {...(snapshot.paused ? { 'data-expanded': '' } : {})}
        onFocus={(event: FocusEvent<HTMLElement>) => {
          nativeProps.onFocus?.(event);
          interacting.current.focus = true;
          report();
        }}
        onBlur={(event: FocusEvent<HTMLElement>) => {
          nativeProps.onBlur?.(event);
          const next = event.relatedTarget;
          if (next === null || !event.currentTarget.contains(next)) {
            interacting.current.focus = false;
            report();
          }
        }}
        onPointerEnter={(event: ReactPointerEvent<HTMLElement>) => {
          nativeProps.onPointerEnter?.(event);
          interacting.current.pointer = true;
          report();
        }}
        onPointerLeave={(event: ReactPointerEvent<HTMLElement>) => {
          nativeProps.onPointerLeave?.(event);
          interacting.current.pointer = false;
          report();
        }}
        ref={(element: HTMLElement | null) => {
          setNode(element);
          if (typeof ref === 'function') ref(element as HTMLElement & null);
          else if (ref) ref.current = element as HTMLElement & null;
        }}
        role="region"
        style={style}
        tabIndex={nativeProps.tabIndex ?? -1}
      >
        <ol data-part="list" data-part-list="">
          {snapshot.visible.map((message, index) =>
            children ? (
              children(message)
            ) : (
              <Toast index={index} key={message.id} message={message} />
            ),
          )}
        </ol>
      </section>
    </ToastRegionContext.Provider>
  );

  /**
   * The marker is private DOM and it is the only thing this family renders
   * where it was written. It exists so the portalled region has an element to
   * read the theme, the scheme, the density and the direction from; without
   * one, a region opened inside a dark panel renders light at the end of the
   * document.
   */
  const marker = (
    <span
      aria-hidden="true"
      hidden
      ref={setOrigin}
      style={{ display: 'none' }}
      data-slotted-toast-origin=""
    />
  );

  if (resolvedAttach !== 'portal') return region;

  return (
    <>
      {marker}
      {portal === null ? null : createPortal(region, portal)}
    </>
  );
}

/** How many messages are waiting behind the limit, for a page that says so. */
export function useToastQueue(): { visible: number; queued: number; paused: boolean } {
  const { store } = useToastRegion();
  const snapshot = useSyncExternalStore(
    store.subscribe,
    () => store.snapshot,
    () => store.snapshot,
  );
  return {
    visible: snapshot.visible.length,
    queued: snapshot.queued.length,
    paused: snapshot.paused,
  };
}

export type { ToastMessage };
