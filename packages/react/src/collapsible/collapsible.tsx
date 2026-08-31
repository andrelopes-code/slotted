import '@slotted/styles/collapsible/collapsible.css';

import { useState } from 'react';
import type { SyntheticEvent } from 'react';

import type { CollapsibleProps } from './collapsible.types';

/**
 * A `details` element, so the expanded state, the keyboard model and the role
 * come from the platform. The component adds only the controlled-value shape
 * the rest of the library uses.
 */
export function Collapsible({
  className,
  defaultOpen = false,
  onOpenChange,
  open,
  ...nativeProps
}: CollapsibleProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isOpen = open ?? uncontrolled;

  const handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    const next = event.currentTarget.open;
    if (next === isOpen) return;

    if (open === undefined) {
      setUncontrolled(next);
    } else {
      /**
       * The element opened itself. A controlled collapsible may only be where
       * the consumer says it is, so it is put back at once; the reassignment
       * fires a second toggle, which the guard above discards. If the consumer
       * does accept the change, the new prop lands on the next render.
       */
      event.currentTarget.open = open;
    }

    onOpenChange?.(next);
  };

  return (
    <details
      {...nativeProps}
      className={['slotted-collapsible', className].filter(Boolean).join(' ')}
      data-part="root"
      data-slotted-component="collapsible"
      onToggle={handleToggle}
      open={isOpen}
    />
  );
}
