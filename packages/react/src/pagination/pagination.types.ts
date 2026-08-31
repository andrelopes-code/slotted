import type { AriaAttributes, ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export interface PaginationRootProps extends HTMLAttributes<HTMLElement> {
  'aria-label': string | undefined;
  className: string;
  'data-part': string;
  'data-slotted-component': string;
}

export interface PaginationProps extends ComponentPropsWithoutRef<'nav'> {
  render?: (props: PaginationRootProps) => ReactNode;
}

export type PaginationListProps = ComponentPropsWithoutRef<'ul'>;
export type PaginationItemProps = ComponentPropsWithoutRef<'li'>;

export interface PaginationPageRootProps extends HTMLAttributes<HTMLElement> {
  'aria-current': AriaAttributes['aria-current'];
  'data-current'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-part': string;
}

export interface PaginationPageProps extends ComponentPropsWithoutRef<'button'> {
  current?: boolean;
  render?: (props: PaginationPageRootProps) => ReactNode;
}

export type PaginationEllipsisProps = ComponentPropsWithoutRef<'span'>;
