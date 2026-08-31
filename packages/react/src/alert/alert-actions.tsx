import type { AlertActionsProps } from './alert.types';

export function AlertActions(props: AlertActionsProps) {
  return <div {...props} data-part="actions" />;
}
