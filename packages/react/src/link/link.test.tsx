import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Link } from './index';

describe('Link', () => {
  it('renders an anchor carrying the href it was given', () => {
    render(<Link href="/invoices">Invoices</Link>);

    const link = screen.getByRole('link', { name: 'Invoices' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/invoices');
  });

  it('is underlined unless told otherwise', () => {
    render(
      <>
        <Link href="/a">Default</Link>
        <Link href="/b" underline="none">
          Bare
        </Link>
      </>,
    );

    expect(screen.getByText('Default')).toHaveAttribute('data-underline', 'always');
    expect(screen.getByText('Bare')).toHaveAttribute('data-underline', 'none');
  });

  it('warns that an external link leaves the page', () => {
    render(
      <Link external href="https://example.com">
        Documentation
      </Link>,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('Documentation (opens in a new tab)');
    expect(link).toHaveAccessibleName(/opens in a new tab/);
    expect(link.querySelector('[data-part="external-hint"]')).toHaveClass(
      'slotted-visually-hidden',
    );
  });

  it('takes the wording of the warning from the consumer', () => {
    render(
      <Link external externalHint="(abre numa nova aba)" href="https://example.com">
        Documentação
      </Link>,
    );

    expect(screen.getByRole('link')).toHaveTextContent('Documentação (abre numa nova aba)');
  });

  it('opens an external link in a new tab without leaking the opener', () => {
    render(
      <Link external href="https://example.com">
        Documentation
      </Link>,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('keeps the target and rel the consumer set', () => {
    render(
      <Link external href="https://example.com" rel="me" target="_self">
        Documentation
      </Link>,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_self');
    expect(link).toHaveAttribute('rel', 'me');
  });

  it('says nothing extra when the link stays in the page', () => {
    render(<Link href="/invoices">Invoices</Link>);

    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName('Invoices');
    expect(link).not.toHaveAttribute('target');
    expect(link.querySelector('[data-part="external-hint"]')).toBeNull();
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(
      <Link className="app-link" href="/invoices">
        Invoices
      </Link>,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('slotted-link');
    expect(link).toHaveClass('app-link');
  });

  it('hands the wiring to a router link through render', () => {
    render(
      <Link
        external
        render={(props) => <a {...props} data-testid="router" href="https://example.com" />}
      >
        Documentation
      </Link>,
    );

    const link = screen.getByTestId('router');
    expect(link).toHaveClass('slotted-link');
    expect(link).toHaveTextContent('Documentation (opens in a new tab)');
  });
});
