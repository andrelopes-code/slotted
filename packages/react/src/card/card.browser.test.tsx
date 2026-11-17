import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card, CardActions, CardBody, CardHeader } from './index';

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

/**
 * A list inside a card stopped one inset short of the card's edge on both
 * sides. A bled body runs its children edge to edge and takes the card's
 * lower corners when it is the last region.
 */
describe('a card body that bleeds', () => {
  it('runs a rule between two rows from one edge of the card to the other', () => {
    const { container } = render(
      <div style={{ inlineSize: 320 }}>
        <Card>
          <CardHeader>Limits</CardHeader>
          <CardBody bleed>
            <div>Requests</div>
            <hr data-testid="rule" style={{ border: 0, blockSize: 1, margin: 0 }} />
            <div>Tokens</div>
          </CardBody>
        </Card>
      </div>,
    );
    const card = container.querySelector('[data-ui="card"]')!;
    const body = container.querySelector<HTMLElement>('[data-part="body"]')!;
    const rule = container.querySelector('[data-testid="rule"]')!.getBoundingClientRect();
    const box = card.getBoundingClientRect();

    expect(rule.left).toBeCloseTo(box.left, 1);
    expect(rule.right).toBeCloseTo(box.right, 1);
    expect(body.getBoundingClientRect().bottom).toBeCloseTo(box.bottom, 1);
    expect(getComputedStyle(body).borderEndEndRadius).toBe(
      getComputedStyle(card).borderEndEndRadius,
    );
    expect(getComputedStyle(body).borderStartStartRadius).toBe('0px');
  });

  it('keeps the inset of a body that does not bleed', () => {
    const { container } = render(
      <Card>
        <CardBody>
          <div data-testid="row">Requests</div>
        </CardBody>
      </Card>,
    );
    const card = container.querySelector('[data-ui="card"]')!.getBoundingClientRect();
    const row = container.querySelector('[data-testid="row"]')!.getBoundingClientRect();

    expect(row.left).toBeGreaterThan(card.left);
  });
});
