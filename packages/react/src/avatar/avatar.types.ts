import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarContextValue {
  setLoaded: (loaded: boolean) => void;
}

export interface AvatarRootProps extends HTMLAttributes<HTMLElement> {
  className: string;
  'data-loaded'?: '' | undefined;
  'data-part': string;
  'data-size': AvatarSize;
  'data-slotted-component': string;
}

export interface AvatarProps extends ComponentPropsWithoutRef<'span'> {
  render?: (props: AvatarRootProps) => ReactNode;
  size?: AvatarSize;
}

export type AvatarImageProps = ComponentPropsWithoutRef<'img'>;
export type AvatarFallbackProps = ComponentPropsWithoutRef<'span'>;
