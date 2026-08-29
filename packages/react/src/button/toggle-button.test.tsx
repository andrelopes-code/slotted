import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, type ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ToggleButton } from './toggle-button';

const buttonCss = readFileSync(resolve(process.cwd(), 'src/button/button.css'), 'utf8');

describe('ToggleButton', () => {
  it('keeps pressed toggle surfaces outside generic interactive selectors', () => {
    const headers = [...buttonCss.matchAll(/\.slotted-button[^{}]*:(?:hover|active)[^{]*\{/g)].map(
      ([header]) => header,
    );

    expect(headers.length).toBeGreaterThanOrEqual(4);
    expect(headers).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/data-variant=['"]solid['"][^{}]*:hover/),
        expect.stringMatching(/data-variant=['"]solid['"][^{}]*:active/),
        expect.stringMatching(
          /data-variant=['"]outline['"][^{}]*data-variant=['"]ghost['"][^{}]*:hover/,
        ),
        expect.stringMatching(
          /data-variant=['"]outline['"][^{}]*data-variant=['"]ghost['"][^{}]*:active/,
        ),
      ]),
    );

    for (const header of headers) {
      expect(header.replace(/\s+/g, '')).toContain(":not([data-state='pressed'])");
    }
  });

  it('accepts pressed as the only aria-pressed state input', () => {
    const rawAriaPressed = (
      <ToggleButton
        {...({
          // @ts-expect-error ToggleButton derives aria-pressed from its pressed prop.
          'aria-pressed': 'mixed',
        } satisfies ComponentProps<typeof ToggleButton>)}
      >
        Pin
      </ToggleButton>
    );
    expect(rawAriaPressed).toBeDefined();
  });

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
    expect(
      [...button.querySelectorAll('[data-part]')].map((part) => part.getAttribute('data-part')),
    ).toEqual(['leading', 'label', 'trailing']);
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
    rerender(
      <ToggleButton pressed onPressedChange={onPressedChange}>
        Pin
      </ToggleButton>,
    );
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-state', 'pressed');
    fireEvent.click(button);
    expect(onPressedChange).toHaveBeenLastCalledWith(false);
    expect(button).toHaveAttribute('aria-pressed', 'true');
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

  it('does not request a state change when the consumer cancels in click capture', () => {
    const onClick = vi.fn();
    const onPressedChange = vi.fn();
    render(
      <ToggleButton
        onClick={onClick}
        onClickCapture={(event) => event.preventDefault()}
        onPressedChange={onPressedChange}
      >
        Pin
      </ToggleButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onPressedChange).not.toHaveBeenCalled();
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

  it.each([false, 'false'] as const)(
    'keeps aria-disabled=%s interactive through capture, bubble, and state request',
    (ariaDisabled) => {
      const calls: string[] = [];
      const onPressedChange = vi.fn((pressed: boolean) => calls.push(`pressed:${pressed}`));
      render(
        <ToggleButton
          aria-disabled={ariaDisabled}
          onClick={() => calls.push('bubble')}
          onClickCapture={() => calls.push('capture')}
          onPressedChange={onPressedChange}
        >
          Pin
        </ToggleButton>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
      expect(onPressedChange).toHaveBeenCalledWith(true);
      expect(calls).toEqual(['capture', 'bubble', 'pressed:true']);
    },
  );

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
