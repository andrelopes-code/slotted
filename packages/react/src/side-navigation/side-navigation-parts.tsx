import { definedProps, keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { createPortalRoot } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { truncateMiddle } from '@slotted/core/text';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { FocusEvent, MouseEvent, ReactNode, Ref } from 'react';
import { createPortal } from 'react-dom';

import { Glyph, Icon } from '../icon';
import { Skeleton } from '../skeleton';
import { Tooltip } from '../tooltip';
import { TooltipContent, TooltipLayer, TooltipTrigger } from '../tooltip/tooltip-parts';
import { useSideNavigation } from './side-navigation';
import type {
  SideNavigationDividerProps,
  SideNavigationFlyoutReason,
  SideNavigationGroupProps,
  SideNavigationGroupRootProps,
  SideNavigationItemContextValue,
  SideNavigationItemProps,
  SideNavigationItemRootProps,
  SideNavigationLinkProps,
  SideNavigationLinkRootProps,
  SideNavigationListProps,
  SideNavigationPartProps,
  SideNavigationSkeletonProps,
  SideNavigationSpanPartProps,
  SideNavigationTriggerProps,
  SideNavigationTriggerRootProps,
} from './side-navigation.types';

/** Two refs on one element: the family's, and whatever the consumer passed. */
function attach<T>(node: T, ...refs: (Ref<T> | undefined)[]) {
  for (const ref of refs) {
    if (typeof ref === 'function') ref(node);
    else if (ref !== null && ref !== undefined) ref.current = node;
  }
}

/**
 * A click synthesised by the keyboard reports no detail; a real one reports
 * the click count. It is why `Enter` and a pointer are told apart without a
 * key listener existing for the row — the platform keeps the key.
 */
function activationReason(event: MouseEvent) {
  return event.detail === 0 ? ('keyboard' as const) : ('pointer' as const);
}

const ItemContext = createContext<SideNavigationItemContextValue | undefined>(undefined);

/** What the item around this part says. Throws outside one. */
export function useSideNavigationItem(): SideNavigationItemContextValue {
  const context = useContext(ItemContext);
  if (context === undefined) {
    throw new Error(
      'SideNavigationLink, SideNavigationTrigger, SideNavigationGroup and the parts of a row must be rendered inside SideNavigationItem.',
    );
  }
  return context;
}

/** The item above, or nothing at the top level. */
function useParentItem(): SideNavigationItemContextValue | undefined {
  return useContext(ItemContext);
}

/* ── Section, its title, and a list ─────────────────────────────────────── */

/** A titled run of destinations. Several may stand under one root. */
export function SideNavigationSection({
  children,
  ref,
  render,
  ...nativeProps
}: SideNavigationPartProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'section' });
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/** The section's title. In compact mode it becomes a rule. */
export function SideNavigationSectionLabel({
  children,
  ref,
  render,
  ...nativeProps
}: SideNavigationPartProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'section-label' });
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/** The items of one level: the top level, or a section's. */
export function SideNavigationList({
  children,
  ref,
  render,
  ...nativeProps
}: SideNavigationListProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'list' });
  if (render !== undefined) return render(rootProps);
  return <ul {...rootProps} ref={ref} />;
}

/* ── The item ───────────────────────────────────────────────────────────── */

/**
 * A row: a link, a trigger, or both, with optional actions and a group.
 *
 * It carries the states the stylesheet reads. `data-current` is on it while
 * its own link is the destination, and while a descendant is and the group is
 * closed or the column is a rail — the reader sees where they are when the
 * destination itself is out of sight.
 */
export function SideNavigationItem({
  children,
  className,
  disabled,
  ref,
  render,
  style,
  value,
  ...nativeProps
}: SideNavigationItemProps) {
  const navigation = useSideNavigation();
  const parent = useParentItem();
  const baseId = useId();

  const [hasLink, setHasLink] = useState(false);
  const [hasGroup, setHasGroup] = useState(false);
  const [clipped, setClipped] = useState(false);
  const [labelText, setLabelText] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [triggerNode, setTriggerNode] = useState<HTMLElement | null>(null);
  const [descendants, setDescendants] = useState<readonly string[]>([]);

  const expanded = navigation.isExpanded(value);
  const flyoutOpen = navigation.compact && navigation.flyout === value;
  const current = hasLink && navigation.value === value;
  const holdsCurrent = descendants.length > 0;
  const resolvedDisabled = disabled === true || parent?.disabled === true;

  const { registerItem } = navigation;
  useEffect(() => registerItem(value, parent?.value ?? null), [parent?.value, registerItem, value]);

  const reportCurrent = useCallback((descendant: string, isCurrent: boolean) => {
    setDescendants((known) => {
      const has = known.includes(descendant);
      if (isCurrent === has) return known;
      return isCurrent ? [...known, descendant] : known.filter((item) => item !== descendant);
    });
  }, []);

  /** Where the reader is, said upward: own link, or anything under it. */
  const report = parent?.reportCurrent;
  useEffect(() => {
    if (report === undefined) return undefined;
    const here = current || holdsCurrent;
    report(value, here);
    return () => report(value, false);
  }, [current, holdsCurrent, report, value]);

  const context = useMemo<SideNavigationItemContextValue>(
    () => ({
      clipped,
      current,
      descriptionText,
      disabled: resolvedDisabled,
      expanded,
      flyoutOpen,
      hasGroup,
      hasLink,
      holdsCurrent,
      ids: {
        groupId: `${baseId}group`,
        labelId: `${baseId}label`,
        triggerId: `${baseId}trigger`,
      },
      labelText,
      reportCurrent,
      setClipped,
      setDescriptionText,
      setHasGroup,
      setHasLink,
      setLabelText,
      setTriggerNode,
      triggerNode,
      value,
    }),
    [
      baseId,
      clipped,
      current,
      descriptionText,
      expanded,
      flyoutOpen,
      hasGroup,
      hasLink,
      holdsCurrent,
      labelText,
      reportCurrent,
      resolvedDisabled,
      triggerNode,
      value,
    ],
  );

  const marked = current || (holdsCurrent && (!expanded || navigation.compact));

  const rootProps: SideNavigationItemRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    ...(marked ? { 'data-current': '' as const } : {}),
    ...(resolvedDisabled ? { 'data-disabled': '' as const } : {}),
    ...(expanded ? { 'data-expanded': '' as const } : {}),
    ...(flyoutOpen ? { 'data-open': '' as const } : {}),
    'data-part': 'item',
    'data-value': value,
    style,
  });

  return (
    <ItemContext.Provider value={context}>
      {render === undefined ? <li {...rootProps} ref={ref} /> : render(rootProps)}
    </ItemContext.Provider>
  );
}

/* ── The row's hint ─────────────────────────────────────────────────────── */

/**
 * The tooltip a row opens when it cannot show its own words: in the rail,
 * where the label is clipped to a pixel, and under `truncate` on a label the
 * binding measured as cut. A row that fits opens nothing.
 */
function Hint({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const item = useSideNavigationItem();
  return (
    <Tooltip describes="description" disabled={!enabled} openOn="hover" side="inline-end">
      {children}
      <TooltipLayer>
        <TooltipContent>
          {item.labelText}
          {item.descriptionText.length > 0 ? (
            <>
              <br />
              {item.descriptionText}
            </>
          ) : null}
        </TooltipContent>
      </TooltipLayer>
    </Tooltip>
  );
}

/* ── The link ───────────────────────────────────────────────────────────── */

/**
 * The destination, or a command. An `a` with an `href` is a destination and
 * takes `aria-current`; without one — or through `render` — it is a `button`
 * with the same row, for a command that lives in the column.
 *
 * `current` stated on the row wins over the root's `value`: a router's own
 * link writes it, and the consumer's explicit value always wins.
 */
export function SideNavigationLink({
  children,
  className,
  current,
  href,
  onClick,
  ref,
  render,
  style,
  ...nativeProps
}: SideNavigationLinkProps) {
  const navigation = useSideNavigation();
  const item = useSideNavigationItem();

  useEffect(() => {
    item.setHasLink(true);
    return () => item.setHasLink(false);
  }, [item.setHasLink]);

  const isDestination = href !== undefined || render !== undefined;
  const resolvedCurrent = current ?? (isDestination && navigation.value === item.value);
  const middle = navigation.truncate === 'middle' && item.clipped && item.labelText.length > 0;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    if (event.defaultPrevented) return;
    const reason = activationReason(event);
    if (isDestination) navigation.select(item.value, reason, event.nativeEvent);
    if (navigation.flyout !== null && navigation.compact) {
      navigation.setFlyout(null, 'select', event.nativeEvent);
    }
  };

  const rootProps: SideNavigationLinkRootProps = keyedProps({
    ...nativeProps,
    ...(resolvedCurrent ? { 'aria-current': 'page' as const } : {}),
    ...(item.disabled ? { 'aria-disabled': 'true' as const } : {}),
    ...(middle ? { 'aria-label': item.labelText } : {}),
    children,
    className,
    ...(resolvedCurrent ? { 'data-current': '' as const } : {}),
    'data-part': 'link',
    ...(href !== undefined ? { href } : {}),
    onClick: handleClick,
    style,
  });

  /**
   * The tooltip's trigger composes the row's own handlers with its hover and
   * focus ones, and hands the result to `render`; the row is then drawn with
   * everything on it, and the consumer's `render` receives the same.
   */
  return (
    <Hint enabled={navigation.compact || item.clipped}>
      <TooltipTrigger
        {...(rootProps as object)}
        render={(hint) => {
          const setNode = (node: HTMLElement | null) => {
            hint.ref?.(node);
            attach(node, ref as Ref<HTMLElement> | undefined);
          };
          const merged = { ...(hint as SideNavigationLinkRootProps), ref: setNode };
          if (render !== undefined) return render(definedProps(merged));
          return href === undefined ? (
            <button {...(merged as object)} type="button" />
          ) : (
            <a {...merged} />
          );
        }}
      />
    </Hint>
  );
}

/* ── The trigger ────────────────────────────────────────────────────────── */

/**
 * The disclosure button of the group. Alone, it is the whole row and carries
 * the label; beside a link it is a mark-only button at the end of the row,
 * named by the row's label through `aria-labelledby` — the APG hybrid
 * example's second control. In the rail, a trigger without a link opens the
 * flyout instead of the inline group.
 */
export function SideNavigationTrigger({
  children,
  className,
  onClick,
  ref,
  render,
  style,
  ...nativeProps
}: SideNavigationTriggerProps) {
  const navigation = useSideNavigation();
  const item = useSideNavigationItem();
  const hybrid = item.hasLink;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const reason = activationReason(event);
    if (navigation.compact && !hybrid) {
      navigation.setFlyout(item.flyoutOpen ? null : item.value, reason, event.nativeEvent);
      return;
    }
    navigation.toggleExpanded(item.value, !item.expanded, reason, event.nativeEvent);
  };

  const rootProps: SideNavigationTriggerRootProps = keyedProps({
    ...nativeProps,
    'aria-controls': item.ids.groupId,
    'aria-expanded': item.flyoutOpen || item.expanded,
    ...(hybrid ? { 'aria-labelledby': item.ids.labelId } : {}),
    children: (
      <>
        {children}
        <span aria-hidden="true" data-part="indicator" data-part-indicator="">
          <Icon directional>
            <Glyph name="chevron-right" />
          </Icon>
        </span>
      </>
    ),
    className,
    'data-part': 'trigger',
    disabled: item.disabled,
    id: item.ids.triggerId,
    onClick: handleClick,
    style,
    type: 'button',
  });

  const setNode = useCallback(
    (node: HTMLElement | null) => {
      item.setTriggerNode(node);
      attach(node, ref as Ref<HTMLElement> | undefined);
    },
    [item.setTriggerNode, ref],
  );

  return (
    <Hint enabled={!hybrid && (navigation.compact || item.clipped)}>
      <TooltipTrigger
        {...(rootProps as object)}
        render={(hint) => {
          const setBoth = (node: HTMLElement | null) => {
            hint.ref?.(node);
            setNode(node);
          };
          const merged = { ...(hint as SideNavigationTriggerRootProps), ref: setBoth };
          if (render !== undefined) return render(merged);
          return <button {...merged} />;
        }}
      />
    </Hint>
  );
}

/* ── The parts of a row ─────────────────────────────────────────────────── */

/** The box the mark stands in. What is left of a row in the rail. */
export function SideNavigationIcon({
  children,
  ref,
  render,
  ...nativeProps
}: SideNavigationSpanPartProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    'aria-hidden': true,
    children,
    'data-part': 'icon',
  });
  if (render !== undefined) return render(rootProps);
  return <span {...rootProps} ref={ref} />;
}

/**
 * The row's text. It registers its words with the item, for the tooltip and
 * for the accessible name under a middle cut, and measures itself whenever
 * the column was resized: a label that overflows its box marks the row
 * `data-clipped`, which is what opens the tooltip on a row that fits nothing.
 */
export function SideNavigationLabel({
  children,
  ref,
  render,
  ...nativeProps
}: SideNavigationSpanPartProps) {
  const navigation = useSideNavigation();
  const item = useSideNavigationItem();
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [display, setDisplay] = useState<string | null>(null);
  const text = typeof children === 'string' ? children : null;

  useLayoutEffect(() => {
    if (node === null) return;
    const whole = text ?? node.textContent ?? '';
    item.setLabelText(whole);
  }, [item.setLabelText, node, text]);

  useLayoutEffect(() => {
    if (node === null) return;
    if (navigation.truncate === 'none' || navigation.compact) {
      setDisplay(null);
      item.setClipped(navigation.compact);
      return;
    }
    if (navigation.truncate === 'middle' && text !== null) {
      const style = getComputedStyle(node);
      const canvas = node.ownerDocument.createElement('canvas').getContext('2d');
      const room = node.clientWidth;
      if (canvas === null || room === 0) return;
      /* The parts rather than the shorthand: Firefox reports the shorthand empty. */
      canvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const fits = (candidate: string) => canvas.measureText(candidate).width <= room;
      const cut = truncateMiddle(text, fits);
      setDisplay(cut === text ? null : cut);
      item.setClipped(cut !== text);
      return;
    }
    setDisplay(null);
    item.setClipped(node.scrollWidth > node.clientWidth + 1);
  }, [
    item.setClipped,
    navigation.compact,
    navigation.measureTick,
    navigation.truncate,
    node,
    text,
  ]);

  const rootProps = keyedProps({
    ...nativeProps,
    children: display ?? children,
    'data-part': 'label',
    id: item.ids.labelId,
  });
  if (render !== undefined) return render(rootProps);
  return (
    <span
      {...rootProps}
      ref={(element) => {
        setNode(element);
        attach(element, ref);
      }}
    />
  );
}

/** The second line under the title. */
export function SideNavigationDescription({
  children,
  ref,
  render,
  ...nativeProps
}: SideNavigationSpanPartProps) {
  const item = useSideNavigationItem();
  const [node, setNode] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (node === null) return;
    item.setDescriptionText(node.textContent ?? '');
  }, [children, item.setDescriptionText, node]);

  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'description' });
  if (render !== undefined) return render(rootProps);
  return (
    <span
      {...rootProps}
      ref={(element) => {
        setNode(element);
        attach(element, ref);
      }}
    />
  );
}

/** A quantity beside a destination, drawn as tabular figures. Never cut. */
export function SideNavigationCount({
  children,
  ref,
  render,
  ...nativeProps
}: SideNavigationSpanPartProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'count' });
  if (render !== undefined) return render(rootProps);
  return <span {...rootProps} ref={ref} />;
}

/** The suffix with a tone: a badge, a key. */
export function SideNavigationEnd({
  children,
  ref,
  render,
  ...nativeProps
}: SideNavigationSpanPartProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'end' });
  if (render !== undefined) return render(rootProps);
  return <span {...rootProps} ref={ref} />;
}

/** Controls beside the row, outside its `a` or `button`. */
export function SideNavigationActions({
  children,
  ref,
  render,
  ...nativeProps
}: SideNavigationPartProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'actions' });
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/** A rule between items that keeps the list a list. */
export function SideNavigationDivider({ ref, render, ...nativeProps }: SideNavigationDividerProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    'data-part': 'divider',
    role: 'separator' as const,
  });
  if (render !== undefined) return render(rootProps);
  return <li {...rootProps} ref={ref} />;
}

/** A row still arriving: an item's geometry with `skeleton` boxes in it. */
export function SideNavigationSkeleton({
  labelSize = '60%',
  ref,
  ...nativeProps
}: SideNavigationSkeletonProps) {
  return (
    <li {...withSelectorKey(nativeProps, 'part', 'skeleton')} aria-hidden="true" ref={ref}>
      <span data-part="icon" data-part-icon="">
        <Skeleton shape="square" size="xs" />
      </span>
      <span data-part="label" data-part-label="">
        <Skeleton inlineSize={labelSize} shape="text" />
      </span>
    </li>
  );
}

/* ── The group, inline or in the flyout ─────────────────────────────────── */

/**
 * The layer beside the rail. Composed from `portal`, `positioner`, `presence`
 * and `dismissable-layer` — the four modules every overlay in the library
 * takes — and drawn by this family's own stylesheet as `[data-part="flyout"]`.
 * The trigger is a branch, so pressing it again is not an outside press.
 */
function FlyoutLayer({
  children,
  onExited,
  open,
}: {
  children: ReactNode;
  onExited: () => void;
  open: boolean;
}) {
  const navigation = useSideNavigation();
  const item = useSideNavigationItem();
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [container, setContainer] = useState<Element | null>(null);
  const [status, setStatus] = useState<PresenceStatus>('unmounted');
  const presence = useRef<PresenceHandle | null>(null);
  const latest = useRef({ navigation, onExited, open });
  latest.current = { navigation, onExited, open };

  useEffect(() => {
    const handle = createPresence({ present: open, onStatusChange: setStatus });
    presence.current = handle;
    setStatus(handle.status);
    return () => {
      handle.destroy();
      presence.current = null;
    };
    /* The presence is created once; `open` is synced by the effect below. */
  }, []);

  useEffect(() => {
    presence.current?.sync(open);
  }, [open]);

  useEffect(() => {
    presence.current?.setNode(node);
  }, [node]);

  const seen = useRef(false);
  useEffect(() => {
    if (status !== 'unmounted') seen.current = true;
    else if (seen.current) latest.current.onExited();
  }, [status]);

  const anchor = item.triggerNode;
  /* Before the first paint, so the flyout is in its layer in the frame that shows it. */
  useLayoutEffect(() => {
    const handle = createPortalRoot({ origin: anchor });
    setContainer(handle.container);
    return () => handle.release();
  }, [anchor]);

  const positioner = useRef<PositionerHandle | null>(null);

  /**
   * `data-open` is written by the measurement that places the flyout, on the
   * element, in the task that opened it: the position, the side and the open
   * state reach one style update together. A render to say "positioned" was a
   * frame of its own.
   */
  const place = useCallback((handle: PositionerHandle, layer: HTMLElement) => {
    void handle.update().then(() => {
      if (positioner.current !== handle || !latest.current.open) return;
      layer.setAttribute('data-open', '');
    });
  }, []);

  useLayoutEffect(() => {
    if (node === null || anchor === null) return undefined;
    const handle = createPositioner(anchor, node, {
      align: 'start',
      flip: true,
      shift: true,
      side: 'inline-end',
      sideOffset: 0,
      strategy: 'fixed',
    });
    positioner.current = handle;
    if (latest.current.open) place(handle, node);
    return () => {
      handle.destroy();
      positioner.current = null;
      node.removeAttribute('data-open');
    };
  }, [anchor, node, place]);

  useLayoutEffect(() => {
    const handle = positioner.current;
    if (handle === null || node === null) return;
    if (open) place(handle, node);
    else node.removeAttribute('data-open');
  }, [node, open, place]);

  useEffect(() => {
    if (node === null || !open) return undefined;
    const layer = createDismissableLayer(node, {
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      ...(anchor ? { branches: [anchor] } : {}),
      onDismiss: (request) => {
        const reason: SideNavigationFlyoutReason =
          request.reason === 'escape' ? 'escape' : 'outsidePress';
        latest.current.navigation.setFlyout(null, reason, request.source);
        if (reason === 'escape') anchor?.focus();
      },
    });
    return () => layer.destroy();
  }, [anchor, node, open]);

  useEffect(() => {
    latest.current.navigation.setFlyoutNode(open ? node : null);
    return () => latest.current.navigation.setFlyoutNode(null);
  }, [node, open]);

  /** Focus leaving the layer for somewhere that is not the trigger closes it. */
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next === null || node === null) return;
    if (node.contains(next) || anchor?.contains(next)) return;
    navigation.setFlyout(null, 'blur', event.nativeEvent);
  };

  if (container === null) return null;

  return createPortal(
    <div
      {...withSelectorKey(navigation.guides ? { 'data-guides': '' } : {}, 'part', 'flyout')}

      data-size={navigation.size}
      data-truncate={navigation.truncate}
      data-ui="side-navigation"
      data-ui-side-navigation=""
      onBlur={onBlur}
      ref={setNode}
    >
      {children}
    </div>,
    container,
  );
}

/**
 * An item's children. Inline, it is the second track of the item's grid and
 * opens with it; in the rail, the same list is presented in the flyout beside
 * the trigger, and comes back inline when the layer has left.
 */
export function SideNavigationGroup({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: SideNavigationGroupProps) {
  const item = useSideNavigationItem();
  const [presented, setPresented] = useState(false);

  useEffect(() => {
    item.setHasGroup(true);
    return () => item.setHasGroup(false);
  }, [item.setHasGroup]);

  useEffect(() => {
    if (item.flyoutOpen) setPresented(true);
  }, [item.flyoutOpen]);

  const rootProps: SideNavigationGroupRootProps = keyedProps({
    ...nativeProps,
    'aria-labelledby': item.ids.labelId,
    children,
    className,
    'data-part': 'group',
    id: item.ids.groupId,
    style,
  });

  const list = render === undefined ? <ul {...rootProps} ref={ref} /> : render(rootProps);

  if (!presented) return list;
  return (
    <FlyoutLayer onExited={() => setPresented(false)} open={item.flyoutOpen}>
      {list}
    </FlyoutLayer>
  );
}
