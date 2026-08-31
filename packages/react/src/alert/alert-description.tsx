import type { AlertDescriptionProps } from './alert.types';

export function AlertDescription(props: AlertDescriptionProps) {
  return <p {...props} data-part="description" />;
}
