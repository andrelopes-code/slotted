import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ToggleButton } from './toggle-button';

describe('ToggleButton', () => {
  it('uses controlled defaults and logical content parts', () => {
    render(
      <ToggleButton leading="L" trailing="T">
        Pin
      </ToggleButton>,
    );

    const button = screen.getByRole('button', { name: 'LPinT' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAttribute('data-slotted-component', 'toggle-button');
    expect(button).toHaveAttribute('data-variant', 'outline');
    expect(button).toHaveAttribute('data-tone', 'neutral');
    expect(button).toHaveAttribute('data-size', 'md');
    expect([...button.querySelectorAll('[data-part]')].map((part) => part.getAttribute('data-part'))).toEqual([
      'leading',
      'label',
      'trailing',
    ]);
  });

  it('forwards native button props and refs', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <ToggleButton ref={ref} name="pin" type="submit">
        Pin
      </ToggleButton>,
    );

    const button = screen.getByRole('button', { name: 'Pin' });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute('name', 'pin');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('reflects controlled pressed state without mutating itself', () => {
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <ToggleButton pressed={false} onPressedChange={onPressedChange}>
        Pin
      </ToggleButton>,
    );
    const button = screen.getByRole('button', { name: 'Pin' });
    fireEvent.click(button);
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    rerender(<ToggleButton pressed>Pin</ToggleButton>);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-state', 'pressed');
  });

  it('runs the consumer click handler before requesting a state change and honors preventDefault', () => {
    const calls: string[] = [];
    const onPressedChange = vi.fn(() => calls.push('pressed'));
    const { rerender } = render(
      <ToggleButton onClick={() => calls.push('click')} onPressedChange={onPressedChange}>
        Pin
      </ToggleButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    expect(calls).toEqual(['click', 'pressed']);
    expect(onPressedChange).toHaveBeenCalledWith(true);

    rerender(
      <ToggleButton onClick={(event) => event.preventDefault()} onPressedChange={onPressedChange}>
        Pin
      </ToggleButton>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    expect(onPressedChange).toHaveBeenCalledTimes(1);
  });

  it.each([true, 'true'] as const)(
    'blocks capture and bubble callbacks plus state requests for aria-disabled=%s',
    (ariaDisabled) => {
      const onClick = vi.fn();
      const onClickCapture = vi.fn();
      const onPressedChange = vi.fn();
      render(
        <ToggleButton
          aria-disabled={ariaDisabled}
          onClick={onClick}
          onClickCapture={onClickCapture}
          onPressedChange={onPressedChange}
        >
          Pin
        </ToggleButton>,
      );

      const button = screen.getByRole('button', { name: 'Pin' });
      fireEvent.click(button);
      expect(onClickCapture).not.toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
      expect(onPressedChange).not.toHaveBeenCalled();
      expect(button).not.toHaveAttribute('data-state', 'disabled');
      expect(button).not.toBeDisabled();
    },
  );

  it.each([false, 'false'] as const)('keeps aria-disabled=%s interactive', (ariaDisabled) => {
    const onPressedChange = vi.fn();
    render(
      <ToggleButton aria-disabled={ariaDisabled} onPressedChange={onPressedChange}>
        Pin
      </ToggleButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('does not request a state change when disabled', () => {
    const onPressedChange = vi.fn();
    render(
      <ToggleButton disabled pressed={false} onPressedChange={onPressedChange}>
        Pin
      </ToggleButton>,
    );
    const button = screen.getByRole('button', { name: 'Pin' });
    fireEvent.click(button);
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-state', 'disabled');
  });

  it('gives explicit disabled state priority over pressed state', () => {
    render(
      <ToggleButton disabled pressed>
        Pin
      </ToggleButton>,
    );

    const button = screen.getByRole('button', { name: 'Pin' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-state', 'disabled');
  });
});
