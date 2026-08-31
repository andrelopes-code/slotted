import type { CollapsibleTriggerProps } from './collapsible.types';

/**
 * A `summary`, which has to be the first child of the `details`. That is the
 * platform's constraint, not the library's, and it is the price of not
 * rebuilding a disclosure out of a button and four ARIA attributes.
 */
export function CollapsibleTrigger(props: CollapsibleTriggerProps) {
  return <summary {...props} data-part="trigger" />;
}
