import type { ComponentPropsWithoutRef } from 'react';

export type ToolbarOrientation = 'horizontal' | 'vertical';

export interface ToolbarProps extends ComponentPropsWithoutRef<'div'> {
  orientation?: ToolbarOrientation;
}
