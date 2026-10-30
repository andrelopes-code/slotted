import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createRef } from 'react';

import {
  Card,
  CardActions,
  CardBody,
  CardDefaultsProvider,
  CardFooter,
  CardHeader,
  CardLink,
  CardMedia,
} from './index';

const setup = () =>
  render(
    <Card data-testid="card">
      <CardMedia data-testid="media" />
      <CardHeader data-testid="header">Invoice</CardHeader>
      <CardBody data-testid="body">Due in thirty days</CardBody>
      <CardFooter data-testid="footer">Pay now</CardFooter>
    </Card>,
  );

describe('Card', () => {
  it('is selected in public by the family identifier and its parts', () => {
    setup();

    expect(screen.getByTestId('card')).toHaveAttribute('data-ui', 'card');
    expect(screen.getByTestId('card')).toHaveAttribute('data-part', 'root');
    expect(screen.getByTestId('media')).toHaveAttribute('data-part', 'media');
    expect(screen.getByTestId('header')).toHaveAttribute('data-part', 'header');
    expect(screen.getByTestId('body')).toHaveAttribute('data-part', 'body');
    expect(screen.getByTestId('footer')).toHaveAttribute('data-part', 'footer');
  });

  it('adds no role, because what a card is depends on the page', () => {
    setup();

    for (const id of ['card', 'media', 'header', 'body', 'footer']) {
      expect(screen.getByTestId(id)).not.toHaveAttribute('role');
    }
  });

  it('renders every part as a div by default', () => {
    setup();

    for (const id of ['card', 'media', 'header', 'body', 'footer']) {
      expect(screen.getByTestId(id).tagName).toBe('DIV');
    }
  });

  it('runs as a column until it is asked to run across', () => {
    const { rerender } = render(<Card data-testid="card" />);
    expect(screen.getByTestId('card')).toHaveAttribute('data-orientation', 'vertical');

    rerender(<Card data-testid="card" orientation="horizontal" />);
    expect(screen.getByTestId('card')).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('becomes the element the page needs through render', () => {
    render(
      <Card render={(props) => <article {...props} aria-labelledby="title" />}>
        <CardHeader>
          <h3 id="title">Invoice</h3>
        </CardHeader>
      </Card>,
    );

    expect(screen.getByRole('article')).toHaveAccessibleName('Invoice');
    expect(screen.getByRole('article')).toHaveAttribute('data-ui', 'card');
  });

  it('lets a region become the element that carries its meaning', () => {
    render(
      <Card>
        <CardMedia render={(props) => <figure {...props} data-testid="media" />} />
        <CardFooter render={(props) => <footer {...props} data-testid="footer" />} />
      </Card>,
    );

    expect(screen.getByTestId('media').tagName).toBe('FIGURE');
    expect(screen.getByTestId('footer').tagName).toBe('FOOTER');
    expect(screen.getByTestId('footer')).toHaveAttribute('data-part', 'footer');
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

  it('passes native attributes and events through to the element that owns them', () => {
    render(<Card aria-label="Invoice" data-testid="card" id="invoice-7" lang="en" />);

    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('id', 'invoice-7');
    expect(card).toHaveAttribute('lang', 'en');
    expect(card).toHaveAccessibleName('Invoice');
  });
});

describe('Card state', () => {
  it('writes nothing while it mirrors nothing', () => {
    render(<Card data-testid="card" />);

    expect(screen.getByTestId('card')).not.toHaveAttribute('data-selected');
    expect(screen.getByTestId('card')).not.toHaveAttribute('data-disabled');
  });

  it('mirrors a selection the page owns without announcing it', () => {
    render(
      <Card data-testid="card" selected>
        <CardHeader>
          <input aria-label="Team plan" checked readOnly type="radio" />
        </CardHeader>
      </Card>,
    );

    expect(screen.getByTestId('card')).toHaveAttribute('data-selected', '');
    expect(screen.getByTestId('card')).not.toHaveAttribute('aria-selected');
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('mirrors a disabled control without disabling anything itself', () => {
    render(
      <Card data-testid="card" disabled>
        <CardFooter>
          <button disabled type="button">
            Choose
          </button>
        </CardFooter>
      </Card>,
    );

    expect(screen.getByTestId('card')).toHaveAttribute('data-disabled', '');
    expect(screen.getByTestId('card')).not.toHaveAttribute('aria-disabled');
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('CardLink', () => {
  it('is a link, so the platform supplies the keyboard and the context menu', () => {
    render(
      <Card>
        <CardHeader>
          <CardLink href="/accounts/northwind">Northwind Traders</CardLink>
        </CardHeader>
        <CardBody>Twelve open invoices</CardBody>
      </Card>,
    );

    const action = screen.getByRole('link', { name: 'Northwind Traders' });
    expect(action.tagName).toBe('A');
    expect(action).toHaveAttribute('href', '/accounts/northwind');
    expect(action).toHaveAttribute('data-part', 'link');
  });

  /**
   * The reason the hit area is stretched from the action rather than by making
   * the root a link: a root anchor would take every string in the card into
   * its accessible name.
   */
  it('is named by its own text rather than by the whole card', () => {
    render(
      <Card>
        <CardHeader>
          <CardLink href="/accounts/northwind">Northwind Traders</CardLink>
        </CardHeader>
        <CardBody>Twelve open invoices, settling on the first working day of October</CardBody>
      </Card>,
    );

    expect(screen.getByRole('link')).toHaveAccessibleName('Northwind Traders');
  });

  it('leaves a secondary action in the footer a control of its own', () => {
    render(
      <Card>
        <CardHeader>
          <CardLink href="/accounts/northwind">Northwind Traders</CardLink>
        </CardHeader>
        <CardFooter>
          <a href="/accounts/northwind/settings">Billing settings</a>
        </CardFooter>
      </Card>,
    );

    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Billing settings' })).toHaveAttribute(
      'href',
      '/accounts/northwind/settings',
    );
  });

  /**
   * A router link is still a link. The card stretches a destination and never a
   * command: a whole surface that fires an action on any click, with no visible
   * control boundary, is a misclick nobody can undo.
   */
  it('becomes a router link through render, and keeps the part', () => {
    const RouterLink = ({ to, ...props }: { to: string } & Record<string, unknown>) => (
      <a {...props} href={to} />
    );

    render(
      <Card>
        <CardHeader>
          <CardLink render={(props) => <RouterLink {...props} to="/accounts/northwind" />}>
            Northwind Traders
          </CardLink>
        </CardHeader>
      </Card>,
    );

    const link = screen.getByRole('link', { name: 'Northwind Traders' });
    expect(link).toHaveAttribute('data-part', 'link');
    expect(link).toHaveAttribute('href', '/accounts/northwind');
  });
});

describe('Card appearance', () => {
  it('is outlined at the middle inset until it is told otherwise', () => {
    render(<Card data-testid="card" />);

    expect(screen.getByTestId('card')).toHaveAttribute('data-fill', 'outline');
    expect(screen.getByTestId('card')).toHaveAttribute('data-size', 'md');
  });

  it('takes the fill and the inset the page asks for', () => {
    render(<Card data-testid="card" fill="elevated" size="lg" />);

    expect(screen.getByTestId('card')).toHaveAttribute('data-fill', 'elevated');
    expect(screen.getByTestId('card')).toHaveAttribute('data-size', 'lg');
  });

  it('lets an application decide once for every card under it', () => {
    render(
      <CardDefaultsProvider fill="subtle" size="sm">
        <Card data-testid="card" />
      </CardDefaultsProvider>,
    );

    expect(screen.getByTestId('card')).toHaveAttribute('data-fill', 'subtle');
    expect(screen.getByTestId('card')).toHaveAttribute('data-size', 'sm');
  });

  /** The consumer's explicit value always wins over a provider. */
  it('keeps a value the card states over the one it inherits', () => {
    render(
      <CardDefaultsProvider fill="subtle" size="sm">
        <Card data-testid="card" size="lg" />
      </CardDefaultsProvider>,
    );

    expect(screen.getByTestId('card')).toHaveAttribute('data-fill', 'subtle');
    expect(screen.getByTestId('card')).toHaveAttribute('data-size', 'lg');
  });

  it('lets a nested provider change one default and inherit the rest', () => {
    render(
      <CardDefaultsProvider fill="subtle" size="sm">
        <CardDefaultsProvider size="lg">
          <Card data-testid="card" />
        </CardDefaultsProvider>
      </CardDefaultsProvider>,
    );

    expect(screen.getByTestId('card')).toHaveAttribute('data-fill', 'subtle');
    expect(screen.getByTestId('card')).toHaveAttribute('data-size', 'lg');
  });
});

describe('CardActions', () => {
  it('is the corner of the header, and stays a region of its own', () => {
    render(
      <Card>
        <CardHeader data-testid="header">
          <span>Northwind</span>
          <CardActions data-testid="actions">
            <button type="button">Menu</button>
          </CardActions>
        </CardHeader>
      </Card>,
    );

    expect(screen.getByTestId('actions')).toHaveAttribute('data-part', 'actions');
    expect(screen.getByTestId('header')).toContainElement(screen.getByTestId('actions'));
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });
});

describe('Card native element', () => {
  it('hands the consumer the element itself', () => {
    const card = createRef<HTMLDivElement>();
    render(<Card data-testid="card" ref={card} />);

    expect(card.current).toBe(screen.getByTestId('card'));
  });
});
