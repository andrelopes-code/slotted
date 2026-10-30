import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { Button } from '../button';
import { TextField } from './text-field';

/**
 * A theme draws a field's ring flush over its frame and keeps a button's ring
 * off its fill. The fields read `--slotted-control-focus-ring-offset`; a
 * button reads `--slotted-focus-ring-offset`, so the only way was a rule
 * naming every field family.
 */
describe('the focus ring of a field', () => {
  it('takes the control offset, and a button keeps the shared one', async () => {
    const theme = {
      '--slotted-focus-ring-offset': '2px',
      '--slotted-control-focus-ring-offset': '-1px',
    } as CSSProperties;
    render(
      <div style={theme}>
        <TextField aria-label="Name" />
        <Button>Save</Button>
      </div>,
    );
    const root = document.querySelector('[data-ui="text-field"]') as HTMLElement;
    const button = document.querySelector('[data-ui="button"]') as HTMLElement;

    await userEvent.keyboard('{Tab}');
    expect(getComputedStyle(root).outlineOffset).toBe('-1px');

    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(button);
    expect(getComputedStyle(button).outlineOffset).toBe('2px');
  });
});
