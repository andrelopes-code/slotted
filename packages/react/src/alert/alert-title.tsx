import type { AlertTitleProps } from './alert.types';

export function AlertTitle(props: AlertTitleProps) {
  return <div {...props} data-part="title" />;
}
