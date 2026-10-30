import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/app-shell/app-shell.css';

import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { createFocusScope, focusTarget } from '@slotted/core/focus';
import { appShellMessages } from '@slotted/core/i18n';
import { clamp, COMPACT_BELOW, createWidthGate } from '@slotted/core/measure';
import { setPortalContainer } from '@slotted/core/portal';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { createControllable } from '@slotted/core/state';
import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { useMessages } from '../i18n';
import { useAppShellDefaults } from './app-shell-defaults';
import { AppShellAside, AppShellMain, AppShellNav } from './app-shell-parts';
import type {
  AppShellAsideExtentReason,
  AppShellAsideOpenReason,
  AppShellContextValue,
  AppShellHandle,
  AppShellOpenReason,
  AppShellProps,
  AppShellRootProps,
} from './app-shell.types';

/**
 * The inline size the navigation stops being a column at. The stylesheet needs
 * it literal — `@container (inline-size: var(--x))` is invalid CSS — and the
 * script needs it to know whether `Escape`, the focus scope and `inert` are in
 * play. It is the limit of the compact size class, `COMPACT_BELOW`; the
 * contract states it once and `app-shell.styles.test.mjs` compares the
 * stylesheet's own condition against the same number.
 */
export const APP_SHELL_OVERLAY_AT = COMPACT_BELOW;

const AppShellContext = createContext<AppShellContextValue | undefined>(undefined);

type AppShellRegions = { nav: boolean; main: boolean; aside: boolean };

/**
 * The regions written among a shell's children, read from the element tree
 * rather than from the effects that register them. A shell nested inside is
 * not read: its regions are its own. A region a component of the page's
 * renders is not in the tree, and arrives by registration.
 */
function readRegions(node: ReactNode, found: AppShellRegions): AppShellRegions {
  if (Array.isArray(node)) {
    for (const child of node as ReactNode[]) readRegions(child, found);
    return found;
  }
  if (!isValidElement<{ children?: ReactNode }>(node) || node.type === AppShell) return found;
  if (node.type === AppShellMain) found.main = true;
  else if (node.type === AppShellNav) found.nav = true;
  else if (node.type === AppShellAside) found.aside = true;
  else readRegions(node.props.children, found);
  return found;
}

/**
 * What the shell around this part says. A part outside one has no regions to
 * belong to, no landmark to earn and no state to report, so this throws rather
 * than rendering a `div` that looks right and navigates nothing.
 */
export function useAppShell(): AppShellContextValue {
  const context = useContext(AppShellContext);
  if (context === undefined) {
    throw new Error('Every app-shell part must be rendered inside AppShell.');
  }
  return context;
}

/**
 * The shell around this element, or nothing. For a family that lives inside
 * the shell *or* on its own — `side-navigation` renders a `nav` landmark
 * standing alone and a `div` inside the shell's `nav` region, which is already
 * the landmark — and has to know which without throwing.
 */
export function useAppShellIfPresent(): AppShellContextValue | undefined {
  return useContext(AppShellContext);
}

/**
 * The outer frame of a route: the regions that do not change when the content
 * does.
 *
 * **The layer is composed from `packages/core` and rewritten nowhere.**
 * `measure` answers the shell's own inline size, `dismissable-layer` owns
 * `Escape`, the outside press and the single stack, `focus` contains the
 * keyboard and gives it back to the toggle, and `portal` is told once that this
 * shell is where an overlay belongs.
 *
 * **`auto` is answered twice, and it has to be.** The stylesheet answers it in
 * a container query, so the wide layout is correct before any script runs; the
 * script answers it again because `Escape`, the focus scope and `inert` are not
 * things CSS can hold. The number lives in the contract so the two cannot
 * disagree.
 */
export function AppShell({
  asideExtent,
  asideMode,
  asideOpen,
  asideSize,
  canvas,
  children,
  className,
  closeOnNavigate,
  collapsedTo,
  defaultAsideExtent,
  defaultAsideOpen,
  defaultNavOpen,
  escape,
  back,
  maxAsideExtent,
  messages,
  minAsideExtent,
  modal,
  navMode,
  navOpen,
  navSide,
  navSize,
  onAsideExtentChange,
  onAsideOpenChange,
  onNavOpenChange,
  outsidePress,
  primary,
  ref,
  render,
  scroll,
  separation,
  style,
  ...nativeProps
}: AppShellProps) {
  const defaults = useAppShellDefaults();
  const baseId = useId();

  const [ownOpen, setOwnOpen] = useState<boolean>(defaultNavOpen ?? true);
  const currentOpen = navOpen ?? ownOpen;
  const [ownAsideOpen, setOwnAsideOpen] = useState<boolean>(defaultAsideOpen ?? true);
  const currentAsideOpen = asideOpen ?? ownAsideOpen;
  const [ownAsideExtent, setOwnAsideExtent] = useState<number | undefined>(defaultAsideExtent);
  const currentAsideExtent = asideExtent ?? ownAsideExtent;
  const resolvedMinAsideExtent = clamp(minAsideExtent ?? 0.16, 0, 1);
  const resolvedMaxAsideExtent = clamp(maxAsideExtent ?? 0.6, resolvedMinAsideExtent, 1);
  const [asideDragging, setAsideDragging] = useState(false);

  const resolvedAsideSize = asideSize ?? defaults.asideSize;
  const wantedAsideMode = asideMode ?? defaults.asideMode;
  const resolvedCanvas = canvas ?? defaults.canvas;
  const resolvedCloseOnNavigate = closeOnNavigate ?? defaults.closeOnNavigate;
  const resolvedCollapsedTo = collapsedTo ?? defaults.collapsedTo;
  const resolvedSeparation = separation ?? defaults.separation;
  const resolvedEscape = escape ?? defaults.escape;
  const resolvedBack = back ?? defaults.back;
  const resolvedModal = modal ?? defaults.modal;
  const resolvedNavSide = navSide ?? defaults.navSide;
  const resolvedNavSize = navSize ?? defaults.navSize;
  const resolvedOutsidePress = outsidePress ?? defaults.outsidePress;
  const resolvedPrimary = primary ?? defaults.primary;
  const resolvedScroll = scroll ?? defaults.scroll;
  const wantedMode = navMode ?? defaults.navMode;

  const t = useMessages(appShellMessages, messages);

  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [narrow, setNarrow] = useState<boolean | undefined>(undefined);

  /**
   * The resolved mode. `undefined` until the gate has measured, which is what
   * keeps `data-nav-mode` off the root through a server render: below the
   * breakpoint the stylesheet shows the overlaid panel only under
   * `[data-nav-mode='overlay'][data-open]`, so the frame before hydration draws
   * the narrow shell closed — the safe half of the answer.
   */
  const resolvedMode =
    wantedMode !== 'auto'
      ? wantedMode
      : narrow === undefined
        ? undefined
        : narrow
          ? 'overlay'
          : 'inline';

  /** The pane's mode, resolved the same way against the same width. */
  const resolvedAsideMode =
    wantedAsideMode !== 'auto'
      ? wantedAsideMode
      : narrow === undefined
        ? undefined
        : narrow
          ? 'overlay'
          : 'inline';

  const nodes = useRef({
    aside: null as HTMLElement | null,
    asideToggle: null as HTMLElement | null,
    banner: null as HTMLElement | null,
    footer: null as HTMLElement | null,
    main: null as HTMLElement | null,
    nav: null as HTMLElement | null,
    toggle: null as HTMLElement | null,
  });

  const [registeredRegions, setRegions] = useState<AppShellRegions>({
    nav: false,
    main: false,
    aside: false,
  });
  const [registered, setRegistered] = useState(false);

  /**
   * The regions register in effects, and the shell's own effect runs after
   * theirs in the same commit. Until it has — on the server, and in the render
   * hydration compares against it — the skip links come from the regions
   * written among the children, so both renders agree; registration then
   * takes over.
   */
  useEffect(() => setRegistered(true), []);
  const regions = registered
    ? registeredRegions
    : readRegions(children, { nav: false, main: false, aside: false });

  const [busy, setBusy] = useState(false);

  const register = useCallback<AppShellContextValue['register']>((region) => {
    setRegions((current) => ({ ...current, [region]: true }));
    return () => setRegions((current) => ({ ...current, [region]: false }));
  }, []);

  const setOpen = useCallback(
    (next: boolean, reason: AppShellOpenReason, source?: unknown) => {
      if (next === currentOpen) return;

      let cancelled = false;
      const state = createControllable<boolean>({
        controlled: navOpen,
        initial: currentOpen,
        onRequest: (raw) => {
          cancelled = raw.cancelled;
          onNavOpenChange?.(raw.value, {
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

      const moved = state.request(next, reason, source);
      if (cancelled) return;
      if (moved) setOwnOpen(next);
    },
    [currentOpen, navOpen, onNavOpenChange],
  );

  const setAsideOpen = useCallback(
    (next: boolean, reason: AppShellAsideOpenReason, source?: unknown) => {
      if (next === currentAsideOpen) return;

      let cancelled = false;
      const state = createControllable<boolean>({
        controlled: asideOpen,
        initial: currentAsideOpen,
        onRequest: (raw) => {
          cancelled = raw.cancelled;
          onAsideOpenChange?.(raw.value, {
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

      const moved = state.request(next, reason, source);
      if (cancelled) return;
      if (moved) setOwnAsideOpen(next);
    },
    [asideOpen, currentAsideOpen, onAsideOpenChange],
  );

  /**
   * The pane's extent, held inside the limits. `undefined` travels whole: it is
   * the pane back on its size step, and a clamp of it would be a clamp of a
   * value that is not a fraction.
   */
  const setAsideExtent = useCallback(
    (next: number | undefined, reason: AppShellAsideExtentReason, source?: unknown) => {
      const wanted =
        next === undefined
          ? undefined
          : clamp(next, resolvedMinAsideExtent, resolvedMaxAsideExtent);
      if (wanted === currentAsideExtent) return;

      let cancelled = false;
      const state = createControllable<number | undefined>({
        controlled: asideExtent,
        initial: currentAsideExtent,
        onRequest: (raw) => {
          cancelled = raw.cancelled;
          onAsideExtentChange?.(raw.value, {
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

      const moved = state.request(wanted, reason, source);
      if (cancelled) return;
      if (moved) setOwnAsideExtent(wanted);
    },
    [
      asideExtent,
      currentAsideExtent,
      onAsideExtentChange,
      resolvedMaxAsideExtent,
      resolvedMinAsideExtent,
    ],
  );

  /**
   * The shell answers its own inline size and not the window's, which is what
   * makes a shell inside a splitter, a preview frame or a Storybook stage
   * behave like the narrow window it is the width of — and what answers a 400%
   * zoom, where a 1280-pixel window is 320 pixels of CSS.
   */
  const measures = wantedMode === 'auto' || wantedAsideMode === 'auto';
  useEffect(() => {
    if (root === null || !measures) {
      if (!measures) setNarrow(undefined);
      return undefined;
    }
    const gate = createWidthGate(root, { at: APP_SHELL_OVERLAY_AT, onChange: setNarrow });
    setNarrow(gate.narrow());
    return () => gate.destroy();
  }, [root, measures]);

  /**
   * Crossing into the overlaid mode with the region open closes it, and says
   * `resize` while doing so. That is the whole argument for the reason: a
   * product persisting the reader's own choice writes
   * `if (reason !== 'resize') persist(next)` and keeps the wide preference
   * through every narrow window the reader ever opens.
   */
  /**
   * Crossing back out restores what the crossing in closed, and says `resize`
   * again. The flag records only a close the width made: a region the reader
   * closed while wide stays closed through a narrow window and back.
   */
  const wasOverlay = useRef(resolvedMode === 'overlay');
  const closedByResize = useRef(false);
  useEffect(() => {
    const overlay = resolvedMode === 'overlay';
    const entered = overlay && !wasOverlay.current;
    const left = !overlay && wasOverlay.current;
    wasOverlay.current = overlay;
    if (resolvedMode === undefined) return;
    if (overlay && currentOpen && (entered || narrow === true)) {
      closedByResize.current = true;
      setOpen(false, 'resize');
    } else if (left && closedByResize.current) {
      closedByResize.current = false;
      if (!currentOpen) setOpen(true, 'resize');
    }
    /* Only the crossing matters: re-running on every open would close a region
       the reader had just asked for, so the list is deliberately the mode
       alone. */
  }, [resolvedMode]);

  const asideWasOverlay = useRef(resolvedAsideMode === 'overlay');
  const asideClosedByResize = useRef(false);
  useEffect(() => {
    const overlay = resolvedAsideMode === 'overlay';
    const entered = overlay && !asideWasOverlay.current;
    const left = !overlay && asideWasOverlay.current;
    asideWasOverlay.current = overlay;
    if (resolvedAsideMode === undefined) return;
    if (overlay && currentAsideOpen && (entered || narrow === true)) {
      asideClosedByResize.current = true;
      setAsideOpen(false, 'resize');
    } else if (left && asideClosedByResize.current) {
      asideClosedByResize.current = false;
      if (!currentAsideOpen) setAsideOpen(true, 'resize');
    }
  }, [resolvedAsideMode]);

  /**
   * The overlaid region is a dismissable layer with a focus scope over it.
   * `@slotted/core/dismissable-layer` inerts every sibling of the layer while
   * it is modal, which is the whole of the modal contract: the reader is in the
   * panel, and the ways out are `Escape`, the veil, a destination, and whatever
   * control the consumer put inside the panel. The toggle in the banner is
   * inert with the rest of the shell, exactly as a dialog's trigger is — and it
   * is registered as a *branch* so that pressing it the frame after the layer
   * closes is not read as a press outside.
   *
   * No surveyed implementation inerts anything: Vaadin and PatternFly draw the
   * veil and leave what is under it operable.
   */
  /**
   * A region nobody rendered has no open state to draw: no `data-open`, no
   * layer and no veil. Until the regions have registered — the server render
   * and the render hydration compares against — `data-open` takes the region
   * as present, so a navigation a component of the page renders is not drawn
   * closed for one frame; the layer and the veil read the regions written
   * among the children, so a veil is never mounted for a region that is not.
   */
  const navShownOpen = currentOpen && (!registered || registeredRegions.nav);
  const overlay = resolvedMode === 'overlay' && currentOpen && regions.nav;
  const asideOverlay = resolvedAsideMode === 'overlay' && currentAsideOpen && regions.aside;

  /**
   * The veil has a presence of its own, as a dialog's backdrop does. The
   * stylesheet fades it in from `entering` and out through `exiting`, and a
   * veil mounted straight at `open` gave that transition no closed style to
   * start from: it appeared in one frame beside a panel that took two hundred
   * milliseconds to arrive, and left the same way. One presence for both
   * layers, because there is one veil: with both regions overlaid and both
   * open it stays, and it leaves when the last of them does.
   */
  const veil = (overlay || asideOverlay) && resolvedModal;
  const [veilStatus, setVeilStatus] = useState<PresenceStatus>(veil ? 'open' : 'unmounted');
  const veilPresence = useRef<PresenceHandle | null>(null);
  if (veilPresence.current === null) {
    veilPresence.current = createPresence({ present: veil, onStatusChange: setVeilStatus });
  }
  useEffect(() => {
    veilPresence.current?.sync(veil);
  }, [veil]);
  /* Stopped, not destroyed: StrictMode mounts again on the same handle. */
  useEffect(() => {
    const handle = veilPresence.current;
    return () => handle?.stop();
  }, []);
  const setVeil = useCallback((node: HTMLDivElement | null) => {
    veilPresence.current?.setNode(node);
  }, []);

  /**
   * One layer per region, and the same three modules for both. The pane's
   * layer is the navigation's with the region, the trigger and the request
   * swapped; `@slotted/core/dismissable-layer` keeps one stack, so with both
   * open — only possible with both modes forced — `Escape` reaches the topmost.
   */
  const raise = useCallback(
    (
      panel: HTMLElement,
      trigger: HTMLElement | null,
      siblings: (HTMLElement | null)[],
      close: (reason: AppShellAsideOpenReason, source: unknown) => void,
    ) => {
      const dismissable = createDismissableLayer(panel, {
        ...(trigger === null ? {} : { branches: [trigger] }),
        /* A history entry is a modal layer's: a layer the page stays reachable
           under has no claim on the way back. */
        back: resolvedModal && resolvedBack === 'close',
        content: panel,
        escape: resolvedEscape === 'close',
        modal: resolvedModal,
        onDismiss: (request) => {
          if (request.reason === 'outsidePress' && resolvedOutsidePress === 'none') {
            return request.cancel();
          }
          close(request.reason as AppShellAsideOpenReason, request.source);
        },
        outsidePress: resolvedOutsidePress === 'close',
        outsidePressEvent: 'click',
      });

      const scope = createFocusScope(panel, {
        contain: resolvedModal,
        initial: 'first',
        ...(trigger === null ? {} : { restore: () => trigger }),
      });
      scope.enter();

      const inerted = resolvedModal
        ? siblings.filter((node): node is HTMLElement => node !== null)
        : [];
      /* `inert` on the banner as well: the toggle inside it is the one control
         that must stay pressable, so it is excluded by the layer rather than by
         leaving the whole region reachable. */
      for (const node of inerted) {
        if (trigger !== null && node.contains(trigger)) continue;
        node.setAttribute('inert', '');
      }

      return () => {
        for (const node of inerted) node.removeAttribute('inert');
        scope.destroy();
        dismissable.destroy();
      };
    },
    [resolvedBack, resolvedEscape, resolvedModal, resolvedOutsidePress],
  );

  useEffect(() => {
    const panel = nodes.current.nav;
    if (!overlay || panel === null) return undefined;
    const { aside, banner, footer, main, toggle } = nodes.current;
    return raise(panel, toggle, [banner, main, aside, footer], (reason, source) =>
      setOpen(false, reason, source),
    );
  }, [overlay, raise, setOpen]);

  useEffect(() => {
    const panel = nodes.current.aside;
    if (!asideOverlay || panel === null) return undefined;
    const { asideToggle, banner, footer, main, nav } = nodes.current;
    return raise(panel, asideToggle, [banner, main, nav, footer], (reason, source) =>
      setAsideOpen(false, reason, source),
    );
  }, [asideOverlay, raise, setAsideOpen]);

  /**
   * A click that lands on an `a[href]` inside the region asks to close, in the
   * overlaid mode only. Vaadin and PatternFly both do it, and without it a
   * phone costs two taps per destination. `defaultPrevented` is no refusal
   * here: a client-side router prevents the native navigation of every link it
   * routes. A disabled destination (`aria-disabled="true"`) stays open; any
   * other refusal cancels the request.
   */
  const onRootClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      nativeProps.onClick?.(event as never);
      if (!overlay || !resolvedCloseOnNavigate) return;
      const target = event.target as Element | null;
      const link = target?.closest?.('a[href]');
      if (link === null || link === undefined) return;
      if (nodes.current.nav?.contains(link) !== true) return;
      if (link.getAttribute('aria-disabled') === 'true') return;
      setOpen(false, 'select', event.nativeEvent);
    },
    [nativeProps, overlay, resolvedCloseOnNavigate, setOpen],
  );

  /** The application's portal root, named once so every overlay under it lands here. */
  const [layer, setLayer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (layer === null) return undefined;
    setPortalContainer(layer);
    return () => setPortalContainer(null, layer.ownerDocument);
  }, [layer]);

  useImperativeHandle<AppShellHandle, AppShellHandle>(
    ref as never,
    () => ({
      openNav: () => setOpen(true, 'programmatic'),
      closeNav: () => setOpen(false, 'programmatic'),
      openAside: () => setAsideOpen(true, 'programmatic'),
      closeAside: () => setAsideOpen(false, 'programmatic'),
      focusMain: () => {
        if (nodes.current.main) focusTarget(nodes.current.main);
      },
      get root() {
        return root;
      },
    }),
    [root, setAsideOpen, setOpen],
  );

  const mainId = `${baseId}main`;
  const navId = `${baseId}nav`;
  const asideId = `${baseId}aside`;

  const context = useMemo<AppShellContextValue>(
    () => ({
      asideDragging,
      asideExtent: currentAsideExtent,
      asideId,
      asideMode: resolvedAsideMode,
      asideOpen: currentAsideOpen,
      asideSize: resolvedAsideSize,
      asideToggleId: `${baseId}aside-toggle`,
      canvas: resolvedCanvas,
      closeOnNavigate: resolvedCloseOnNavigate,
      collapsedTo: resolvedCollapsedTo,
      escape: resolvedEscape,
      back: resolvedBack,
      busy,
      mainId,
      maxAsideExtent: resolvedMaxAsideExtent,
      minAsideExtent: resolvedMinAsideExtent,
      modal: resolvedModal,
      navId,
      navMode: resolvedMode,
      navSide: resolvedNavSide,
      navSize: resolvedNavSize,
      nodes: nodes.current,
      open: currentOpen,
      outsidePress: resolvedOutsidePress,
      primary: resolvedPrimary,
      register,
      root,
      scroll: resolvedScroll,
      separation: resolvedSeparation,
      setAsideDragging,
      setBusy,
      setAsideExtent,
      setAsideOpen,
      setOpen,
      t,
      toggleId: `${baseId}toggle`,
    }),
    [
      asideDragging,
      asideId,
      baseId,
      busy,
      currentAsideExtent,
      currentAsideOpen,
      currentOpen,
      mainId,
      navId,
      register,
      resolvedAsideMode,
      resolvedAsideSize,
      resolvedCanvas,
      resolvedCloseOnNavigate,
      resolvedCollapsedTo,
      resolvedBack,
      resolvedEscape,
      resolvedMode,
      resolvedModal,
      resolvedNavSide,
      resolvedNavSize,
      resolvedOutsidePress,
      resolvedPrimary,
      resolvedScroll,
      resolvedSeparation,
      resolvedMaxAsideExtent,
      resolvedMinAsideExtent,
      root,
      setAsideExtent,
      setAsideOpen,
      setOpen,
      t,
    ],
  );

  /**
   * One anchor per region that has a target, because a link to a region nobody
   * rendered is a dead destination. The banner gets none: it is before all
   * three in the focus order.
   */
  const skipLinks: ReactNode[] = [];
  if (regions.main) {
    skipLinks.push(
      <a
        key="main"
        href={`#${mainId}`}
        onClick={() => {
          if (nodes.current.main) focusTarget(nodes.current.main);
        }}
      >
        {t('skipToMain')}
      </a>,
    );
  }
  if (regions.nav) {
    skipLinks.push(
      <a key="nav" href={`#${navId}`}>
        {t('skipToNav')}
      </a>,
    );
  }
  /* A link to a pane the reader closed is a dead destination. */
  if (regions.aside && currentAsideOpen) {
    skipLinks.push(
      <a key="aside" href={`#${asideId}`}>
        {t('skipToAside')}
      </a>,
    );
  }

  const rootProps: AppShellRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {skipLinks.length > 0 ? (
          <div data-part="skip" data-part-skip="">
            {skipLinks}
          </div>
        ) : null}
        {children}
        {veilStatus === 'unmounted' ? null : (
          <div data-part="scrim" data-part-scrim="" data-status={veilStatus} ref={setVeil} />
        )}
        <div data-part="layer" data-part-layer="" ref={setLayer} />
      </>
    ),
    className,
    ...(resolvedAsideMode === undefined ? {} : { 'data-aside-mode': resolvedAsideMode }),
    'data-aside-size': resolvedAsideSize,
    'data-canvas': resolvedCanvas,
    'data-collapsed-to': resolvedCollapsedTo,
    ...(asideDragging ? { 'data-dragging': '' as const } : {}),
    ...(resolvedMode === undefined ? {} : { 'data-nav-mode': resolvedMode }),
    'data-nav-side': resolvedNavSide,
    'data-nav-size': resolvedNavSize,
    ...(navShownOpen ? { 'data-open': '' as const } : {}),
    'data-part': 'root',
    'data-primary': resolvedPrimary,
    'data-scroll': resolvedScroll,
    'data-separation': resolvedSeparation,
    'data-ui': 'app-shell',
    onClick: onRootClick,
    style,
  });

  return (
    <AppShellContext.Provider value={context}>
      {render === undefined ? (
        <div {...rootProps} ref={setRoot} />
      ) : (
        render({ ...rootProps, ref: setRoot })
      )}
    </AppShellContext.Provider>
  );
}
