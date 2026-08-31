import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Kbd } from './index';

describe('Kbd', () => {
  it('renders the element the platform already has for a key', () => {
    render(<Kbd>K</Kbd>);

    expect(screen.getByText('K').tagName).toBe('KBD');
  });

  it('states its size to the stylesheet, defaulting to medium', () => {
    render(
      <>
        <Kbd>K</Kbd>
        <Kbd size="sm">S</Kbd>
      </>,
    );

    expect(screen.getByText('K')).toHaveAttribute('data-size', 'md');
    expect(screen.getByText('S')).toHaveAttribute('data-size', 'sm');
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(<Kbd className="app-kbd">K</Kbd>);

    const kbd = screen.getByText('K');
    expect(kbd).toHaveClass('slotted-kbd');
    expect(kbd).toHaveClass('app-kbd');
  });

  it('forwards the attributes the consumer set', () => {
    render(<Kbd aria-label="Command">⌘</Kbd>);

    expect(screen.getByLabelText('Command')).toBeInTheDocument();
  });

  it('hands the wiring to another element through render', () => {
    render(<Kbd render={(props) => <span {...props} />}>K</Kbd>);

    const kbd = screen.getByText('K');
    expect(kbd.tagName).toBe('SPAN');
    expect(kbd).toHaveClass('slotted-kbd');
  });
});
