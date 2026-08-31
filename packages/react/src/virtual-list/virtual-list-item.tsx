import { useVirtualList } from './virtual-list-context';
import type { VirtualListItemProps } from './virtual-list.types';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

/**
 * A row. Everything about where it sits and what it claims is derived from the
 * one index it is given and the list it is inside, so there is no arrangement
 * in which a consumer places a row at the wrong offset or has it report the
 * wrong position in the set.
 */
export function VirtualListItem({ index, style, ...nativeProps }: VirtualListItemProps) {
  const list = useVirtualList();

  if (isDevelopment && list === undefined) {
    console.warn(
      'VirtualListItem was rendered outside a VirtualList. It takes its size, its position and its place in the set from the list, and has none of them here.',
    );
  }

  return (
    <div
      {...nativeProps}
      aria-posinset={list && index + 1}
      aria-setsize={list?.itemCount}
      data-part="item"
      role="listitem"
      style={{
        ...style,
        ...(list && { blockSize: list.itemSize, insetBlockStart: index * list.itemSize }),
      }}
    />
  );
}
