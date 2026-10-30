import { definedProps, keyedProps } from '@slotted/core/selector-key';
import type { MouseEvent } from 'react';

import { useListItem } from './list-item';
import { ListItemBoxContext, useOutsideBody } from './list-item-nesting';
import type {
  ListItemButtonProps,
  ListItemButtonRootProps,
  ListItemContentProps,
  ListItemContentRootProps,
  ListItemLinkProps,
  ListItemLinkRootProps,
} from './list-item.types';

/**
 * Three components rather than one `as` prop, because the three are three
 * different accessibility trees: a row that is read, a row that is one command,
 * a row that is one destination. A string that picks between them turns a typo
 * into a `div` no reader can reach, and nothing says so.
 */

/**
 * A row that is read. It answers no pointer state, because it promises no
 * interaction; anything the page put in `ListItemActions` is its own target and
 * its own to disable.
 */
export function ListItemContent({ render, ...nativeProps }: ListItemContentProps) {
  const row = useListItem();

  const rootProps: ListItemContentRootProps = keyedProps({
    ...nativeProps,
    ...(row.loading ? { 'aria-busy': true } : {}),
    'data-part': 'content',
  });

  useOutsideBody('ListItemContent');
  return (
    <ListItemBoxContext.Provider value>
      {render === undefined ? <div {...rootProps} /> : render(rootProps)}
    </ListItemBoxContext.Provider>
  );
}

/**
 * A row that is one command. The `button` carries the disabled state for both
 * of the two that withdraw it, so a loading row cannot run the same command
 * twice — which is what `docs/component-features.md` §2.5 asks of every loading
 * control, alongside keeping the width and the accessible name.
 */
export function ListItemButton({ render, type = 'button', ...nativeProps }: ListItemButtonProps) {
  const row = useListItem();
  const blocked = row.disabled || row.loading;

  const rootProps: ListItemButtonRootProps = keyedProps({
    ...nativeProps,
    ...(row.loading ? { 'aria-busy': true } : {}),
    'data-part': 'content',
    disabled: blocked || nativeProps.disabled === true,
    type,
  });

  useOutsideBody('ListItemButton');
  return (
    <ListItemBoxContext.Provider value>
      {render === undefined ? <button {...rootProps} /> : render(rootProps)}
    </ListItemBoxContext.Provider>
  );
}

/**
 * A row that is one destination. An anchor has no native disabled, so a blocked
 * one takes `aria-disabled="true"` and keeps its destination in the DOM: that
 * attribute means perceivable but not operable, and an element under it stays
 * focusable — so a reader can still reach the row and hear the description that
 * says why it is unavailable. Taking the `href` away would be `disabled`
 * semantics wearing an `aria-disabled` name.
 *
 * The activation is refused instead, and the same handler covers both ways in:
 * a pointer, and `Enter` on a focused anchor, which the platform also delivers
 * as a click.
 *
 * The handler composes. While the row is operable the consumer's own runs
 * untouched; while it is not, the family stops the interaction rather than
 * passing it on, because a control that cannot act does not report having
 * acted.
 */
export function ListItemLink({ href, onClick, render, ...nativeProps }: ListItemLinkProps) {
  const row = useListItem();
  const blocked = row.disabled || row.loading;

  const rootProps: ListItemLinkRootProps = keyedProps({
    ...nativeProps,
    ...(row.loading ? { 'aria-busy': true } : {}),
    ...(blocked ? { 'aria-disabled': true } : {}),
    'data-part': 'content',
    href,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (blocked) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
  });

  useOutsideBody('ListItemLink');
  return (
    <ListItemBoxContext.Provider value>
      {render === undefined ? <a {...rootProps} /> : render(definedProps(rootProps))}
    </ListItemBoxContext.Provider>
  );
}
