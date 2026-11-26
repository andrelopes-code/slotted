import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '../button';
import { Textarea } from './index';

/* One row beside a button of its size, as a composer lays them out. */
describe('a textarea of one row', () => {
  it.each(['sm', 'md', 'lg'] as const)('is as tall as a button of size %s', (size) => {
    render(
      <div style={{ alignItems: 'start', display: 'flex', gap: 8 }}>
        <Textarea aria-label="Note" autoSize rows={1} size={size} />
        <Button size={size}>Add</Button>
      </div>,
    );
    const textarea = screen.getByRole('textbox').getBoundingClientRect().height;
    const button = screen.getByRole('button', { name: 'Add' }).getBoundingClientRect().height;

    expect(textarea).toBeCloseTo(button, 1);
  });
});
