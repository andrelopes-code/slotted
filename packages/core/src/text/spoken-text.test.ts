import { describe, expect, it } from 'vitest';

import { spokenText } from './spoken-text';

describe('spokenText', () => {
  it('reads the text without what is hidden from the accessibility tree', () => {
    const label = document.createElement('label');
    label.innerHTML = `Due <b>day</b>\n <span aria-hidden="true">*</span>`;

    expect(spokenText(label)).toBe('Due day');
  });

  it('keeps words that are read, and answers an empty string when nothing is left', () => {
    const optional = document.createElement('label');
    optional.innerHTML = `Amount <span>(optional)</span>`;
    const mark = document.createElement('label');
    mark.innerHTML = `<span aria-hidden="true">*</span>`;

    expect(spokenText(optional)).toBe('Amount (optional)');
    expect(spokenText(mark)).toBe('');
  });
});
