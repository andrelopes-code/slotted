import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/navigation-menu/navigation-menu.css';

import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { navigationMenuMessages } from '@slotted/core/i18n';
import {
  createHoverIntent,
  focusTarget,
  measureViewport,
  motionBetween,
  writeGeometry,
} from '@slotted/core/navigation-menu';
import { createControllable } from '@slotted/core/state';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { FocusEvent, KeyboardEvent, PointerEvent } from 'react';

import { useMessages } from '../i18n';
import { useNavigationMenuDefaults } from './navigation-menu-defaults';
import type {
  NavigationMenuContextValue,
  NavigationMenuHandle,
  NavigationMenuProps,
  NavigationMenuRootProps,
  NavigationMenuValueReason,
} from './navigation-menu.types';

/** The gap the surface keeps from the window's edges when it is moved to fit. */
const GUTTER = 8;

const NavigationMenuContext = createContext<NavigationMenuContextValue | undefined>(undefined);

/** True inside a panel; a root rendered there is a second level. */
export const NavigationMenuContentContext = createContext(false);

/** What the root around this part says. Throws outside one. */
export function useNavigationMenu(): NavigationMenuContextValue {
  const context = useContext(NavigationMenuContext);
  if (context === undefined) {
    throw new Error('Every navigation-menu part must be rendered inside NavigationMenu.');
  }
  return context;
}

const SECTION = ':scope > [data-part="list"] > [data-part="item"]';

/**
 * The sections of a site or an application, each a button that shows a panel
 * of links under the row — or beside the column — with direct links beside
 * them.
 *
 * **One value.** `value` is the section that is open, on
 * `@slotted/core/state`; every way it moves — a click, a hover, a key, Escape,
 * a press outside, focus leaving, a link followed — asks with its reason.
 *
 * **The panel stays in its item.** Each `NavigationMenuContent` follows its
 * trigger in the DOM, which is the disclosure example's structure and what
 * lets Tab reach it. The root draws one surface after its list and writes the
 * open panel's measured size and place on itself
 * (`@slotted/core/navigation-menu`); the stylesheet lays the panel over the
 * surface and moves both on one interpolation.
 *
 * **Nested.** A `NavigationMenu` inside a panel is a second level: a `div`,
 * vertical, with no surface of its own, switching inside the outer panel.
 */
export function NavigationMenu({
  arrow,
  children,
  className,
  closeDelay,
  closeOnSelect,
  defaultValue,
  messages,
  onBlur,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
  onValueChange,
  openDelay,
  orientation,
  ref,
  render,
  size,
  style,
  value,
  ...nativeProps
}: NavigationMenuProps) {
  const defaults = useNavigationMenuDefaults();
  const outer = useContext(NavigationMenuContext);
  const inPanel = useContext(NavigationMenuContentContext);
  const nested = outer !== undefined && inPanel;
  const t = useMessages(navigationMenuMessages, messages);

  const resolvedArrow = arrow ?? defaults.arrow;
  const resolvedCloseDelay = closeDelay ?? defaults.closeDelay;
  const resolvedCloseOnSelect = closeOnSelect ?? defaults.closeOnSelect;
  const resolvedOpenDelay = openDelay ?? defaults.openDelay;
  const resolvedOrientation = orientation ?? (nested ? 'vertical' : 'horizontal');
  const resolvedSize = size ?? defaults.size;

  const [ownValue, setOwnValue] = useState<string | null>(defaultValue ?? null);
  const currentValue = value === undefined ? ownValue : value;
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [positioned, setPositioned] = useState(false);
  /** Whether the open section stands in this root's list, where the surface can reach it. */
  const [surfaced, setSurfaced] = useState(false);
  /** Each section's panel id, by value: a section another family moved out of the list still has one. */
  const panels = useRef(new Map<string, string>());
  const register = useCallback((itemValue: string, contentId: string) => {
    panels.current.set(itemValue, contentId);
    return () => {
      if (panels.current.get(itemValue) === contentId) panels.current.delete(itemValue);
    };
  }, []);
  /** The open section's panel, wherever it stands in the document. */
  const openPanel = useCallback((): HTMLElement | null => {
    const open = latest.current.currentValue;
    const id = open === null ? undefined : panels.current.get(open);
    return id === undefined ? null : (root?.ownerDocument.getElementById(id) ?? null);
  }, [root]);
  const [tick, setTick] = useState(0);
  const [motion, setMotion] = useState<NavigationMenuContextValue['motion']>({
    from: null,
    to: currentValue,
    enter: null,
    exit: null,
  });

  const latest = useRef({ currentValue, onValueChange, value });
  latest.current = { currentValue, onValueChange, value };

  const request = useCallback(
    (next: string | null, reason: NavigationMenuValueReason, source?: unknown) => {
      const state = createControllable<string | null>({
        controlled: latest.current.value,
        initial: latest.current.currentValue,
        onRequest: (change) => latest.current.onValueChange?.(change.value, change),
      });
      if (state.request(next, reason, source)) setOwnValue(next);
    },
    [],
  );

  /** Following a link closes every level, so a second level asks the outer root. */
  const select = useCallback(
    (source?: unknown) => {
      if (nested && outer !== undefined) outer.select(source);
      else request(null, 'select', source);
    },
    [nested, outer, request],
  );

  const remeasure = useCallback(() => setTick((value) => value + 1), []);

  /** The crossing between the section that left and the one that arrived. */
  const previous = useRef(currentValue);
  useLayoutEffect(() => {
    const from = previous.current;
    if (from === currentValue) return;
    previous.current = currentValue;
    const order =
      root === null
        ? []
        : [...root.querySelectorAll<HTMLElement>(SECTION)].map(
            (item) => item.dataset['value'] ?? '',
          );
    setMotion({ from, to: currentValue, ...motionBetween(order, from, currentValue) });
  }, [currentValue, root]);

  /** The surface, measured from the open panel and placed under (or beside) its trigger. */
  const opened = useRef(false);
  useLayoutEffect(() => {
    if (root === null) return;
    if (currentValue === null) {
      opened.current = false;
      return;
    }
    const item = root.querySelector<HTMLElement>(
      `${SECTION}[data-value="${CSS.escape(currentValue)}"]`,
    );
    const trigger = item?.querySelector<HTMLElement>(':scope > [data-part="trigger"]');
    const content = item?.querySelector<HTMLElement>(':scope > [data-part="content"]');
    /* A section moved out of the list — folded into another family's panel —
       opens where it stands, and the surface stays away. */
    setSurfaced(Boolean(trigger && content));
    if (!trigger || !content) {
      opened.current = false;
      return;
    }
    const geometry = measureViewport(root, trigger, content, resolvedOrientation, GUTTER);
    if (nested) {
      const list = root.querySelector<HTMLElement>(':scope > [data-part="list"]');
      geometry.blockSize = Math.max(geometry.blockSize, list?.offsetHeight ?? 0);
    }
    /* A first open writes its numbers while nothing transitions, then lets
       the stylesheet's transition back in for the next change of section. */
    const first = !opened.current;
    if (first) root.style.setProperty('transition', 'none');
    writeGeometry(root, geometry);
    if (first) {
      void root.offsetWidth;
      root.style.removeProperty('transition');
    }
    opened.current = true;
    setPositioned(true);
    if (nested) outer?.remeasure();
  }, [currentValue, nested, outer, resolvedOrientation, root, tick]);

  /** A panel that grows, a window that narrows, and fonts that arrive measure again. */
  useEffect(() => {
    if (root === null || currentValue === null || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const content = root.querySelector<HTMLElement>(
      `${SECTION}[data-value="${CSS.escape(currentValue)}"] > [data-part="content"]`,
    );
    const observer = new ResizeObserver(remeasure);
    if (content) observer.observe(content);
    const view = root.ownerDocument.defaultView;
    view?.addEventListener('resize', remeasure);
    return () => {
      observer.disconnect();
      view?.removeEventListener('resize', remeasure);
    };
  }, [currentValue, remeasure, root]);

  /** Escape and a press outside the root close the open section. */
  useEffect(() => {
    if (root === null || currentValue === null || nested) return undefined;
    const away = openPanel();
    const layer = createDismissableLayer(root, {
      ...(away !== null && !root.contains(away) ? { branches: [away] } : {}),
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      onDismiss: (dismissal) => {
        const reason: NavigationMenuValueReason =
          dismissal.reason === 'escape' ? 'escape' : 'outsidePress';
        const trigger = root.querySelector<HTMLElement>(
          `${SECTION}[data-value="${CSS.escape(latest.current.currentValue ?? '')}"] > [data-part="trigger"]`,
        );
        request(null, reason, dismissal.source);
        if (reason === 'escape') trigger?.focus();
      },
    });
    return () => layer.destroy();
  }, [currentValue, nested, openPanel, request, root]);

  /** The pointer: a delay to open, a switch without one, a delay to close. */
  const intent = useMemo(
    () =>
      createHoverIntent({
        openDelay: resolvedOpenDelay,
        closeDelay: resolvedCloseDelay,
        isOpen: () => latest.current.currentValue !== null,
        open: (next) => request(next, 'pointer'),
        close: () => request(null, 'pointer'),
      }),
    [request, resolvedCloseDelay, resolvedOpenDelay],
  );
  useEffect(() => () => intent.destroy(), [intent]);

  const hover = useCallback(
    (next: string, pointerType: string) => intent.enter(next, pointerType),
    [intent],
  );

  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    onPointerEnter?.(event as PointerEvent<HTMLElement & HTMLDivElement>);
    intent.stay();
  };

  const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
    onPointerLeave?.(event as PointerEvent<HTMLElement & HTMLDivElement>);
    if (!nested && event.pointerType !== 'touch') intent.leave();
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    onBlur?.(event as FocusEvent<HTMLElement & HTMLDivElement>);
    if (nested || root === null) return;
    const next = event.relatedTarget as Node | null;
    if (next !== null && (root.contains(next) || openPanel()?.contains(next))) return;
    if (latest.current.currentValue !== null) request(null, 'blur', event.nativeEvent);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event as KeyboardEvent<HTMLElement & HTMLDivElement>);
    if (event.defaultPrevented || root === null) return;
    const target = event.target as HTMLElement;
    const level = target.closest('[data-ui="navigation-menu"]');
    const owner = target.closest('[data-part="content"]')?.closest('[data-ui="navigation-menu"]');
    if (level !== root && owner !== root) return;
    const next = focusTarget(root, target, event.key, {
      orientation: resolvedOrientation,
      dir: getComputedStyle(root).direction === 'rtl' ? 'rtl' : 'ltr',
    });
    if (next === null) return;
    event.preventDefault();
    next.focus();
  };

  useImperativeHandle<NavigationMenuHandle, NavigationMenuHandle>(
    ref,
    () => ({
      open: (next) => request(next, 'programmatic'),
      close: () => request(null, 'programmatic'),
      focus: (target) => {
        if (root === null) return;
        const selector =
          target === undefined
            ? `${SECTION} > :is([data-part="trigger"], [data-part="link"])`
            : `${SECTION}[data-value="${CSS.escape(target)}"] > :is([data-part="trigger"], [data-part="link"])`;
        root.querySelector<HTMLElement>(selector)?.focus();
      },
      root,
    }),
    [request, root],
  );

  const context = useMemo<NavigationMenuContextValue>(
    () => ({
      arrow: resolvedArrow,
      closeOnSelect: resolvedCloseOnSelect,
      hover,
      motion,
      nested,
      orientation: resolvedOrientation,
      register,
      remeasure,
      request,
      root,
      select,
      value: currentValue,
    }),
    [
      currentValue,
      hover,
      motion,
      nested,
      register,
      remeasure,
      request,
      resolvedArrow,
      resolvedCloseOnSelect,
      resolvedOrientation,
      root,
      select,
    ],
  );

  const surface = nested ? null : (
    <div
      data-part="viewport"
      data-part-viewport=""
      {...(currentValue !== null && surfaced ? { 'data-open': '' } : {})}
      {...(positioned ? { 'data-positioned': '' } : {})}
    >
      {resolvedArrow ? <span aria-hidden="true" data-part="arrow" data-part-arrow="" /> : null}
    </div>
  );

  const rootProps: NavigationMenuRootProps = keyedProps({
    ...nativeProps,
    ...(nested ? {} : { 'aria-label': nativeProps['aria-label'] ?? t('navigation') }),
    children: (
      <>
        {children}
        {surface}
      </>
    ),
    className,
    ...(nested ? { 'data-nested': '' as const } : {}),
    'data-orientation': resolvedOrientation,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'navigation-menu',
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
    ref: setRoot,
    style,
  });

  const Element = nested ? 'div' : 'nav';

  return (
    <NavigationMenuContext.Provider value={context}>
      <NavigationMenuContentContext.Provider value={nested}>
        {render === undefined ? <Element {...rootProps} /> : render(rootProps)}
      </NavigationMenuContentContext.Provider>
    </NavigationMenuContext.Provider>
  );
}
