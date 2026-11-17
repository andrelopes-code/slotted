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

/**
 * The chosen values of a multiple select are the chips over the trigger. One
 * chosen value was also written as bare text in the value part, so its label
 * was drawn twice, one copy over the other.
 */
describe('the value of a multiple select', () => {
  it('is not painted under the chip of one chosen value', () => {
    render(
      <div style={{ inlineSize: '35rem' }}>
        <Select multiple value={['a']} onValueChange={() => {}}>
          <SelectTrigger aria-label="Capabilities">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Structured output</SelectItem>
            <SelectItem value="b">Tools</SelectItem>
          </SelectContent>
        </Select>
      </div>,
    );
    const value = document.querySelector<HTMLElement>('[data-part="value"]')!;
    const summary = value.querySelector<HTMLElement>('[data-part="summary"]')!;
    const tag = document.querySelector('[data-part="tags"] > [data-ui="tag"]')!;

    expect(tag).toHaveTextContent('Structured output');
    expect(value.childNodes).toHaveLength(1);
    expect(summary).toHaveTextContent('Structured output');
    expect(summary.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  });
});
