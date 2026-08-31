import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './index';

describe('Badge', () => {
  it('renders its content in a span with no role of its own', () => {
    render(<Badge>Paid</Badge>);

    const badge = screen.getByText('Paid');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).not.toHaveAttribute('role');
  });

  it('states the quietest appearance when it is given none', () => {
    render(<Badge>Paid</Badge>);

    const badge = screen.getByText('Paid');
    expect(badge).toHaveAttribute('data-variant', 'secondary');
    expect(badge).toHaveAttribute('data-fill', 'solid');
    expect(badge).toHaveAttribute('data-size', 'md');
  });

  it('states every axis it was given to the stylesheet', () => {
    render(
      <Badge fill="outline" size="sm" variant="danger">
        Overdue
      </Badge>,
    );

    const badge = screen.getByText('Overdue');
    expect(badge).toHaveAttribute('data-variant', 'danger');
    expect(badge).toHaveAttribute('data-fill', 'outline');
    expect(badge).toHaveAttribute('data-size', 'sm');
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(<Badge className="app-badge">Paid</Badge>);

    const badge = screen.getByText('Paid');
    expect(badge).toHaveClass('slotted-badge');
    expect(badge).toHaveClass('app-badge');
  });

  it('forwards the attributes the consumer set', () => {
    render(<Badge aria-label="Three unread messages">3</Badge>);

    expect(screen.getByLabelText('Three unread messages')).toHaveTextContent('3');
  });

  it('hands the wiring to another element through render', () => {
    render(<Badge render={(props) => <output {...props} />}>Paid</Badge>);

    const badge = screen.getByText('Paid');
    expect(badge.tagName).toBe('OUTPUT');
    expect(badge).toHaveClass('slotted-badge');
  });
});
