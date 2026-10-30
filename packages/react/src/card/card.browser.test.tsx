import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card, CardHeader } from './index';

/* An empty `auto` track keeps its gutter: the actions column left one gap at the end. */
describe('a card header without actions', () => {
  it('gives its title the header’s full content width', () => {
    render(
      <Card>
        <CardHeader>
          <h3 data-testid="title">
            A title long enough to fill the header of the card from one edge to the other
          </h3>
        </CardHeader>
      </Card>,
    );
    const header = document.querySelector('[data-ui="card"] [data-part="header"]') as HTMLElement;
    const title = header.querySelector('[data-testid="title"]') as HTMLElement;
    const contentRight =
      header.getBoundingClientRect().right - parseFloat(getComputedStyle(header).paddingRight);

    expect(title.getBoundingClientRect().right).toBeCloseTo(contentRight, 0);
  });
});
