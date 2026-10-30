import { definedProps, keyedProps } from '@slotted/core/selector-key';
import { useContext, useEffect, useMemo, useRef } from 'react';
import type { MouseEvent } from 'react';

import {
  platformClick,
  TableOfContentsItemContext,
  useTableOfContents,
  useTableOfContentsItem,
} from './table-of-contents-context';
import type {
  TableOfContentsGroupProps,
  TableOfContentsGroupRootProps,
  TableOfContentsItemContextValue,
  TableOfContentsItemProps,
  TableOfContentsItemRootProps,
  TableOfContentsLinkProps,
  TableOfContentsLinkRootProps,
} from './table-of-contents.types';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports
 * the click count. It is why `Enter` and a pointer are told apart without a
 * key listener existing for the link — the platform keeps the key.
 */
function activationReason(event: MouseEvent) {
  return event.detail === 0 ? ('keyboard' as const) : ('pointer' as const);
}

/**
 * One entry: a link, and the group of its children when it has any. It
 * carries `data-depth` from one, so a theme may style each level, and
 * `data-current` beside the link's own, so a row's ground can say it.
 */
export function TableOfContentsItem({
  children,
  className,
  ref,
  render,
  style,
  value,
  ...nativeProps
}: TableOfContentsItemProps) {
  const list = useTableOfContents();
  const parent = useContext(TableOfContentsItemContext);
  const depth = (parent?.depth ?? 0) + 1;
  const current = list.value === value;

  const context = useMemo<TableOfContentsItemContextValue>(
    () => ({ current, depth, value }),
    [current, depth, value],
  );

  const rootProps: TableOfContentsItemRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    ...(current ? { 'data-current': '' as const } : {}),
    'data-depth': depth,
    'data-part': 'item',
    'data-value': value,
    ref,
    style,
  });

  return (
    <TableOfContentsItemContext.Provider value={context}>
      {render === undefined ? <li {...rootProps} /> : render(rootProps)}
    </TableOfContentsItemContext.Provider>
  );
}

/**
 * The link. A real anchor to a real fragment: Cmd-click, Ctrl-click and the
 * middle button open it in a new tab as the platform does, and nothing here
 * runs for them. A plain press asks `value` to move, then the list scrolls
 * the target under the chrome, writes the URL and focuses the target.
 */
export function TableOfContentsLink({
  children,
  className,
  href,
  onClick,
  ref,
  render,
  style,
  ...nativeProps
}: TableOfContentsLinkProps) {
  const list = useTableOfContents();
  const item = useTableOfContentsItem();
  const own = useRef<HTMLAnchorElement | null>(null);

  useEffect(
    () => list.registerLink(item.value, () => own.current?.textContent?.trim() ?? ''),
    [item.value, list.registerLink],
  );

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || platformClick(event)) return;
    event.preventDefault();
    list.navigate(item.value, activationReason(event), event.nativeEvent);
  };

  const rootProps: TableOfContentsLinkRootProps = keyedProps({
    ...nativeProps,
    ...(item.current ? { 'aria-current': 'location' as const } : {}),
    children,
    className,
    ...(item.current ? { 'data-current': '' as const } : {}),
    'data-part': 'link',
    href: href ?? `#${item.value}`,
    onClick: handleClick,
    ref: (node: HTMLAnchorElement | null) => {
      own.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref !== null && ref !== undefined) ref.current = node;
    },
    style,
  });

  return render === undefined ? <a {...rootProps} /> : render(definedProps(rootProps));
}

/** The children of an item, one level deeper. Not shown in the horizontal layout. */
export function TableOfContentsGroup({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: TableOfContentsGroupProps) {
  const rootProps: TableOfContentsGroupRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'group',
    ref,
    style,
  });
  return render === undefined ? <ol {...rootProps} /> : render(rootProps);
}
