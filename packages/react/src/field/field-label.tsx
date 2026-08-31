import { useField } from './field-context';
import type { FieldLabelProps } from './field.types';

export function FieldLabel({ htmlFor, id, ...nativeProps }: FieldLabelProps) {
  const field = useField();

  return (
    <label
      {...nativeProps}
      data-part="label"
      htmlFor={htmlFor ?? field?.ids.control}
      id={id ?? field?.ids.label}
    />
  );
}
