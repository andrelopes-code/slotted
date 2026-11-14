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

/* Values compared down the list end on one vertical line at the row's inline end. */
describe('a row list with valueAlign end', () => {
  function edges(layout: 'row' | 'stack', width = '40rem') {
    render(
      <div style={{ inlineSize: width }}>
        <DescriptionList layout={layout} valueAlign="end" variant="ruled">
          <DescriptionListItem>
            <DescriptionListTerm>Opens in</DescriptionListTerm>
            <DescriptionListDescription>Cards</DescriptionListDescription>
          </DescriptionListItem>
          <DescriptionListItem>
            <DescriptionListTerm>Counts toward liquidity</DescriptionListTerm>
            <DescriptionListDescription>No, never</DescriptionListDescription>
          </DescriptionListItem>
        </DescriptionList>
      </div>,
    );
    const list = document.querySelector('[data-part="list"]') as HTMLElement;
    const descriptions = [...document.querySelectorAll<HTMLElement>('[data-part="description"]')];
    const values = [...document.querySelectorAll<HTMLElement>('[data-part="value"]')];
    const box = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      return {
        end: rect.right - parseFloat(style.paddingRight),
        start: rect.left + parseFloat(style.paddingLeft),
      };
    };

    return {
      descriptions: descriptions.map(box),
      list: box(list),
      values: values.map((value) => value.getBoundingClientRect()),
    };
  }

  it('ends every value at the inline end of the list', () => {
    const { descriptions, list, values } = edges('row');

    expect(values).toHaveLength(2);
    for (const [index, value] of values.entries()) {
      expect(value.right).toBeCloseTo(descriptions[index]!.end, 0);
      expect(descriptions[index]!.end).toBeCloseTo(list.end, 0);
    }
  });

  it.each([
    ['a stacked list', 'stack', '40rem'],
    ['a row list folded to a stack', 'row', '16rem'],
  ] as const)('keeps the values at the start in %s', (_name, layout, width) => {
    const { descriptions, values } = edges(layout, width);

    for (const [index, value] of values.entries()) {
      expect(value.left).toBeCloseTo(descriptions[index]!.start, 0);
    }
  });
});
