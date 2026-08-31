import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type TagVariant = 'accent' | 'secondary' | 'success' | 'warning' | 'danger';
export type TagFill = 'solid' | 'outline' | 'subtle';
export type TagSize = 'sm' | 'md';

export interface TagRootProps extends HTMLAttributes<HTMLElement> {
  className: string;
  'data-fill': TagFill;
  'data-part': string;
  'data-size': TagSize;
  'data-slotted-component': string;
  'data-variant': TagVariant;
}

export interface TagProps extends ComponentPropsWithoutRef<'span'> {
  fill?: TagFill;
  render?: (props: TagRootProps) => ReactNode;
  size?: TagSize;
  variant?: TagVariant;
}

export type TagRemoveProps = Omit<ComponentPropsWithoutRef<'button'>, 'children'>;
