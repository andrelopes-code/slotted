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

  it('carries the class the stylesheet hides', () => {
    render(<VisuallyHidden>Loading</VisuallyHidden>);

    expect(screen.getByText('Loading')).toHaveClass('slotted-visually-hidden');
  });

  it('marks the focusable variant so focus can reveal it', () => {
    render(<VisuallyHidden focusable>Skip to content</VisuallyHidden>);

    expect(screen.getByText('Skip to content')).toHaveAttribute('data-focusable', '');
  });

  it('omits the marker when the content stays hidden under focus', () => {
    render(<VisuallyHidden>Loading</VisuallyHidden>);

    expect(screen.getByText('Loading')).not.toHaveAttribute('data-focusable');
  });

  it('keeps the class the consumer passed alongside its own', () => {
    render(<VisuallyHidden className="app-skip-link">Skip to content</VisuallyHidden>);

    const element = screen.getByText('Skip to content');
    expect(element).toHaveClass('slotted-visually-hidden');
    expect(element).toHaveClass('app-skip-link');
  });

  it('forwards the attributes the consumer set', () => {
    render(<VisuallyHidden id="announcement">Saved</VisuallyHidden>);

    expect(screen.getByText('Saved')).toHaveAttribute('id', 'announcement');
  });

  it('hands the wiring to another element through render', () => {
    render(
      <VisuallyHidden focusable render={(props) => <a {...props} href="#main" />}>
        Skip to content
      </VisuallyHidden>,
    );

    const link = screen.getByRole('link', { name: 'Skip to content' });
    expect(link).toHaveClass('slotted-visually-hidden');
    expect(link).toHaveAttribute('data-focusable', '');
  });
});
