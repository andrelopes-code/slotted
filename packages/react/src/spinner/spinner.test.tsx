import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from './index';

describe('Spinner', () => {
  it('announces itself as a status carrying its label', () => {
    render(<Spinner />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading');
    expect(status).toHaveAttribute('data-part', 'root');
  });

  it('takes the label the consumer wrote', () => {
    render(<Spinner label="Fetching invoices" />);

    expect(screen.getByRole('status')).toHaveTextContent('Fetching invoices');
  });

  it('hides the ring itself, so only the label is read', () => {
    render(<Spinner />);

    const indicator = screen.getByRole('status').querySelector('[data-part="indicator"]');
    expect(indicator).toHaveAttribute('aria-hidden', 'true');
  });

  it('hides the label from sight while leaving it readable', () => {
    render(<Spinner />);

    expect(screen.getByText('Loading')).toHaveClass('slotted-visually-hidden');
  });

  it('says nothing at all when it is decorative', () => {
    render(
      <p>
        Saving… <Spinner data-testid="spinner" decorative />
      </p>,
    );

    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByTestId('spinner')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByText('Loading')).toBeNull();
  });

  it('states its size to the stylesheet, defaulting to medium', () => {
    render(
      <>
        <Spinner data-testid="default" />
        <Spinner data-testid="large" size="lg" />
      </>,
    );

    expect(screen.getByTestId('default')).toHaveAttribute('data-size', 'md');
    expect(screen.getByTestId('large')).toHaveAttribute('data-size', 'lg');
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(<Spinner className="app-spinner" data-testid="spinner" />);

    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('slotted-spinner');
    expect(spinner).toHaveClass('app-spinner');
  });

  it('keeps a role the consumer set rather than replacing it', () => {
    render(<Spinner data-testid="spinner" role="progressbar" />);

    expect(screen.getByTestId('spinner')).toHaveAttribute('role', 'progressbar');
  });
});
