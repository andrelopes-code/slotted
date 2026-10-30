import { definedProps, keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import { createPresence } from '@slotted/core/presence';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import type { MouseEvent, PointerEvent, Ref } from 'react';

import { Glyph, Icon } from '../icon';
import { NavigationMenuContentContext, useNavigationMenu } from './navigation-menu';
import type {
  NavigationMenuContentProps,
  NavigationMenuContentRootProps,
  NavigationMenuGroupProps,
  NavigationMenuGroupRootProps,
  NavigationMenuItemContextValue,
  NavigationMenuItemProps,
  NavigationMenuItemRootProps,
  NavigationMenuLinkProps,
  NavigationMenuLinkRootProps,
  NavigationMenuLinksProps,
  NavigationMenuListProps,
  NavigationMenuPartProps,
  NavigationMenuSpanPartProps,
  NavigationMenuTriggerProps,
} from './navigation-menu.types';

/** Two refs on one element: the family's, and whatever the consumer passed. */
function attach<T>(node: T, ...refs: (Ref<T> | undefined)[]) {
  for (const ref of refs) {
    if (typeof ref === 'function') ref(node);
    else if (ref !== null && ref !== undefined) ref.current = node;
  }
}

/**
 * A click synthesised by the keyboard reports no detail; a real one reports
 * the click count. It is how `Enter` and a pointer are told apart without a
 * key listener — the platform keeps the key.
 */
function activationReason(event: MouseEvent) {
  return event.detail === 0 ? ('keyboard' as const) : ('pointer' as const);
}

const ItemContext = createContext<NavigationMenuItemContextValue | undefined>(undefined);

/** What the item around this part says. Throws outside one. */
export function useNavigationMenuItem(): NavigationMenuItemContextValue {
  const context = useContext(ItemContext);
  if (context === undefined) {
    throw new Error(
      'NavigationMenuTrigger and NavigationMenuContent must be rendered inside NavigationMenuItem.',
    );
  }
  return context;
}

/** The sections and the top-level links, in a row or a column. */
export function NavigationMenuList({
  children,
  ref,
  render,
  ...nativeProps
}: NavigationMenuListProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'list' });
  if (render !== undefined) return render(rootProps);
  return <ul {...rootProps} ref={ref} />;
}

/**
 * One section — a trigger followed by its panel — or one top-level link. It
 * carries `data-open` while its panel is shown, and tells its trigger whether
 * a link inside the panel is the current page.
 */
export function NavigationMenuItem({
  children,
  disabled = false,
  ref,
  render,
  value,
  ...nativeProps
}: NavigationMenuItemProps) {
  const navigation = useNavigationMenu();
  /** The item of the outer level, when this one stands in a second level's list. */
  const outerItem = useContext(ItemContext);
  const contentId = useId();
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const [currents, setCurrents] = useState<ReadonlySet<string>>(() => new Set());
  const open = navigation.value === value;
  const { register } = navigation;
  useEffect(() => register(value, contentId), [contentId, register, value]);

  const reportCurrent = useCallback((key: string, current: boolean) => {
    setCurrents((set) => {
      if (set.has(key) === current) return set;
      const next = new Set(set);
      if (current) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  /* A second level holding the current page marks the outer section too. */
  const holds = currents.size > 0;
  const reportOuter = outerItem?.reportCurrent;
  useEffect(() => {
    if (reportOuter === undefined) return undefined;
    reportOuter(contentId, holds);
    return () => reportOuter(contentId, false);
  }, [contentId, holds, reportOuter]);

  const context = useMemo<NavigationMenuItemContextValue>(
    () => ({
      contentId,
      disabled,
      hasCurrent: currents.size > 0,
      open,
      reportCurrent,
      setTrigger,
      trigger,
      value,
    }),
    [contentId, currents, disabled, open, reportCurrent, trigger, value],
  );

  const rootProps: NavigationMenuItemRootProps = keyedProps({
    ...nativeProps,
    children,
    ...(disabled ? { 'data-disabled': '' as const } : {}),
    ...(open ? { 'data-open': '' as const } : {}),
    'data-part': 'item',
    'data-value': value,
  });

  return (
    <ItemContext.Provider value={context}>
      {render === undefined ? <li {...rootProps} ref={ref} /> : render(rootProps)}
    </ItemContext.Provider>
  );
}

/**
 * The section's button. It is always a native `button`, because it owns
 * `aria-expanded` and `aria-controls` and the family wires both; the chevron
 * is the family's own mark.
 */
export function NavigationMenuTrigger({
  children,
  disabled,
  onClick,
  onPointerEnter,
  ref,
  ...nativeProps
}: NavigationMenuTriggerProps) {
  const navigation = useNavigationMenu();
  const item = useNavigationMenuItem();
  const unavailable = disabled ?? item.disabled;
  const vertical = navigation.orientation === 'vertical';

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || unavailable) return;
    navigation.request(item.open ? null : item.value, activationReason(event), event.nativeEvent);
  };

  const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerEnter?.(event);
    if (event.defaultPrevented || unavailable) return;
    /* A trigger another family moved out of the row — into an overflow panel —
       opens on a press, never on a resting pointer. */
    if (navigation.root !== null && !navigation.root.contains(event.currentTarget)) return;
    navigation.hover(item.value, event.pointerType);
  };

  return (
    <button
      type="button"
      {...nativeProps}
      aria-controls={item.contentId}
      aria-expanded={item.open}
      {...(item.open ? { 'data-open': '' } : {})}
      {...withSelectorKey(item.hasCurrent ? { 'data-current': '' } : {}, 'part', 'trigger')}

      disabled={unavailable}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      ref={(node) => attach(node, item.setTrigger, ref)}
    >
      {children}
      <span aria-hidden="true" data-part="indicator" data-part-indicator="">
        <Icon directional={vertical}>
          <Glyph name={vertical ? 'chevron-right' : 'chevron-down'} />
        </Icon>
      </span>
    </button>
  );
}

/**
 * The section's panel, after its trigger in the same item. It stays in the
 * document while it leaves — `@slotted/core/presence` holds it for the exit —
 * and is `hidden` otherwise, so the tab sequence, a static render and a search
 * engine read every destination.
 */
export function NavigationMenuContent({
  children,
  columns = 1,
  ref,
  render,
  ...nativeProps
}: NavigationMenuContentProps) {
  const navigation = useNavigationMenu();
  const item = useNavigationMenuItem();
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const [presence] = useState(() =>
    createPresence({ present: item.open, onStatusChange: () => refresh() }),
  );
  useLayoutEffect(() => presence.sync(item.open), [item.open, presence]);
  /* Stopped, not destroyed: StrictMode mounts again on the same handle. */
  useEffect(() => () => presence.stop(), [presence]);

  const { motion } = navigation;
  const leaving = !item.open && presence.status === 'exiting';
  const crossing =
    item.open && motion.to === item.value
      ? motion.enter
      : leaving && motion.from === item.value
        ? motion.exit
        : null;

  const rootProps: NavigationMenuContentRootProps = keyedProps({
    ...nativeProps,
    children,
    'data-columns': String(columns),
    ...(crossing ? { 'data-motion': crossing } : {}),
    ...(item.open ? { 'data-open': '' as const } : {}),
    'data-part': 'content',
    hidden: !item.open && !presence.mounted,
    id: item.contentId,
  });

  return (
    <NavigationMenuContentContext.Provider value={true}>
      {render === undefined ? (
        <div {...rootProps} ref={(node) => attach(node, presence.setNode, ref)} />
      ) : (
        render(rootProps)
      )}
    </NavigationMenuContentContext.Provider>
  );
}

/**
 * A destination, at the top level or inside a panel. `current` — or the
 * `aria-current` a router writes — marks the page the reader is on and tells
 * the section's trigger. Inside a panel, following it closes every level.
 */
export function NavigationMenuLink({
  children,
  closeOnSelect,
  current,
  disabled = false,
  onClick,
  ref,
  render,
  ...nativeProps
}: NavigationMenuLinkProps) {
  const navigation = useNavigationMenu();
  const item = useContext(ItemContext);
  const inPanel = useContext(NavigationMenuContentContext);
  const key = useId();
  const isCurrent =
    current ?? (nativeProps as { 'aria-current'?: unknown })['aria-current'] === 'page';

  const report = item?.reportCurrent;
  useEffect(() => {
    if (!inPanel || report === undefined) return undefined;
    report(key, isCurrent);
    return () => report(key, false);
  }, [inPanel, isCurrent, key, report]);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event as MouseEvent<HTMLAnchorElement>);
    if (event.defaultPrevented || !inPanel) return;
    if (closeOnSelect ?? navigation.closeOnSelect) navigation.select(event.nativeEvent);
  };

  const rootProps: NavigationMenuLinkRootProps = keyedProps({
    ...nativeProps,
    ...(isCurrent ? { 'aria-current': 'page' as const, 'data-current': '' as const } : {}),
    ...(disabled ? { 'aria-disabled': 'true' as const, 'data-disabled': '' as const } : {}),
    children,
    'data-part': 'link',
    onClick: handleClick,
    ref: (node) => attach(node as HTMLAnchorElement | null, ref),
  });

  if (render !== undefined) return render(definedProps(rootProps));
  return <a {...(rootProps as NavigationMenuLinkRootProps & { ref: Ref<HTMLAnchorElement> })} />;
}

/** A grid of links inside a panel or a group. */
export function NavigationMenuLinks({
  children,
  ref,
  render,
  ...nativeProps
}: NavigationMenuLinksProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'links' });
  if (render !== undefined) return render(rootProps);
  return <ul {...rootProps} ref={ref} />;
}

const GroupContext = createContext<string | undefined>(undefined);

/** A column of a panel with a title that names the links under it. */
export function NavigationMenuGroup({
  children,
  ref,
  render,
  ...nativeProps
}: NavigationMenuGroupProps) {
  const labelId = useId();
  const rootProps: NavigationMenuGroupRootProps = keyedProps({
    ...nativeProps,
    'aria-labelledby': nativeProps['aria-labelledby'] ?? labelId,
    children,
    'data-part': 'group',
    role: 'group',
  });
  return (
    <GroupContext.Provider value={labelId}>
      {render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps)}
    </GroupContext.Provider>
  );
}

/** The group's title. */
export function NavigationMenuGroupLabel({
  children,
  ref,
  render,
  ...nativeProps
}: NavigationMenuPartProps) {
  const labelId = useContext(GroupContext);
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'group-label',
    ...(labelId !== undefined && nativeProps.id === undefined ? { id: labelId } : {}),
  });
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/** The panel's last row, under a rule: the consumer's call to action. */
export function NavigationMenuFooter({
  children,
  ref,
  render,
  ...nativeProps
}: NavigationMenuPartProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'footer' });
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/** A rich link's mark, aligned to the text of its label. */
export function NavigationMenuIcon({ children, ...nativeProps }: NavigationMenuSpanPartProps) {
  return (
    <span aria-hidden="true" {...withSelectorKey(nativeProps, 'part', 'icon')}>
      {children}
    </span>
  );
}

/** A rich link's title. */
export function NavigationMenuLabel({ children, ...nativeProps }: NavigationMenuSpanPartProps) {
  return <span {...withSelectorKey(nativeProps, 'part', 'label')}>{children}</span>;
}

/** A rich link's description: two lines to the eye, whole in the DOM. */
export function NavigationMenuDescription({
  children,
  ...nativeProps
}: NavigationMenuSpanPartProps) {
  return <span {...withSelectorKey(nativeProps, 'part', 'description')}>{children}</span>;
}
