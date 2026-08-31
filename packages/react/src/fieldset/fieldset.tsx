import '@slotted/styles/fieldset/fieldset.css';

import type { FieldsetProps } from './fieldset.types';

/**
 * A group of related fields, named by its legend.
 *
 * Both the `group` role and the accessible name come from the elements
 * themselves, so no ARIA is added. `disabled` is the native attribute, which
 * disables every control inside — nothing is passed down and nothing has to
 * reproduce it.
 */
export function Fieldset({
  className,
  disabled = false,
  invalid = false,
  orientation = 'vertical',
  ...nativeProps
}: FieldsetProps) {
  return (
    <fieldset
      {...nativeProps}
      className={['slotted-fieldset', className].filter(Boolean).join(' ')}
      data-disabled={disabled ? '' : undefined}
      data-invalid={invalid ? '' : undefined}
      data-orientation={orientation}
      data-part="root"
      data-slotted-component="fieldset"
      disabled={disabled}
    />
  );
}
