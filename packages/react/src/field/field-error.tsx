import { useEffect } from 'react';

import { useField } from './field-context';
import type { FieldMessageProps } from './field.types';

export function FieldError({ id, ...nativeProps }: FieldMessageProps) {
  const field = useField();
  const registerPart = field?.registerPart;

  useEffect(() => registerPart?.('error'), [registerPart]);

  return <p {...nativeProps} data-part="error" id={id ?? field?.ids.error} />;
}
