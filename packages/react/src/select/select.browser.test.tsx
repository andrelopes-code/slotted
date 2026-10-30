import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Select } from './select';
import { SelectContent, SelectTrigger, SelectValue } from './select-parts';
import { SelectItem } from './select-items';

describe('the frame of a select', () => {
  it('takes the className and style given to SelectTrigger', () => {
    render(
      <div style={{ inlineSize: '35rem' }}>
        <Select value="a" onValueChange={() => {}}>
          <SelectTrigger
            aria-label="Currency"
            className="narrow"
            style={{ maxInlineSize: '15rem' }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">USD</SelectItem>
          </SelectContent>
        </Select>
      </div>,
    );
    const root = document.querySelector<HTMLElement>('[data-ui="select"][data-part="root"]')!;

    expect(root.classList.contains('narrow')).toBe(true);
    expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(15 * 16);
  });
});
