import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card, CardBody, CardFooter, CardHeader } from './index';

const setup = () =>
  render(
    <Card data-testid="card">
      <CardHeader data-testid="header">Invoice</CardHeader>
      <CardBody data-testid="body">Due in thirty days</CardBody>
      <CardFooter data-testid="footer">Pay now</CardFooter>
    </Card>,
  );

describe('Card', () => {
  it('names each region so the stylesheet can space them', () => {
    setup();

    expect(screen.getByTestId('card')).toHaveAttribute('data-part', 'root');
    expect(screen.getByTestId('header')).toHaveAttribute('data-part', 'header');
    expect(screen.getByTestId('body')).toHaveAttribute('data-part', 'body');
    expect(screen.getByTestId('footer')).toHaveAttribute('data-part', 'footer');
  });

  it('adds no role, because what a card is depends on the page', () => {
    setup();

    for (const id of ['card', 'header', 'body', 'footer']) {
      expect(screen.getByTestId(id)).not.toHaveAttribute('role');
    }
  });

  it('renders every region as a div by default', () => {
    setup();

    expect(screen.getByTestId('card').tagName).toBe('DIV');
    expect(screen.getByTestId('header').tagName).toBe('DIV');
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(<Card className="app-card" data-testid="card" />);

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('slotted-card');
    expect(card).toHaveClass('app-card');
  });

  it('becomes the element the page needs through render', () => {
    render(
      <Card render={(props) => <article {...props} aria-labelledby="title" />}>
        <CardHeader>
          <h3 id="title">Invoice</h3>
        </CardHeader>
      </Card>,
    );

    const card = screen.getByRole('article');
    expect(card).toHaveClass('slotted-card');
    expect(card).toHaveAccessibleName('Invoice');
  });

  it('holds a body on its own, with no header and no footer', () => {
    render(
      <Card data-testid="card">
        <CardBody data-testid="body">Just a body</CardBody>
      </Card>,
    );

    expect(screen.getByTestId('card').children).toHaveLength(1);
    expect(screen.getByTestId('body')).toHaveTextContent('Just a body');
  });
});
