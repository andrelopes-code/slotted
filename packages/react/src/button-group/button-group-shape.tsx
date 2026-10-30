import { createContext, useContext } from 'react';

import type { ButtonGroupOrientation } from './button-group.types';

interface ButtonGroupShape {
  /** What the rule between two runs turns with. */
  orientation: ButtonGroupOrientation;
}

const ButtonGroupShapeContext = createContext<ButtonGroupShape>({ orientation: 'horizontal' });

export const ButtonGroupShapeProvider = ButtonGroupShapeContext.Provider;

/**
 * What the separator has to know and cannot see: which way the group runs. A
 * rule written outside a group answers to the default, which is the same
 * answer the stylesheet gives it.
 */
export function useButtonGroupShape(): ButtonGroupShape {
  return useContext(ButtonGroupShapeContext);
}
