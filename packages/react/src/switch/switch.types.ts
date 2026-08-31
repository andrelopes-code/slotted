import type { ComponentPropsWithoutRef } from 'react';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'onChange' | 'value'
> {
  /** The setting, when the consumer holds it. */
  checked?: boolean;
  /** The starting setting when the consumer holds none. */
  defaultChecked?: boolean;
  /**
   * Undefined defers to the field; anything else wins over it. `false` would
   * be indistinguishable from saying nothing, and would enable a control
   * inside a disabled field.
   */
  disabled?: boolean;
  invalid?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  required?: boolean;
  size?: SwitchSize;
}
