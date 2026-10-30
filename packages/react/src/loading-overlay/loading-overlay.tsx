import { keyedProps, selectorKeyProps } from '@slotted/core/selector-key';
import '@slotted/styles/loading-overlay/loading-overlay.css';
import '@slotted/styles/progress-indicator/progress-indicator.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { createFocusScope } from '@slotted/core/focus';
import { loadingOverlayMessages } from '@slotted/core/i18n';
import { createPortalRoot } from '@slotted/core/portal';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useMessages } from '../i18n';
import { Loader } from '../progress-indicator';
import { useLoadingOverlayDefaults } from './loading-overlay-defaults';
import { useLoadingVisibility } from './use-loading-visibility';
import type {
  LoadingOverlayCancelProps,
  LoadingOverlayCancelReason,
  LoadingOverlayProps,
  LoadingOverlayRootProps,
} from './loading-overlay.types';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports
 * the click count. `Enter` and `Space` on the control therefore arrive as
 * `dismiss` like a press does, because both are the reader pressing the
 * control — the reason vocabulary tells a press apart from the key that
 * dismisses a layer, not one press from another.
 */
const PRESS: LoadingOverlayCancelReason = 'dismiss';

/**
 * A region of the page taken out of reach while a wait the consumer owns runs.
 *
 * The content stays: in the document, measured, and the thing the region's
 * geometry comes from. That is the whole difference from `skeleton`, which
 * stands in for content that has not arrived, and the reason this family
 * writes `inert` rather than replacing anything.
 *
 * Four things are composed rather than written here. `@slotted/core/loading`
 * decides when the layer is painted; `@slotted/core/presence` keeps the panel
 * in the document through the wash's exit; `@slotted/core/focus` moves focus
 * out of the content before it goes inert and puts it back after; and, in page
 * scope, `@slotted/core/dismissable-layer` in modal mode makes the rest of the
 * document inert and locks its scroll.
 */
export function LoadingOverlay({
  cancelLabel,
  cancellable = false,
  children,
  container,
  delay,
  description,
  indicator,
  live,
  loadedLabel,
  loading = true,
  messages,
  minDuration,
  onCancel,
  onReveal,
  render,
  renderCancel,
  scope = 'region',
  size,
  veil,
  ...nativeProps
}: LoadingOverlayProps) {
  const defaults = useLoadingOverlayDefaults();
  const t = useMessages(loadingOverlayMessages, messages);
  const resolved = {
    cancelLabel: cancelLabel ?? t('cancel'),
    delay: delay ?? defaults.delay ?? 0,
    label: t('label'),
    live: live ?? defaults.live ?? 'polite',
    loadedLabel: loadedLabel ?? defaults.loadedLabel,
    minDuration: minDuration ?? defaults.minDuration ?? 0,
    size: size ?? defaults.size ?? 'md',
    veil: veil ?? defaults.veil ?? 'wash',
  };

  const painted = useLoadingVisibility({
    delay: resolved.delay,
    loading,
    minDuration: resolved.minDuration,
    onWithdraw: onReveal,
  });

  const emitCancel = useCallback(
    (reason: LoadingOverlayCancelReason, source: MouseEvent | KeyboardEvent | Event) => {
      onCancel?.({ reason, source: source as never });
    },
    [onCancel],
  );

  /* ── The panel's stay in the document ──────────────────────────────────
   *
   * The wash is in the document for the life of the family, because a
   * transition needs a style the browser computed last and a node that has
   * just been mounted has none. The panel is not: `presence` mounts it while
   * the layer is painted and holds it through the wash's own exit, so nothing
   * turns a mark nobody is looking at and a resting layer holds no control for
   * Tab to find.
   */
  const [scrim, setScrim] = useState<HTMLDivElement | null>(null);
  const presence = useRef<PresenceHandle>(undefined);
  const [, setStatus] = useState<PresenceStatus>(painted ? 'open' : 'unmounted');
  presence.current ??= createPresence({ present: painted, onStatusChange: setStatus });

  useEffect(() => {
    presence.current?.setNode(scrim);
  }, [scrim]);
  useEffect(() => {
    presence.current?.sync(painted);
  }, [painted]);
  /* Stopped, not destroyed: StrictMode mounts again on the same handle. */
  useEffect(() => {
    const handle = presence.current;
    return () => handle?.stop();
  }, []);

  const mounted = presence.current.mounted;

  /* ── Where focus goes, and where it comes back to ───────────────────────
   *
   * The defect none of the surveyed implementations has, because none of them
   * makes anything inert: making an element inert while it holds focus drops
   * focus to the body, and the reader who was typing loses their place.
   *
   * Focus is read before the content goes inert. If it was inside, it moves
   * into the panel — the control when there is one, the panel itself
   * otherwise, which is the `'container'` destination the APG advises for
   * content that has to be read before it is operated. If it was somewhere
   * else, nothing moves: a background save does not take the caret out of
   * another form.
   */
  const content = useRef<HTMLDivElement | null>(null);
  const cancel = useRef<HTMLButtonElement | null>(null);
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!painted || panel === null) return undefined;

    const active = panel.ownerDocument.activeElement;
    const displaced =
      scope === 'page' || (active !== null && (content.current?.contains(active) ?? false));
    if (!displaced) return undefined;

    const focus = createFocusScope(panel, {
      contain: scope === 'page',
      initial: cancellable ? () => cancel.current : 'container',
    });
    focus.enter();
    return () => focus.destroy();
  }, [cancellable, painted, panel, scope]);

  /* ── The rest of the document, in page scope ────────────────────────────
   *
   * `dismissable-layer` in modal mode already owns every part of this: it
   * writes `inert` on every sibling of the portal root, locks the document
   * scroll, and takes `Escape` in the capture phase. Outside press is refused
   * outright — a press on the wash is a reader trying to reach what is behind
   * it, and the operation has not finished.
   */
  const [layer, setLayer] = useState<Element | null>(null);
  useEffect(() => {
    if (scope !== 'page') return undefined;
    const root = createPortalRoot(container === undefined ? {} : { container });
    setLayer(root.container);
    return () => {
      setLayer(null);
      root.release();
    };
  }, [container, scope]);

  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (scope !== 'page' || root === null || !painted) return undefined;

    const handle = createDismissableLayer(root, {
      escape: cancellable,
      modal: true,
      onDismiss: (request) => {
        if (request.reason !== 'escape') return;
        emitCancel('escape', request.source as Event);
      },
      outsidePress: false,
      ...(panel === null ? {} : { content: panel }),
    });
    return () => handle.destroy();
  }, [cancellable, emitCancel, painted, panel, root, scope]);

  /**
   * `Escape` in region scope, where there is no dismissable layer to take it.
   * The listener is on the layer rather than on the document, so the key only
   * asks when focus is inside the thing it is about: an overlay covering a
   * card in the corner of a page has no claim on a key pressed elsewhere.
   */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!cancellable || event.key !== 'Escape') return;
    event.stopPropagation();
    emitCancel('escape', event);
  };

  const announcement = painted ? resolved.label : (resolved.loadedLabel ?? '');

  const cancelProps: LoadingOverlayCancelProps = {
    children: resolved.cancelLabel,
    'data-part': 'cancel',
    ...selectorKeyProps('part', 'cancel'),
    onClick: (event) => emitCancel(PRESS, event),
    ref: cancel,
    type: 'button',
  };

  const panelContent = (
    <div data-part="panel" data-part-panel="" ref={setPanel} tabIndex={-1}>
      <span
        data-part="indicator"
        data-part-indicator=""
        {...(indicator === undefined ? { 'data-default': '' } : {})}
      >
        {indicator ?? <Loader contained decorative size={resolved.size} />}
      </span>
      {/* The two lines are painted and not announced: the live region above
          already holds the same sentence, and a screen reader should hear a
          wait once. */}
      <span aria-hidden="true" data-part="label" data-part-label="">
        {resolved.label}
      </span>
      {description === undefined ? null : (
        <span aria-hidden="true" data-part="description" data-part-description="">
          {description}
        </span>
      )}
      {!cancellable ? null : renderCancel === undefined ? (
        <button {...cancelProps} />
      ) : (
        renderCancel(cancelProps)
      )}
    </div>
  );

  const body: ReactNode = (
    <>
      {resolved.live === 'off' ? null : (
        <span
          data-part="announcement"
          data-part-announcement=""
          data-ui="visually-hidden"
          data-ui-visually-hidden=""
          role="status"
        >
          {announcement}
        </span>
      )}
      {scope === 'page' ? null : (
        <div
          data-part="content"
          data-part-content=""
          ref={content}
          {...(painted ? { inert: true } : {})}
        >
          {children}
        </div>
      )}
      <div
        data-part="scrim"
        data-part-scrim=""
        onKeyDown={onKeyDown}
        ref={setScrim}
        {...(painted ? { 'data-loading': '' } : {})}
      >
        {mounted ? panelContent : null}
      </div>
    </>
  );

  const rootProps: LoadingOverlayRootProps = keyedProps({
    ...nativeProps,
    /* ARIA 1.2 asks for it on the region until it is finished loading. Page
       scope writes it nowhere: the busy region would be the document root, and
       this family owns no part of it. */
    ...(scope === 'region' && painted ? { 'aria-busy': true } : {}),
    children: body,
    'data-part': 'root',
    'data-scope': scope,
    'data-size': resolved.size,
    'data-ui': 'loading-overlay',
    'data-veil': resolved.veil,
    ...(painted ? { 'data-loading': '' } : {}),
  });

  const element =
    render === undefined ? (
      <div {...rootProps} ref={setRoot} />
    ) : (
      render({ ...rootProps, ref: setRoot })
    );

  if (scope !== 'page') return element;
  return layer === null ? null : createPortal(element, layer);
}
