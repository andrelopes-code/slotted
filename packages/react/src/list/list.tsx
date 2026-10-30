import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/list/list.css';

import { createContext, useContext } from 'react';

import { useListDefaults } from './list-defaults';
import type { ListContextValue, ListProps, ListRootProps } from './list.types';

const ListContext = createContext<ListContextValue | undefined>(undefined);

/**
 * What the set decided, for the rows inside it. A row outside a list is not an
 * error — an `li` the page wrote itself is still a row — so the value is
 * optional and every reader falls back to its own default.
 */
export function useList(): ListContextValue | undefined {
  return useContext(ListContext);
}

/**
 * A vertical run of related rows. The rows are `ListItem`, a family of its own;
 * this one decides how they are told apart, how much room each gets, what is
 * painted in the marker column and whether they keep their inline padding, and
 * hands those four down.
 *
 * **`role="list"` is written, and it is not redundant.** The family draws its
 * own marker, because a row is a content box beside its independent targets and
 * CSS has no `display` that is both `list-item` and a grid. Safari and
 * VoiceOver drop list semantics the moment CSS removes the marker, so the role
 * restores what the layout costs. A consumer who writes their own `role` — a
 * `menu`, a `listbox` they are wiring themselves — keeps it.
 *
 * The set holds no state a consumer can own. Selection with roving focus is
 * `listbox`'s and `table`'s: ARIA 1.2 does not allow `aria-selected` on
 * `listitem`, so a selection model here would announce nothing.
 */
export function List({
  inset,
  loading = false,
  marker,
  ordered = false,
  render,
  size,
  variant,
  ...nativeProps
}: ListProps) {
  const defaults = useListDefaults();

  const resolvedInset = (inset ?? defaults.inset) === true;
  const resolvedMarker = marker ?? defaults.marker;
  const resolvedSize = size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;

  const rootProps: ListRootProps = keyedProps({
    role: 'list',
    ...nativeProps,
    ...(loading ? { 'aria-busy': true, 'data-loading': '' } : {}),
    ...(resolvedInset ? { 'data-inset': '' } : {}),
    'data-marker': resolvedMarker,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'list',
    'data-variant': resolvedVariant,
  });

  const context: ListContextValue = {
    inset: resolvedInset,
    marker: resolvedMarker,
    ordered,
    size: resolvedSize,
    variant: resolvedVariant,
  };

  const element =
    render === undefined ? (
      ordered ? (
        <ol {...rootProps} />
      ) : (
        <ul {...rootProps} />
      )
    ) : (
      render(rootProps)
    );

  return <ListContext.Provider value={context}>{element}</ListContext.Provider>;
}
