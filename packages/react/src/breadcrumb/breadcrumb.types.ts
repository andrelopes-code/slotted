import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export interface BreadcrumbRootProps extends HTMLAttributes<HTMLElement> {
  'aria-label': string | undefined;
  className: string;
  'data-part': string;
  'data-slotted-component': string;
}

export interface BreadcrumbProps extends ComponentPropsWithoutRef<'nav'> {
  render?: (props: BreadcrumbRootProps) => ReactNode;
}

export type BreadcrumbListProps = ComponentPropsWithoutRef<'ol'>;
export type BreadcrumbItemProps = ComponentPropsWithoutRef<'li'>;

export interface BreadcrumbLinkProps extends ComponentPropsWithoutRef<'a'> {
  current?: boolean;
}
