import { render } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import { Radio, RadioGroup } from './index';

/* Picture tiles: the frame and the chosen edge say the choice, and the picture sits above the label. */
describe('a tile group with media and the mark hidden', () => {
  function tiles() {
    render(
      <RadioGroup aria-label="Plan" mark="hidden" name="plan" variant="tile">
        <Radio media={<svg aria-hidden="true" height="40" width="40" />} value="basic">
          Basic
        </Radio>
        <Radio media={<svg aria-hidden="true" height="40" width="40" />} value="pro">
          Pro
        </Radio>
      </RadioGroup>,
    );

    return [...document.querySelectorAll<HTMLElement>('[data-part="item"]')];
  }

  it('renders no mark, and puts the media above the label', () => {
    const items = tiles();

    expect(document.querySelector('[data-part="indicator"]')).toBeNull();
    for (const item of items) {
      const media = item.querySelector('[data-part="media"]')!;
      const label = item.querySelector('[data-part="label"]')!;

      expect(media.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(media.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        label.getBoundingClientRect().top,
      );
    }
  });

  it('keeps one tab stop, and ArrowRight checks the second radio', async () => {
    tiles();
    const [basic, pro] = [...document.querySelectorAll<HTMLInputElement>('input[type="radio"]')];

    await userEvent.tab();
    expect(document.activeElement).toBe(basic);

    await userEvent.keyboard('{ArrowRight}');
    expect(pro!.checked).toBe(true);

    await userEvent.tab();
    expect(document.activeElement).not.toBe(basic);
    expect(document.activeElement).not.toBe(pro);
  });
});
