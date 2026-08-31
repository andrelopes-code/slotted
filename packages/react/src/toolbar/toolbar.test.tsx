import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Toolbar } from './index';

const setup = (orientation?: 'horizontal' | 'vertical') =>
  render(
    <Toolbar aria-label="Formatting" {...(orientation === undefined ? {} : { orientation })}>
      <button type="button">Bold</button>
      <button disabled type="button">
        Italic
      </button>
      <button type="button">Underline</button>
    </Toolbar>,
  );

const press = (element: Element, key: string) => fireEvent.keyDown(element, { key });

describe('Toolbar', () => {
  it('is a toolbar, which is what makes it one tab stop', () => {
    setup();

    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument();
  });

  it('leaves exactly one control in the tab order', () => {
    setup();

    const [bold, italic, underline] = screen.getAllByRole('button');
    expect(bold).toHaveAttribute('tabindex', '0');
    expect(italic).toHaveAttribute('tabindex', '-1');
    expect(underline).toHaveAttribute('tabindex', '-1');
  });

  it('moves the tab stop with the arrows across the axis', () => {
    setup();
    const [bold, , underline] = screen.getAllByRole('button');

    press(bold!, 'ArrowRight');

    expect(underline).toHaveAttribute('tabindex', '0');
    expect(underline).toHaveFocus();
  });

  it('steps over a disabled control rather than stopping on it', () => {
    setup();
    const [bold, italic] = screen.getAllByRole('button');

    press(bold!, 'ArrowRight');

    expect(italic).toHaveAttribute('tabindex', '-1');
  });

  it('wraps past the end, so the row has no dead corner', () => {
    setup();
    const [bold, , underline] = screen.getAllByRole('button');

    press(bold!, 'ArrowRight');
    press(underline!, 'ArrowRight');

    expect(bold).toHaveFocus();
  });

  it('uses the other arrow pair when the controls are stacked', () => {
    setup('vertical');
    const [bold, , underline] = screen.getAllByRole('button');

    press(bold!, 'ArrowDown');
    expect(underline).toHaveFocus();

    press(underline!, 'ArrowRight');
    expect(underline).toHaveFocus();
  });

  it('goes to each end with Home and End', () => {
    setup();
    const [bold, , underline] = screen.getAllByRole('button');

    press(bold!, 'End');
    expect(underline).toHaveFocus();

    press(underline!, 'Home');
    expect(bold).toHaveFocus();
  });

  it('calls a stacked toolbar vertical, and says nothing for a row', () => {
    const { unmount } = setup('vertical');
    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-orientation', 'vertical');
    unmount();

    setup();
    expect(screen.getByRole('toolbar')).not.toHaveAttribute('aria-orientation');
  });

  it('takes charge of a control added after it was built', async () => {
    const { rerender } = render(
      <Toolbar aria-label="Formatting">
        <button type="button">Bold</button>
      </Toolbar>,
    );

    rerender(
      <Toolbar aria-label="Formatting">
        <button type="button">Bold</button>
        <button type="button">Italic</button>
      </Toolbar>,
    );

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('tabindex', '-1');
    });
  });

  it('warns in development when nothing names it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<Toolbar />);

    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
