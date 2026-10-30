import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VisuallyHidden } from './index';

describe('VisuallyHidden', () => {
  it('leaves its content in the accessibility tree', () => {
    render(<VisuallyHidden>Skip to content</VisuallyHidden>);

    const element = screen.getByText('Skip to content');
    expect(element).toBeInTheDocument();
    expect(element).not.toHaveAttribute('aria-hidden');
    expect(element.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('renders a span, which contributes no semantics of its own', () => {
    render(<VisuallyHidden>Loading</VisuallyHidden>);

    expect(screen.getByText('Loading').tagName).toBe('SPAN');
  });

  it('names itself with the identifier the stylesheet hides', () => {
    render(<VisuallyHidden>Loading</VisuallyHidden>);

    const element = screen.getByText('Loading');
    expect(element).toHaveAttribute('data-ui', 'visually-hidden');
    expect(element).toHaveAttribute('data-part', 'root');
  });

  /** A class name is not contract, so the family must not need one of its own. */
  it('adds no class of its own', () => {
    render(<VisuallyHidden>Loading</VisuallyHidden>);

    expect(screen.getByText('Loading')).not.toHaveAttribute('class');
  });

  it('marks the focusable variant so focus can reveal it', () => {
    render(<VisuallyHidden focusable>Skip to content</VisuallyHidden>);

    expect(screen.getByText('Skip to content')).toHaveAttribute('data-focusable', '');
  });

  it('omits the marker when the content stays hidden under focus', () => {
    render(<VisuallyHidden>Loading</VisuallyHidden>);

    expect(screen.getByText('Loading')).not.toHaveAttribute('data-focusable');
  });

  it('carries the class the consumer passed', () => {
    render(<VisuallyHidden className="app-skip-link">Skip to content</VisuallyHidden>);

    expect(screen.getByText('Skip to content')).toHaveClass('app-skip-link');
  });

  it('forwards the attributes the consumer set', () => {
    render(
      <VisuallyHidden id="announcement" aria-live="polite" lang="en">
        Saved
      </VisuallyHidden>,
    );

    const element = screen.getByText('Saved');
    expect(element).toHaveAttribute('id', 'announcement');
    expect(element).toHaveAttribute('aria-live', 'polite');
    expect(element).toHaveAttribute('lang', 'en');
  });

  it('hands the wiring to another element through render', () => {
    render(
      <VisuallyHidden focusable render={(props) => <a {...props} href="#main" />}>
        Skip to content
      </VisuallyHidden>,
    );

    const link = screen.getByRole('link', { name: 'Skip to content' });
    expect(link).toHaveAttribute('data-ui', 'visually-hidden');
    expect(link).toHaveAttribute('data-focusable', '');
  });
});
