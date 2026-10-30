import { definedProps, keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { FocusEvent, HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react';
import { createPortal } from 'react-dom';

import { Glyph, Icon } from '../icon';
import { NavigationMenu } from '../navigation-menu/navigation-menu';
import {
  NavigationMenuItem,
  NavigationMenuTrigger,
} from '../navigation-menu/navigation-menu-parts';
import type { GlyphName } from '../icon';
import { Tooltip } from '../tooltip';
import { TooltipContent, TooltipLayer, TooltipTrigger } from '../tooltip/tooltip-parts';
import { useTopNavigation } from './top-navigation';
import type {
  TopNavigationActionProps,
  TopNavigationControlProps,
  TopNavigationControlRootProps,
  TopNavigationHelpProps,
  TopNavigationHomeProps,
  TopNavigationItemContextValue,
  TopNavigationItemProps,
  TopNavigationItemRootProps,
  TopNavigationLinkProps,
  TopNavigationLinkRootProps,
  TopNavigationListProps,
  TopNavigationNavProps,
  TopNavigationPartProps,
  TopNavigationSearchProps,
  TopNavigationSpanPartProps,
  TopNavigationTriggerProps,
} from './top-navigation.types';

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
 * key listener existing for the control — the platform keeps the key.
 */
function activationReason(event: MouseEvent) {
  return event.detail === 0 ? ('keyboard' as const) : ('pointer' as const);
}

const ItemContext = createContext<TopNavigationItemContextValue | undefined>(undefined);

/** What the item around this part says. Throws outside one. */
export function useTopNavigationItem(): TopNavigationItemContextValue {
  const context = useContext(ItemContext);
  if (context === undefined) {
    throw new Error(
      'TopNavigationLink and TopNavigationTrigger must be rendered inside TopNavigationItem.',
    );
  }
  return context;
}

/* ── The hint on a control with no words ────────────────────────────────── */

/**
 * The tooltip every icon-only control opens, with the words its accessible
 * name carries: on hover, and on keyboard focus.
 */
function Hint({
  children,
  disabled = false,
  text,
}: {
  children: ReactNode;
  disabled?: boolean | undefined;
  text: string;
}) {
  return (
    <Tooltip disabled={disabled} openOn="hover" side="bottom">
      {children}
      <TooltipLayer>
        <TooltipContent>{text}</TooltipContent>
      </TooltipLayer>
    </Tooltip>
  );
}

/* ── Brand ──────────────────────────────────────────────────────────────── */

/** The start cluster: the shell's toggle when there is one, then the mark and the name. */
export function TopNavigationBrand({
  children,
  ref,
  render,
  ...nativeProps
}: TopNavigationPartProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'brand' });
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/**
 * The mark and the name, linked to the start of the application; a `span`
 * when there is nowhere to go. Below the high step the name leaves the eye
 * and this element keeps its accessible name, because the name is still in it.
 */
export function TopNavigationHome({
  children,
  href,
  ref,
  render,
  ...nativeProps
}: TopNavigationHomeProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'home',
    ...(href !== undefined ? { href } : {}),
  });
  if (render !== undefined) return render(definedProps(rootProps));
  return href === undefined ? (
    <span {...(rootProps as HTMLAttributes<HTMLElement>)} ref={ref as Ref<HTMLSpanElement>} />
  ) : (
    <a {...rootProps} ref={ref} />
  );
}

/** The box the logo stands in: square, the height of the bar's controls. */
export function TopNavigationMark({
  children,
  ref,
  render,
  ...nativeProps
}: TopNavigationSpanPartProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    'aria-hidden': true,
    children,
    'data-part': 'mark',
  });
  if (render !== undefined) return render(rootProps);
  return <span {...rootProps} ref={ref} />;
}

/** The product's name, one line. */
export function TopNavigationName({
  children,
  ref,
  render,
  ...nativeProps
}: TopNavigationSpanPartProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'name' });
  if (render !== undefined) return render(rootProps);
  return <span {...rootProps} ref={ref} />;
}

/* ── Context ────────────────────────────────────────────────────────────── */

/**
 * What the application is at this moment, as the consumer's own content.
 * Below the medium step it is presented at the top of the panel: the same
 * element, rendered into the panel while the panel is present.
 */
export function TopNavigationContext({
  children,
  ref,
  render,
  ...nativeProps
}: TopNavigationPartProps) {
  const navigation = useTopNavigation();
  useEffect(() => {
    navigation.setHasContext(true);
    return () => navigation.setHasContext(false);
  }, [navigation.setHasContext]);
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'context' });
  const element = render !== undefined ? render(rootProps) : <div {...rootProps} ref={ref} />;
  const inPanel = navigation.narrow && navigation.panelPresent && navigation.panelNode !== null;
  return inPanel ? createPortal(element, navigation.panelNode as HTMLElement) : element;
}

/* ── Navigation ─────────────────────────────────────────────────────────── */

/**
 * The navigation landmark, and the panel right after it in DOM order — so
 * Tab from `more`, the last control in the list, lands in the panel, the way
 * the disclosure pattern assumes. The panel stays in the DOM closed, out of
 * sight and out of the tab order by the stylesheet's `visibility`.
 */
export function TopNavigationNav({
  arrow,
  children,
  closeDelay,
  closeOnSelect,
  defaultValue,
  'aria-label': ariaLabel,
  onValueChange,
  openDelay,
  ref,
  render,
  value,
  ...nativeProps
}: TopNavigationNavProps) {
  const navigation = useTopNavigation();
  return (
    <>
      <NavigationMenu
        aria-label={ariaLabel ?? navigation.t('navigation')}
        arrow={arrow}
        closeDelay={closeDelay}
        closeOnSelect={closeOnSelect}
        defaultValue={defaultValue}
        onValueChange={(next, request) => {
          onValueChange?.(next, request);
          /* A destination followed inside the overflow panel closes the panel too. */
          if (request.reason === 'select' && !request.cancelled && navigation.moreOpen) {
            navigation.setMoreOpen(false, 'select', request.source);
          }
        }}
        openDelay={openDelay}
        render={(menu) => {
          /* One element, two families: the menu's root and the bar's nav part. */
          const rootProps = keyedProps({ ...nativeProps, ...menu, 'data-part': 'nav' });
          return render !== undefined ? (
            render(rootProps)
          ) : (
            <nav {...rootProps} ref={(node) => attach(node, menu.ref, ref)} />
          );
        }}
        size={navigation.size}
        value={value}
      >
        {children}
      </NavigationMenu>
      <Panel />
    </>
  );
}

/**
 * What did not fit: the context, the folded items, the help. Each of them
 * renders itself here through a portal while the panel is present, and the
 * stylesheet orders them context, list, help whatever order they arrived in.
 */
function Panel() {
  const navigation = useTopNavigation();
  return (
    <div
      {...withSelectorKey(navigation.moreOpen ? { 'data-open': '' } : {}, 'part', 'panel')}

      id={navigation.ids.panelId}
      ref={navigation.setPanelNode}
    >
      <ul data-part="panel-list" data-part-panel-list="" ref={navigation.setPanelListNode} />
    </div>
  );
}

/** The destinations, and `more` at their end. */
export function TopNavigationList({
  children,
  ref,
  render,
  ...nativeProps
}: TopNavigationListProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {children}
        <li data-part="item" data-part-item="">
          <More />
        </li>
      </>
    ),
    'data-part': 'list',
  });
  if (render !== undefined) return render(rootProps);
  return <ul {...rootProps} ref={ref} />;
}

/**
 * The disclosure button of the panel: `data-overflow` holds the count of
 * what folded, and the stylesheet shows the button by it — and by the
 * container queries before the count exists. It carries `data-current` while
 * the current destination is folded, the way a closed parent does.
 */
function More() {
  const navigation = useTopNavigation();
  const label =
    navigation.collapsed.length > 0
      ? navigation.t('moreCount', { count: navigation.collapsed.length })
      : navigation.t('more');

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    navigation.setMoreOpen(!navigation.moreOpen, activationReason(event), event.nativeEvent);
  };

  const rootProps: TopNavigationControlRootProps = keyedProps({
    'aria-controls': navigation.ids.panelId,
    'aria-expanded': navigation.moreOpen,
    'aria-label': label,
    children: <Mark glyph="ellipsis" />,
    ...(navigation.currentFolded ? { 'data-current': '' } : {}),
    ...(navigation.moreOpen ? { 'data-open': '' } : {}),
    ...(navigation.panelHolds ? { 'data-overflow': String(navigation.collapsed.length) } : {}),
    'data-part': 'more',
    id: navigation.ids.moreId,
    onClick: handleClick,
    type: 'button',
  });

  return (
    <Hint text={label}>
      <TooltipTrigger
        {...(rootProps as object)}
        render={(hint) => (
          <button
            {...(hint as TopNavigationControlRootProps)}
            ref={(node: HTMLElement | null) => {
              hint.ref?.(node);
              navigation.setMoreNode(node);
            }}
          />
        )}
      />
    </Hint>
  );
}

/* ── The item ───────────────────────────────────────────────────────────── */

/**
 * One destination or one section. It says what it is to the root — its
 * value, its priority, whether it is current — and, while the width has
 * folded it and the panel is present, renders itself into the panel's list:
 * the same `li`, with whatever the consumer put in it.
 */
export function TopNavigationItem({
  children,
  disabled = false,
  priority = 'medium',
  ref,
  render,
  value,
  ...nativeProps
}: TopNavigationItemProps) {
  const navigation = useTopNavigation();
  const [explicitCurrent, setExplicitCurrent] = useState(false);
  const collapsed = navigation.folded.has(priority);
  const current = explicitCurrent || navigation.value === value;

  useEffect(
    () => navigation.registerItem(value, priority, explicitCurrent),
    [explicitCurrent, navigation.registerItem, priority, value],
  );

  const context: TopNavigationItemContextValue = {
    collapsed,
    current,
    disabled,
    priority,
    setCurrent: setExplicitCurrent,
    value,
  };

  const rootProps: TopNavigationItemRootProps = keyedProps({
    ...nativeProps,
    children,
    ...(collapsed ? { 'data-collapsed': '' as const } : {}),
    ...(current ? { 'data-current': '' as const } : {}),
    ...(disabled ? { 'data-disabled': '' as const } : {}),
    'data-part': 'item',
    'data-priority': priority,
    'data-value': value,
  });

  const inPanel = collapsed && navigation.panelPresent && navigation.panelListNode !== null;

  return (
    <ItemContext.Provider value={context}>
      <NavigationMenuItem
        disabled={disabled}
        render={(menuItem) => {
          /* The section's open state is the menu's; the rest is the bar's. */
          const props = {
            ...rootProps,
            ...(menuItem['data-open'] !== undefined ? { 'data-open': '' as const } : {}),
          };
          const element = render !== undefined ? render(props) : <li {...props} ref={ref} />;
          return inPanel ? createPortal(element, navigation.panelListNode as HTMLElement) : element;
        }}
        value={value}
      />
    </ItemContext.Provider>
  );
}

/**
 * The destination. `current` stated on the row wins over the root's `value`:
 * a router's own link writes it, and the consumer's explicit value always
 * wins. Pressed inside the panel, it asks the panel to close with `select`.
 */
export function TopNavigationLink({
  children,
  current,
  href,
  onClick,
  ref,
  render,
  ...nativeProps
}: TopNavigationLinkProps) {
  const navigation = useTopNavigation();
  const item = useTopNavigationItem();

  useEffect(() => {
    if (current === undefined) return undefined;
    item.setCurrent(current);
    return () => item.setCurrent(false);
  }, [current, item.setCurrent]);

  const resolvedCurrent = current ?? item.current;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    if (event.defaultPrevented) return;
    const reason = activationReason(event);
    navigation.select(item.value, reason, event.nativeEvent);
    if (navigation.moreOpen && item.collapsed) {
      navigation.setMoreOpen(false, 'select', event.nativeEvent);
    }
  };

  const rootProps: TopNavigationLinkRootProps = keyedProps({
    ...nativeProps,
    ...(resolvedCurrent ? { 'aria-current': 'page' as const } : {}),
    ...(item.disabled ? { 'aria-disabled': 'true' as const } : {}),
    children,
    ...(resolvedCurrent ? { 'data-current': '' as const } : {}),
    'data-part': 'link',
    ...(href !== undefined ? { href } : {}),
    onClick: handleClick,
  });

  if (render !== undefined) return render(definedProps(rootProps));
  return <a {...rootProps} ref={ref} />;
}

/**
 * A section that opens: the `navigation-menu` trigger of the panel that
 * follows it in the same item — `aria-expanded`, `aria-controls`, the
 * chevron, a press and a resting pointer — in the bar's row.
 */
export function TopNavigationTrigger({ disabled, ...nativeProps }: TopNavigationTriggerProps) {
  const item = useTopNavigationItem();
  return <NavigationMenuTrigger {...nativeProps} disabled={disabled ?? item.disabled} />;
}

/* ── Search ─────────────────────────────────────────────────────────────── */

/**
 * The search region, with the consumer's field inside and the close at its
 * end. Below the medium step the region exists only while `searchOpen`, and
 * takes the whole bar: opening moves focus into the field, and Escape, focus
 * leaving the region, or the close hand the bar back and return focus to the
 * toggle.
 */
export function TopNavigationSearch({
  children,
  onBlur,
  onKeyDown,
  ref,
  render,
  ...nativeProps
}: TopNavigationSearchProps) {
  const navigation = useTopNavigation();
  const [node, setNode] = useState<HTMLElement | null>(null);
  const active = navigation.narrow && navigation.searchOpen;

  useEffect(() => {
    navigation.setHasSearch(true);
    return () => navigation.setHasSearch(false);
  }, [navigation.setHasSearch]);

  useEffect(() => {
    navigation.setSearchNode(node);
    return () => navigation.setSearchNode(null);
  }, [navigation.setSearchNode, node]);

  /**
   * The field takes focus the moment it takes the bar, and the toggle takes
   * it back when the bar returns — unless focus already went somewhere else,
   * which is what closed the search in the first place.
   */
  const wasActive = useRef(active);
  useEffect(() => {
    const before = wasActive.current;
    wasActive.current = active;
    if (node === null) return;
    if (active) {
      node.querySelector<HTMLElement>('input, [contenteditable]')?.focus();
      return;
    }
    if (!before) return;
    const focused = node.ownerDocument.activeElement;
    if (focused === null || focused === node.ownerDocument.body || node.contains(focused)) {
      navigation.searchToggleNode?.focus();
    }
  }, [active, navigation.searchToggleNode, node]);

  const close = (reason: 'escape' | 'blur' | 'pointer' | 'keyboard', source: unknown) => {
    navigation.setSearchOpen(false, reason, source);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !active || event.key !== 'Escape') return;
    event.preventDefault();
    close('escape', event.nativeEvent);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    onBlur?.(event);
    if (event.defaultPrevented || !active || node === null) return;
    const next = event.relatedTarget as Node | null;
    if (next === null || node.contains(next)) return;
    close('blur', event.nativeEvent);
  };

  const rootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {children}
        <SearchClose onClose={(reason, source) => close(reason, source)} />
      </>
    ),
    'data-part': 'search',
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
  });

  const setBoth = useCallback(
    (element: HTMLElement | null) => {
      setNode(element);
      attach(element as HTMLDivElement | null, ref);
    },
    [ref],
  );

  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={setBoth} />;
}

function SearchClose({
  onClose,
}: {
  onClose: (reason: 'pointer' | 'keyboard', source: unknown) => void;
}) {
  const navigation = useTopNavigation();
  const text = navigation.t('closeSearch');
  return (
    <Hint text={text}>
      <TooltipTrigger
        aria-label={text}
        data-part="search-close"
        data-part-search-close=""
        children={<Mark glyph="x" />}
        onClick={(event: MouseEvent<HTMLButtonElement>) =>
          onClose(activationReason(event), event.nativeEvent)
        }
        type="button"
        render={(hint) => <button {...(hint as TopNavigationControlRootProps)} />}
      />
    </Hint>
  );
}

/** The button that opens the search where the width has folded the field. */
function SearchToggle() {
  const navigation = useTopNavigation();
  const text = navigation.t('search');
  return (
    <Hint text={text}>
      <TooltipTrigger
        aria-label={text}
        data-part="search-toggle"
        data-part-search-toggle=""
        children={<Mark glyph="search" />}
        onClick={(event: MouseEvent<HTMLButtonElement>) =>
          navigation.setSearchOpen(true, activationReason(event), event.nativeEvent)
        }
        type="button"
        render={(hint) => (
          <button
            {...(hint as TopNavigationControlRootProps)}
            ref={(node: HTMLElement | null) => {
              hint.ref?.(node);
              navigation.setSearchToggleNode(node);
            }}
          />
        )}
      />
    </Hint>
  );
}

/* ── Actions ────────────────────────────────────────────────────────────── */

/** The end cluster. The search toggle stands first in it whenever the bar has a search. */
export function TopNavigationActions({
  children,
  ref,
  render,
  ...nativeProps
}: TopNavigationPartProps) {
  const navigation = useTopNavigation();
  const rootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {navigation.hasSearch ? <SearchToggle /> : null}
        {children}
      </>
    ),
    'data-part': 'actions',
  });
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/**
 * The family's own mark on a control: a Glyph element in an icon box, which
 * the control sizes. None of these marks points along the reading direction,
 * so none of them is `directional`.
 */
function Mark({ glyph }: { glyph: GlyphName }) {
  return (
    <Icon>
      <Glyph name={glyph} />
    </Icon>
  );
}

/**
 * An icon-only control the family names and marks: the mark is the
 * stylesheet's, the name is the consumer's `aria-label` or the family's
 * message, and the tooltip repeats the name.
 */
function Control({
  'aria-label': ariaLabel,
  children,
  glyph,
  message,
  part,
  ref,
  render,
  ...nativeProps
}: TopNavigationControlProps & { glyph?: GlyphName; message: string; part: string }) {
  const text = ariaLabel ?? message;
  const rootProps: TopNavigationControlRootProps = keyedProps({
    ...nativeProps,
    'aria-label': text,
    children:
      glyph === undefined ? (
        children
      ) : (
        <>
          <Mark glyph={glyph} />
          {children}
        </>
      ),
    'data-part': part,
    type: 'button',
  });
  return (
    <Hint text={text}>
      <TooltipTrigger
        {...(rootProps as object)}
        render={(hint) => {
          const merged = {
            ...(hint as TopNavigationControlRootProps),
            ref: (node: HTMLElement | null) => {
              hint.ref?.(node);
              attach(node as HTMLButtonElement | null, ref);
            },
          };
          if (render !== undefined) return render(merged);
          return <button {...merged} />;
        }}
      />
    </Hint>
  );
}

/**
 * Help: a destination (`a` with an `href`) or a trigger (`render` a button
 * the consumer wraps in `menu` or `popover`). Its children are its label —
 * the family's message when there are none — clipped from the eye in the
 * bar, where the mark stands alone, and shown as a row's words in the panel
 * below the high step. One accessible name in both places, from the same text.
 */
export function TopNavigationHelp({
  'aria-label': ariaLabel,
  children,
  href,
  ref,
  render,
  ...nativeProps
}: TopNavigationHelpProps) {
  const navigation = useTopNavigation();
  useEffect(() => {
    navigation.setHasHelp(true);
    return () => navigation.setHasHelp(false);
  }, [navigation.setHasHelp]);
  const text = ariaLabel ?? navigation.t('help');
  const inPanel = navigation.narrowest && navigation.panelPresent && navigation.panelNode !== null;
  const rootProps = keyedProps({
    ...nativeProps,
    ...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {}),
    children: (
      <>
        <Mark glyph="circle-question" />
        {children ?? text}
      </>
    ),
    'data-part': 'help',
    ...(href !== undefined ? { href } : {}),
  });
  const element = (
    <Hint disabled={inPanel} text={text}>
      <TooltipTrigger
        {...(rootProps as object)}
        render={(hint) => {
          const merged = {
            ...(hint as HTMLAttributes<HTMLElement> & { 'data-part': string }),
            ref: (node: HTMLElement | null) => {
              hint.ref?.(node);
              attach(node as HTMLAnchorElement | null, ref);
            },
          };
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
  return inPanel ? createPortal(element, navigation.panelNode as HTMLElement) : element;
}

/** Notifications: the bell, with the count in its corner. It never folds. */
export function TopNavigationNotifications(props: TopNavigationControlProps) {
  const navigation = useTopNavigation();
  return (
    <Control {...props} glyph="bell" message={navigation.t('notifications')} part="notifications" />
  );
}

/**
 * A global control of the product's own — approvals, tasks — in the family's
 * square, with the family's ink, ground and hint. A destination with an
 * `href`, a trigger without one. The consumer projects its own glyph and
 * names the control with `aria-label`; `TopNavigationCount` inside it stands
 * over its corner the way it stands over the bell.
 */
export function TopNavigationAction({
  'aria-label': ariaLabel,
  children,
  href,
  ref,
  render,
  ...nativeProps
}: TopNavigationActionProps) {
  const text = ariaLabel ?? '';
  const rootProps = keyedProps({
    ...nativeProps,
    ...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {}),
    children,
    'data-part': 'action',
    ...(href !== undefined ? { href } : {}),
  });
  return (
    <Hint disabled={text === ''} text={text}>
      <TooltipTrigger
        {...(rootProps as object)}
        render={(hint) => {
          const merged = {
            ...(hint as HTMLAttributes<HTMLElement> & { 'data-part': string }),
            ref: (node: HTMLElement | null) => {
              hint.ref?.(node);
              attach(node as HTMLAnchorElement | null, ref);
            },
          };
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

/** The number of what is waiting, inside the bell's button and so inside its name. */
export function TopNavigationCount({
  children,
  ref,
  render,
  ...nativeProps
}: TopNavigationSpanPartProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'count' });
  if (render !== undefined) return render(rootProps);
  return <span {...rootProps} ref={ref} />;
}

/** The account: the consumer's avatar and, when there is room, the name. It never folds. */
export function TopNavigationAccount(props: TopNavigationControlProps) {
  const navigation = useTopNavigation();
  return <Control {...props} message={navigation.t('account')} part="account" />;
}
