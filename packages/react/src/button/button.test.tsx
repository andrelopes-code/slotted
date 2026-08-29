import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { BUTTON_SIZES, BUTTON_TONES, BUTTON_VARIANTS } from './button.constants';
import { Button } from './button';

describe('Button', () => {
  it('renders native safe defaults', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.localName).toBe(contract.members.button.nativeElement);
    expect(button).toHaveAttribute('data-slotted-component', 'button');
    expect(button).toHaveAttribute('type', contract.members.button.defaults.type);
    expect(button).toHaveAttribute('data-variant', contract.members.button.defaults.variant);
    expect(button).toHaveAttribute('data-tone', contract.members.button.defaults.tone);
    expect(button).toHaveAttribute('data-size', contract.members.button.defaults.size);
  });

  it('forwards native attributes, events, and refs', () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} name="save" type="submit" onClick={onClick}>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(ref.current?.name).toBe('save');
    expect(ref.current?.type).toBe('submit');
  });

  it('renders logical content parts', () => {
    render(
      <Button leading="L" trailing="T">
        Label
      </Button>,
    );
    const button = screen.getByRole('button');
    const parts = [...button.querySelectorAll('[data-part]')].map((part) =>
      part.getAttribute('data-part'),
    );
    expect(parts).toEqual(contract.members.button.parts.slice(0, -1));
  });

  it('preserves native disabled behavior', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('matches the Button contract defaults and axes', () => {
    expect(BUTTON_VARIANTS).toEqual(contract.axes.variant);
    expect(BUTTON_TONES).toEqual(contract.axes.tone);
    expect(BUTTON_SIZES).toEqual(contract.axes.size);
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('data-variant', contract.members.button.defaults.variant);
    expect(button).toHaveAttribute('data-tone', contract.members.button.defaults.tone);
    expect(button).toHaveAttribute('data-size', contract.members.button.defaults.size);
    expect(button).toHaveAttribute('type', contract.members.button.defaults.type);
  });

  it('exposes full-width layout without changing semantics', () => {
    render(<Button fullWidth>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('data-full-width', '');
  });

  it('blocks activation while loading and preserves focus and name', () => {
    const onClick = vi.fn();
    const onClickCapture = vi.fn();
    const { rerender } = render(
      <Button onClick={onClick} onClickCapture={onClickCapture}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    button.focus();
    rerender(
      <Button loading onClick={onClick} onClickCapture={onClickCapture}>
        Save
      </Button>,
    );
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(onClickCapture).not.toHaveBeenCalled();
    expect(button).not.toBeDisabled();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-state', 'loading');
    expect(screen.getByRole('button', { name: 'Save' })).toBe(button);
  });

  it('blocks true aria-disabled activation before caller handlers while false remains interactive', () => {
    const onClick = vi.fn();
    const onClickCapture = vi.fn();
    const { rerender } = render(
      <Button aria-disabled="true" onClick={onClick} onClickCapture={onClickCapture}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(onClickCapture).not.toHaveBeenCalled();

    rerender(
      <Button aria-disabled="false" onClick={onClick} onClickCapture={onClickCapture}>
        Save
      </Button>,
    );
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(onClickCapture).toHaveBeenCalledOnce();
  });

  it('supports explicit loading text and indicator content', () => {
    render(
      <Button loading loadingText="Saving" loadingIndicator={<span>spinner</span>}>
        Save
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Saving' })).toBeInTheDocument();
    expect(screen.getByText('spinner').closest('[data-part="loading-indicator"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('keeps the child label accessible for non-rendering loading text', () => {
    render(
      <Button loading loadingText={null}>
        Save
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
