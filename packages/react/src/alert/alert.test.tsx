import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert, AlertActions, AlertDescription, AlertIcon, AlertTitle } from './index';

describe('Alert', () => {
  it('says nothing to assistive technology unless it is told to', () => {
    render(<Alert data-testid="alert">Saved</Alert>);

    expect(screen.getByTestId('alert')).not.toHaveAttribute('role');
  });

  it('becomes a polite status when it appears after an action', () => {
    render(<Alert live="polite">Saved</Alert>);

    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('interrupts only when it is told to', () => {
    render(<Alert live="assertive">Connection lost</Alert>);

    expect(screen.getByRole('alert')).toHaveTextContent('Connection lost');
  });

  it('keeps a role the consumer set rather than replacing it', () => {
    render(
      <Alert data-testid="alert" live="assertive" role="region">
        Connection lost
      </Alert>,
    );

    expect(screen.getByTestId('alert')).toHaveAttribute('role', 'region');
  });

  it('states the quietest appearance when it is given none', () => {
    render(<Alert data-testid="alert">Saved</Alert>);

    const alert = screen.getByTestId('alert');
    expect(alert).toHaveAttribute('data-variant', 'accent');
    expect(alert).toHaveAttribute('data-fill', 'subtle');
    expect(alert).toHaveAttribute('data-size', 'md');
  });

  it('states every axis it was given to the stylesheet', () => {
    render(
      <Alert data-testid="alert" fill="solid" size="sm" variant="danger">
        Failed
      </Alert>,
    );

    const alert = screen.getByTestId('alert');
    expect(alert).toHaveAttribute('data-variant', 'danger');
    expect(alert).toHaveAttribute('data-fill', 'solid');
    expect(alert).toHaveAttribute('data-size', 'sm');
  });

  it('names each region so the stylesheet can place it', () => {
    render(
      <Alert>
        <AlertIcon data-testid="icon" />
        <AlertTitle data-testid="title">Payment failed</AlertTitle>
        <AlertDescription data-testid="description">Try another card.</AlertDescription>
        <AlertActions data-testid="actions">Retry</AlertActions>
      </Alert>,
    );

    expect(screen.getByTestId('icon')).toHaveAttribute('data-part', 'icon');
    expect(screen.getByTestId('title')).toHaveAttribute('data-part', 'title');
    expect(screen.getByTestId('description')).toHaveAttribute('data-part', 'description');
    expect(screen.getByTestId('actions')).toHaveAttribute('data-part', 'actions');
  });

  it('hides the icon, because the words already carry the tone', () => {
    render(
      <Alert>
        <AlertIcon data-testid="icon">!</AlertIcon>
      </Alert>,
    );

    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('lets the consumer put the icon back in the accessibility tree', () => {
    render(
      <Alert>
        <AlertIcon aria-hidden={false} data-testid="icon">
          !
        </AlertIcon>
      </Alert>,
    );

    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'false');
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(<Alert className="app-alert" data-testid="alert" />);

    const alert = screen.getByTestId('alert');
    expect(alert).toHaveClass('slotted-alert');
    expect(alert).toHaveClass('app-alert');
  });
});
