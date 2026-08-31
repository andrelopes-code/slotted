import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './index';
import type { CollapsibleProps } from './index';

const setup = (props: Partial<CollapsibleProps> = {}) =>
  render(
    <Collapsible data-testid="collapsible" {...props}>
      <CollapsibleTrigger>Billing details</CollapsibleTrigger>
      <CollapsibleContent data-testid="content">Invoices are issued monthly.</CollapsibleContent>
    </Collapsible>,
  );

const toggle = (element: HTMLElement, open: boolean) => {
  (element as HTMLDetailsElement).open = open;
  fireEvent(element, new Event('toggle', { bubbles: false }));
};

describe('Collapsible', () => {
  it('is the platform disclosure, not a button and a div', () => {
    setup();

    expect(screen.getByTestId('collapsible').tagName).toBe('DETAILS');
    expect(screen.getByText('Billing details').tagName).toBe('SUMMARY');
  });

  it('starts closed unless told otherwise', () => {
    setup();

    expect(screen.getByTestId('collapsible')).not.toHaveAttribute('open');
  });

  it('opens when it is told to start open', () => {
    setup({ defaultOpen: true });

    expect(screen.getByTestId('collapsible')).toHaveAttribute('open');
  });

  it('follows the platform when the reader opens it', () => {
    setup();
    const details = screen.getByTestId('collapsible');

    toggle(details, true);

    expect(details).toHaveAttribute('open');
  });

  it('reports each change to the consumer', () => {
    const onOpenChange = vi.fn();
    setup({ onOpenChange });

    toggle(screen.getByTestId('collapsible'), true);

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('asks to open, and stays closed until the consumer agrees', () => {
    const onOpenChange = vi.fn();
    setup({ onOpenChange, open: false });
    const details = screen.getByTestId('collapsible');

    toggle(details, true);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(details).not.toHaveAttribute('open');
  });

  it('opens once the consumer passes the new value back', () => {
    const { rerender } = setup({ open: false });

    rerender(
      <Collapsible data-testid="collapsible" open>
        <CollapsibleTrigger>Billing details</CollapsibleTrigger>
        <CollapsibleContent>Invoices are issued monthly.</CollapsibleContent>
      </Collapsible>,
    );

    expect(screen.getByTestId('collapsible')).toHaveAttribute('open');
  });

  it('adds no ARIA of its own, because the element already carries it', () => {
    setup();

    const details = screen.getByTestId('collapsible');
    expect(details).not.toHaveAttribute('role');
    expect(details).not.toHaveAttribute('aria-expanded');
    expect(screen.getByText('Billing details')).not.toHaveAttribute('aria-controls');
  });

  it('names each part so the stylesheet can reach it', () => {
    setup();

    expect(screen.getByTestId('collapsible')).toHaveAttribute('data-part', 'root');
    expect(screen.getByText('Billing details')).toHaveAttribute('data-part', 'trigger');
    expect(screen.getByTestId('content')).toHaveAttribute('data-part', 'content');
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    setup({ className: 'app-collapsible' });

    const details = screen.getByTestId('collapsible');
    expect(details).toHaveClass('slotted-collapsible');
    expect(details).toHaveClass('app-collapsible');
  });
});
