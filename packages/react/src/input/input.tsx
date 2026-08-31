import '@slotted/styles/input/input.css';

import { useEffect } from 'react';

import { useField } from '../field/field-context';
import type { InputProps } from './input.types';

function mergeDescribedBy(consumer: string | undefined, field: string | undefined) {
  return [consumer, field].filter(Boolean).join(' ') || undefined;
}

/**
 * The native control, wired to the field around it when there is one and
 * standing alone when there is not.
 *
 * Every shared state is undefined by default. Unset defers to the field; set
 * wins over it, in both directions. The resolved value is mirrored onto the
 * element as a data attribute, so the stylesheet is one selector and an input
 * outside a field looks the same as one inside it.
 */
export function Input({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  className,
  disabled,
  id,
  invalid,
  readOnly,
  required,
  size = 'md',
  ...nativeProps
}: InputProps) {
  const field = useField();
  const registerControl = field?.registerControl;

  useEffect(() => registerControl?.(), [registerControl]);

  const isDisabled = disabled ?? field?.disabled ?? false;
  const isInvalid = invalid ?? field?.invalid ?? false;
  const isReadOnly = readOnly ?? field?.readOnly ?? false;
  const isRequired = required ?? field?.required ?? false;

  return (
    <input
      {...nativeProps}
      aria-describedby={mergeDescribedBy(ariaDescribedBy, field?.describedBy)}
      aria-invalid={ariaInvalid ?? (isInvalid ? true : undefined)}
      aria-required={ariaRequired ?? (isRequired ? true : undefined)}
      className={['slotted-input', className].filter(Boolean).join(' ')}
      data-disabled={isDisabled ? '' : undefined}
      data-invalid={isInvalid ? '' : undefined}
      data-part="root"
      data-readonly={isReadOnly ? '' : undefined}
      data-size={size}
      data-slotted-component="input"
      disabled={isDisabled}
      id={id ?? field?.ids.control}
      readOnly={isReadOnly}
    />
  );
}
