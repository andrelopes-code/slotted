import type { ComponentPropsWithoutRef } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'size'> {
  /**
   * Undefined defers to the field; anything else wins over it. `false` would
   * be indistinguishable from saying nothing, and would enable a control
   * inside a disabled field.
   */
  disabled?: boolean;
  invalid?: boolean;
  readOnly?: boolean;
  required?: boolean;
  size?: InputSize;
}
