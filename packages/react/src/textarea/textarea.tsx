import '@slotted/styles/textarea/textarea.css';

import { useEffect } from 'react';

import { useField } from '../field/field-context';
import type { TextareaProps } from './textarea.types';

function mergeDescribedBy(consumer: string | undefined, field: string | undefined) {
  return [consumer, field].filter(Boolean).join(' ') || undefined;
}

/**
 * The multi-line control, wired to the field around it when there is one and
 * standing alone when there is not. It follows the mechanism Input set: unset
 * defers to the field, set wins over it, and the resolved state is mirrored
 * onto the element.
 */
export function Textarea({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  autoSize = false,
  className,
  disabled,
  id,
  invalid,
  readOnly,
  required,
  rows = 3,
  size = 'md',
  ...nativeProps
}: TextareaProps) {
  const field = useField();
  const registerControl = field?.registerControl;

  useEffect(() => registerControl?.(), [registerControl]);

  const isDisabled = disabled ?? field?.disabled ?? false;
  const isInvalid = invalid ?? field?.invalid ?? false;
  const isReadOnly = readOnly ?? field?.readOnly ?? false;
  const isRequired = required ?? field?.required ?? false;

  return (
    <textarea
      {...nativeProps}
      aria-describedby={mergeDescribedBy(ariaDescribedBy, field?.describedBy)}
      aria-invalid={ariaInvalid ?? (isInvalid ? true : undefined)}
      aria-required={ariaRequired ?? (isRequired ? true : undefined)}
      className={['slotted-textarea', className].filter(Boolean).join(' ')}
      data-auto-size={autoSize ? '' : undefined}
      data-disabled={isDisabled ? '' : undefined}
      data-invalid={isInvalid ? '' : undefined}
      data-part="root"
      data-readonly={isReadOnly ? '' : undefined}
      data-size={size}
      data-slotted-component="textarea"
      disabled={isDisabled}
      id={id ?? field?.ids.control}
      readOnly={isReadOnly}
      rows={rows}
    />
  );
}
