import type { ComponentPropsWithoutRef } from 'react';

export type FieldsetOrientation = 'vertical' | 'horizontal';

export interface FieldsetProps extends ComponentPropsWithoutRef<'fieldset'> {
  /**
   * Sets the native attribute, which is what disables every control inside.
   * Nothing is passed down; the platform does it.
   */
  disabled?: boolean;
  invalid?: boolean;
  orientation?: FieldsetOrientation;
}

export type FieldsetLegendProps = ComponentPropsWithoutRef<'legend'>;
