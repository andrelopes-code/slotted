import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from './index';

/**
 * The row folds when the term track and the narrowest value no longer fit side
 * by side. A fixed 26rem fold stacked a 6rem term over a short value in a
 * 20rem panel, where both fit on one line.
 */
describe('the row fold', () => {
  it.each(CASES)('%s', (_name, width, termWidth, row) => {
    render(
      <div style={{ inlineSize: width }}>
        <DescriptionList layout="row" termWidth={termWidth}>
          <DescriptionListItem>
            <DescriptionListTerm>Amount</DescriptionListTerm>
            <DescriptionListDescription>$ 29.90</DescriptionListDescription>
          </DescriptionListItem>
        </DescriptionList>
      </div>,
    );
    const term = document.querySelector('[data-part="term"]') as HTMLElement;
    const description = document.querySelector('[data-part="description"]') as HTMLElement;

    const sameRow = term.getBoundingClientRect().top === description.getBoundingClientRect().top;

    expect(sameRow).toBe(row);
  });
});

const CASES: Array<[string, string, string | undefined, boolean]> = [
  ['keeps a 6rem term beside its value in a 20rem container', '20rem', '6rem', true],
  ['stacks a 6rem term at 18rem', '18rem', '6rem', false],
  ['stacks the default 14rem term at 26rem', '26rem', undefined, false],
  ['keeps the default 14rem term beside its value at 27rem', '27rem', undefined, true],
];
