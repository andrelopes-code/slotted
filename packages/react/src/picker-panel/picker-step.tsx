import type { MouseEventHandler } from 'react';

import { Glyph, Icon } from '../icon';

interface PickerStepProps {
  readonly direction: 'previous' | 'next' | 'decrease' | 'increase';
  readonly disabled?: boolean | undefined;
  readonly label: string;
  readonly onClick: MouseEventHandler<HTMLButtonElement>;
}

const GLYPHS = {
  decrease: 'minus',
  increase: 'plus',
  next: 'chevron-right',
  previous: 'chevron-right',
} as const;

/** One step either way: a day, a year, the length of a run. */
export function PickerStep({ direction, disabled, label, onClick }: PickerStepProps) {
  return (
    <button
      aria-label={label}
      data-direction={direction}
      data-part="step"
      data-part-step=""
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon directional={GLYPHS[direction] === 'chevron-right'}>
        <Glyph name={GLYPHS[direction]} />
      </Icon>
    </button>
  );
}
