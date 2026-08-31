import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type LinkUnderline = 'always' | 'hover' | 'none';

export interface LinkRootProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className: string;
  'data-part': string;
  'data-slotted-component': string;
  'data-underline': LinkUnderline;
  rel: string | undefined;
  target: string | undefined;
}

export interface LinkProps extends ComponentPropsWithoutRef<'a'> {
  external?: boolean;
  externalHint?: string;
  render?: (props: LinkRootProps) => ReactNode;
  underline?: LinkUnderline;
}
