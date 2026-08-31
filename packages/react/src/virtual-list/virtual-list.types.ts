import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface VirtualListContextValue {
  itemCount: number;
  itemSize: number;
}

export interface VirtualListProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'role'
> {
  /** Called once per index in the window. Return a `VirtualListItem`. */
  children: (index: number) => ReactNode;
  /** How many rows the list has, whether or not they are rendered. */
  itemCount: number;
  /** The block size of one row, in pixels. Every row is this tall. */
  itemSize: number;
  /** Rows to render either side of the viewport. */
  overscan?: number;
}

export interface VirtualListItemProps extends Omit<ComponentPropsWithoutRef<'div'>, 'role'> {
  /** The row's position in the whole list, not in the rendered window. */
  index: number;
}
