import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Divider } from './index';

describe('Divider', () => {
  it('is a separator by default, without being told to be one', () => {
    render(<Divider data-testid="divider" />);

    const divider = screen.getByTestId('divider');
    expect(divider.tagName).toBe('HR');
    expect(divider).not.toHaveAttribute('role');
    expect(screen.getByRole('separator')).toBe(divider);
  });

  it('leaves the accessibility tree when it is decorative', () => {
    render(<Divider data-testid="divider" decorative />);

    expect(screen.getByTestId('divider')).toHaveAttribute('role', 'none');
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('announces a vertical separator as vertical', () => {
    render(<Divider data-testid="divider" orientation="vertical" />);

    expect(screen.getByTestId('divider')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('leaves aria-orientation off a horizontal separator, which is the default', () => {
    render(<Divider data-testid="divider" />);

    expect(screen.getByTestId('divider')).not.toHaveAttribute('aria-orientation');
  });

  it('states its orientation to the stylesheet in both directions', () => {
    render(
      <>
        <Divider data-testid="horizontal" />
        <Divider data-testid="vertical" orientation="vertical" />
      </>,
    );

    expect(screen.getByTestId('horizontal')).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByTestId('vertical')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(<Divider className="app-rule" data-testid="divider" />);

    const divider = screen.getByTestId('divider');
    expect(divider).toHaveClass('slotted-divider');
    expect(divider).toHaveClass('app-rule');
  });

  it('keeps the role the consumer set rather than replacing it', () => {
    render(<Divider data-testid="divider" decorative role="presentation" />);

    expect(screen.getByTestId('divider')).toHaveAttribute('role', 'presentation');
  });

  it('hands the wiring to another element through render', () => {
    render(
      <Divider
        orientation="vertical"
        render={(props) => <div {...props} data-testid="divider" role="separator" />}
      />,
    );

    const divider = screen.getByTestId('divider');
    expect(divider.tagName).toBe('DIV');
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    expect(divider).toHaveClass('slotted-divider');
  });
});
