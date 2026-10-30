import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/list-item/list-item.css';

import { createContext, useContext } from 'react';

import { Glyph, Icon } from '../icon';
import { useList } from '../list';
import { useListItemDefaults } from './list-item-defaults';
import type { ListItemContextValue, ListItemProps, ListItemRootProps } from './list-item.types';

const ListItemContext = createContext<ListItemContextValue>({ disabled: false, loading: false });

/**
 * The two states the box inside the row has to answer. A content component
 * outside a row is not an error — the fallback says the box is operable — so a
 * page composing its own row still gets a working control.
 */
export function useListItem(): ListItemContextValue {
  return useContext(ListItemContext);
}

/**
 * One entry of a `List`: the `li`, and every state the row paints. The box that
 * is read, hovered, focused and sometimes activated is `ListItemContent`,
 * `ListItemButton` or `ListItemLink`, and `ListItemActions` is that box's
 * sibling — interactive content may not nest inside `a` or `button`.
 *
 * Four values come from the list when the row does not state them: `variant`,
 * `size`, `marker` and `inset`. Everything else is a fact about this row.
 *
 * **No state attribute the roles model forbids reaches the `li`.** ARIA 1.2
 * deprecates `aria-disabled` on `listitem`, so `disabled` is painted from
 * `data-disabled` and the attribute that means it is written on the box.
 * `aria-current` is inherited by the role and is not deprecated, so `current`
 * is announced here.
 */
export function ListItem({
  align,
  children,
  current = false,
  disabled = false,
  inset,
  loading = false,
  marker,
  position,
  render,
  selected = false,
  setSize,
  size,
  tone,
  truncate,
  variant,
  ...nativeProps
}: ListItemProps) {
  const defaults = useListItemDefaults();
  const list = useList();

  const resolvedAlign = align ?? defaults.align;
  const resolvedInset = (inset ?? list?.inset ?? defaults.inset) === true;
  const resolvedMarker = marker ?? list?.marker ?? 'none';
  const resolvedSize = size ?? list?.size ?? defaults.size;
  const resolvedTone = tone ?? defaults.tone;
  const resolvedTruncate = (truncate ?? defaults.truncate) === true;
  const resolvedVariant = variant ?? list?.variant ?? 'plain';

  const rootProps: ListItemRootProps = keyedProps({
    ...nativeProps,
    /* The bullet is the dot glyph in a part of its own before the row's
       content; the number is a counter the stylesheet writes, because it is
       text rather than an icon. */
    children:
      resolvedMarker === 'bullet' ? (
        <>
          <span aria-hidden="true" data-part="marker" data-part-marker="">
            <Icon>
              <Glyph name="dot" />
            </Icon>
          </span>
          {children}
        </>
      ) : (
        children
      ),
    ...(current === false ? {} : { 'aria-current': current, 'data-current': '' }),
    ...(position === undefined ? {} : { 'aria-posinset': position }),
    ...(setSize === undefined ? {} : { 'aria-setsize': setSize }),
    ...(disabled ? { 'data-disabled': '' } : {}),
    ...(loading ? { 'data-loading': '' } : {}),
    ...(resolvedInset ? { 'data-inset': '' } : {}),
    ...(selected ? { 'data-selected': '' } : {}),
    ...(resolvedTruncate ? { 'data-truncate': '' } : {}),
    'data-align': resolvedAlign,
    'data-marker': resolvedMarker,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-tone': resolvedTone,
    'data-ui': 'list-item',
    'data-variant': resolvedVariant,
  });

  const element = render === undefined ? <li {...rootProps} /> : render(rootProps);

  return (
    <ListItemContext.Provider value={{ disabled, loading }}>{element}</ListItemContext.Provider>
  );
}
