import { useEffect } from 'react';

import { useField } from './field-context';
import type { FieldMessageProps } from './field.types';

export function FieldDescription({ id, ...nativeProps }: FieldMessageProps) {
  const field = useField();
  const registerPart = field?.registerPart;

  useEffect(() => registerPart?.('description'), [registerPart]);

  return <p {...nativeProps} data-part="description" id={id ?? field?.ids.description} />;
}
