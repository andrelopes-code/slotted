import { render } from '@testing-library/react';
import type { FilterGroup } from '@slotted/core/filter';
import { describe, expect, it } from 'vitest';

import { FilterBar } from './index';
import type { FilterBarField } from './index';

const FIELDS: FilterBarField[] = [{ key: 'a', kind: 'set', label: 'A', options: [] }];
const ONE: FilterGroup = {
  join: 'and',
  rules: [
    {
      field: 'a',
      filter: { kind: 'set', join: 'and', conditions: [{ operator: 'anyOf', value: ['x'] }] },
    },
  ],
};

function bar(value: FilterGroup | null) {
  const { container } = render(
    <div style={{ inlineSize: 390 }}>
      <FilterBar fields={FIELDS} value={value} />
    </div>,
  );
  const box = (part: string) =>
    container
      .querySelector(`[data-ui="filter-bar"] [data-part="${part}"]`)!
      .getBoundingClientRect();

  return { box };
}

describe('a filter bar on a phone', () => {
  it('stands the filters button at the end of the search line while no chip shows', () => {
    const { box } = bar(null);

    expect(box('summary').top).toBeCloseTo(box('search').top, 0);
    expect(box('frame').height).toBeLessThan(box('search').height * 2);
  });

  it('brings the row of chips back under the search with the first chip', () => {
    const { box } = bar(ONE);

    expect(box('bar').top).toBeGreaterThanOrEqual(box('search').bottom);
  });
});
