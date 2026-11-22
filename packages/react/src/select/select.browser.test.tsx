import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Inline } from '../inline';
import { TextField } from '../text-field';
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

describe('a select beside a text field in a row', () => {
  /* Each control's flex basis is its content: the select keeps the width of
     its value and chevron, and the text field takes the rest of the row. */
  it('keeps the select at its content and gives the text field the rest', () => {
    const { container } = render(
      <div style={{ inlineSize: '300px' }}>
        <Inline gap={2} wrap="nowrap">
          <TextField aria-label="Value" defaultValue="11.5" />
          <Select onValueChange={() => {}} value="month">
            <SelectTrigger aria-label="Period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </Inline>
      </div>,
    );
    const select = container
      .querySelector('[data-ui="select"][data-part="root"]')!
      .getBoundingClientRect();
    const field = container
      .querySelector('[data-ui="text-field"][data-part="root"]')!
      .getBoundingClientRect();

    expect(select.width).toBeLessThan(150);
    expect(field.width).toBeLessThan(300);
    expect(field.width + select.width).toBeGreaterThan(280);
  });
});
