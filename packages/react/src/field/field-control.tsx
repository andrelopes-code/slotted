import { useEffect } from 'react';

import { useField } from './field-context';
import type { FieldControlProps, FieldControlRootProps } from './field.types';

function mergeDescribedBy(consumer: string | undefined, field: string | undefined) {
  return [consumer, field].filter(Boolean).join(' ') || undefined;
}

export function FieldControl({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  disabled,
  id,
  readOnly,
  render,
  ...nativeProps
}: FieldControlProps) {
  const field = useField();
  const registerControl = field?.registerControl;

  useEffect(() => registerControl?.(), [registerControl]);

  const rootProps: FieldControlRootProps = {
    ...nativeProps,
    'aria-describedby': mergeDescribedBy(ariaDescribedBy, field?.describedBy),
    'aria-invalid': ariaInvalid ?? (field?.invalid ? true : undefined),
    'aria-required': ariaRequired ?? (field?.required ? true : undefined),
    'data-part': 'control',
    disabled: disabled ?? field?.disabled,
    id: id ?? field?.ids.control,
    readOnly: readOnly ?? field?.readOnly,
  };

  return render === undefined ? <input {...rootProps} /> : render(rootProps);
}
