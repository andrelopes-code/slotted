import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FieldGroup, FieldGroupContent, FieldGroupLegend } from './index';

/**
 * A question's legend stands over its choices at the distance a field's label
 * stands over its control; a section's legend stands a step further from its
 * first field. Both were drawn at the section's distance.
 */
describe('the distance from a legend to the content', () => {
  it.each([
    ['question', '6px'],
    ['section', '20px'],
  ] as const)('of a %s is %s', (kind, gap) => {
    render(
      <FieldGroup kind={kind}>
        <FieldGroupLegend>Ends</FieldGroupLegend>
        <FieldGroupContent>
          <input aria-label="Never" type="radio" />
        </FieldGroupContent>
      </FieldGroup>,
    );
    const content = document.querySelector('[data-part="content"]') as HTMLElement;

    const margin = getComputedStyle(content).marginBlockStart;

    expect(margin).toBe(gap);
  });
});
