import type { ComponentPropsWithoutRef } from 'react';

export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps extends ComponentPropsWithoutRef<'textarea'> {
  /**
   * Grows the control with its content, up to
   * `--slotted-textarea-auto-size-max`. `rows` stays the smallest it gets.
   */
  autoSize?: boolean;
  /**
   * Undefined defers to the field; anything else wins over it. `false` would
   * be indistinguishable from saying nothing, and would enable a control
   * inside a disabled field.
   */
  disabled?: boolean;
  invalid?: boolean;
  readOnly?: boolean;
  required?: boolean;
  size?: TextareaSize;
}
