import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { ToggleButton } from './toggle-button';

const defaults = contract.members.toggleButton.defaults;

describe('ToggleButton', () => {
  it('is a native button announced as a toggle', () => {
    render(<ToggleButton>Pin</ToggleButton>);
    const button = screen.getByRole('button', { name: 'Pin' });

    expect(button.localName).toBe(contract.members.toggleButton.nativeElement);
    expect(button).toHaveAttribute('data-ui', contract.ui);
    expect(button).toHaveAttribute('aria-pressed', String(defaults.defaultPressed));
    expect(button).toHaveAttribute('data-tone', defaults.tone);
    expect(button).toHaveAttribute('data-variant', defaults.variant);
  });

  it('owns its state when the consumer passes only an initial value', () => {
    render(<ToggleButton defaultPressed>Pin</ToggleButton>);
    const button = screen.getByRole('button', { name: 'Pin' });

    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).not.toHaveAttribute('data-pressed');
  });

  /** A later change to the initial value is not new state arriving silently. */
  it('reads the initial value once', () => {
    const { rerender } = render(<ToggleButton defaultPressed={false}>Pin</ToggleButton>);
    rerender(<ToggleButton defaultPressed>Pin</ToggleButton>);

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('never moves state the consumer owns', () => {
    const onPressedChange = vi.fn();
    render(
      <ToggleButton onPressedChange={onPressedChange} pressed={false}>
        Pin
      </ToggleButton>,
    );
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(onPressedChange).toHaveBeenCalledOnce();
  });

  it('moves when the consumer hands the new value back', () => {
    function Controlled() {
      const [pressed, setPressed] = useState(false);
      return (
        <ToggleButton onPressedChange={(next) => setPressed(next)} pressed={pressed}>
          Pin
        </ToggleButton>
      );
    }
    render(<Controlled />);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-pressed', '');
  });

  it('carries the value, the value it replaces, the reason and the event', () => {
    const onPressedChange = vi.fn();
    render(
      <ToggleButton defaultPressed onPressedChange={onPressedChange}>
        Pin
      </ToggleButton>,
    );

    fireEvent.click(screen.getByRole('button'), { detail: 1 });
    const [pressed, request] = onPressedChange.mock.calls[0] ?? [];
    expect(pressed).toBe(false);
    expect(request.value).toBe(false);
    expect(request.previous).toBe(true);
    expect(request.reason).toBe('pointer');
    expect(request.source).toBeDefined();
  });

  it('says keyboard when the click carried no pointer', () => {
    const onPressedChange = vi.fn();
    render(<ToggleButton onPressedChange={onPressedChange}>Pin</ToggleButton>);

    fireEvent.click(screen.getByRole('button'), { detail: 0 });
    expect(onPressedChange.mock.calls[0]?.[1].reason).toBe('keyboard');
  });

  it('commits nothing when the request is cancelled', () => {
    render(
      <ToggleButton onPressedChange={(_pressed, request) => request.cancel()}>Pin</ToggleButton>,
    );
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('treats a refused activation as no activation', () => {
    const onPressedChange = vi.fn();
    render(
      <ToggleButton onClick={(event) => event.preventDefault()} onPressedChange={onPressedChange}>
        Pin
      </ToggleButton>,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('leaves the disabled state to the platform and keeps saying whether it is on', () => {
    const onPressedChange = vi.fn();
    render(
      <ToggleButton defaultPressed disabled onPressedChange={onPressedChange}>
        Pin
      </ToggleButton>,
    );
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-disabled', '');
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it('renders the content parts the contract names', () => {
    render(
      <ToggleButton end="E" start="S">
        Pin
      </ToggleButton>,
    );
    const parts = [...screen.getByRole('button').querySelectorAll('[data-part]')].map((part) =>
      part.getAttribute('data-part'),
    );

    expect(parts).toEqual(['start', 'label', 'end']);
  });

  /**
   * A toggle that persists reaches a server before the state is true, so it
   * holds the state it still has while it waits and refuses to move.
   */
  it('holds its state while it waits, and refuses to move', () => {
    const onPressedChange = vi.fn();
    render(
      <ToggleButton
        defaultPressed
        loading
        messages={{ loading: 'Saving' }}
        onPressedChange={onPressedChange}
      >
        Pin
      </ToggleButton>,
    );
    const button = screen.getByRole('button', { name: /Pin/ });

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(screen.getByRole('progressbar', { name: 'Saving' })).not.toBeNull();

    fireEvent.click(button);
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
