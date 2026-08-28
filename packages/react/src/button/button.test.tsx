import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import {
  BUTTON_SIZES,
  BUTTON_TONES,
  BUTTON_VARIANTS,
} from './button.constants';
import { Button } from './button';

describe('Button', () => {
  it('renders native safe defaults', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.localName).toBe(contract.nativeElement);
    expect(button).toHaveAttribute('data-slotted-component', contract.component);
    expect(button).toHaveAttribute('type', contract.defaults.type);
    expect(button).toHaveAttribute('data-variant', contract.defaults.variant);
    expect(button).toHaveAttribute('data-tone', contract.defaults.tone);
    expect(button).toHaveAttribute('data-size', contract.defaults.size);
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
    expect(parts).toEqual(contract.parts);
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

  it('matches the shared contract axes', () => {
    expect(BUTTON_VARIANTS).toEqual(contract.axes.variant);
    expect(BUTTON_TONES).toEqual(contract.axes.tone);
    expect(BUTTON_SIZES).toEqual(contract.axes.size);
  });
});
