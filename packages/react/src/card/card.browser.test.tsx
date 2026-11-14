import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card, CardActions, CardHeader } from './index';

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

/* The corner spans the rows of the header's text, so its height is shared by them. */
describe('a card header with actions taller than its title', () => {
  function gap(withActions: boolean) {
    const { unmount } = render(
      <Card>
        <CardHeader>
          <h3 data-testid="title" style={{ lineHeight: '18px', margin: 0 }}>
            Title
          </h3>
          <p data-testid="description" style={{ lineHeight: '16px', margin: 0 }}>
            Description
          </p>
          {withActions && (
            <CardActions>
              <div style={{ blockSize: 34, inlineSize: 80 }} />
            </CardActions>
          )}
        </CardHeader>
      </Card>,
    );
    const title = document.querySelector('[data-testid="title"]') as HTMLElement;
    const description = document.querySelector('[data-testid="description"]') as HTMLElement;
    const distance = description.getBoundingClientRect().top - title.getBoundingClientRect().bottom;

    unmount();

    return distance;
  }

  it('keeps the distance from the title to the description', () => {
    expect(gap(true)).toBeCloseTo(gap(false), 1);
  });
});
