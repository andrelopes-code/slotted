import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SplitterProps } from './index';

import { Splitter, SplitterHandle, SplitterPane } from './index';

function setup(props: Partial<SplitterProps> = {}) {
  const result = render(
    <Splitter data-testid="splitter" {...props}>
      <SplitterPane data-testid="start">Start</SplitterPane>
      <SplitterHandle aria-label="Resize panes" />
      <SplitterPane data-testid="end">End</SplitterPane>
    </Splitter>,
  );

  const root = screen.getByTestId('splitter');
  root.getBoundingClientRect = () => ({ height: 400, left: 0, top: 0, width: 1000 }) as DOMRect;

  return { ...result, handle: screen.getByRole('separator'), root };
}

const press = (element: Element, key: string) => fireEvent.keyDown(element, { key });

describe('Splitter', () => {
  it('reports the first pane as a percentage of the container', () => {
    const { handle } = setup();

    expect(handle).toHaveAttribute('aria-valuenow', '50');
    expect(handle).toHaveAttribute('aria-valuemin', '0');
    expect(handle).toHaveAttribute('aria-valuemax', '100');
  });

  it('writes the position as the first grid track', () => {
    const { root } = setup({ defaultValue: 30 });

    expect(root).toHaveStyle({ gridTemplateColumns: '30% auto 1fr' });
  });

  it('lays stacked panes out in rows instead of columns', () => {
    const { root } = setup({ defaultValue: 30, orientation: 'vertical' });

    expect(root).toHaveStyle({ gridTemplateRows: '30% auto 1fr' });
  });

  it('calls the separator vertical when the panes are side by side', () => {
    const { handle } = setup();

    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('leaves aria-orientation off a horizontal separator, which is the default', () => {
    const { handle } = setup({ orientation: 'vertical' });

    expect(handle).not.toHaveAttribute('aria-orientation');
  });

  it('is the only focusable part of the family', () => {
    const { handle } = setup();

    expect(handle).toHaveAttribute('tabindex', '0');
    expect(screen.getByTestId('start')).not.toHaveAttribute('tabindex');
  });

  it('moves one step towards each edge with the arrows across the axis', () => {
    const { handle } = setup({ step: 10 });

    press(handle, 'ArrowRight');
    expect(handle).toHaveAttribute('aria-valuenow', '60');

    press(handle, 'ArrowLeft');
    press(handle, 'ArrowLeft');
    expect(handle).toHaveAttribute('aria-valuenow', '40');
  });

  it('ignores the arrows along the axis, so the page can still scroll', () => {
    const { handle } = setup();

    press(handle, 'ArrowUp');
    press(handle, 'ArrowDown');

    expect(handle).toHaveAttribute('aria-valuenow', '50');
  });

  it('uses the other arrow pair when the panes are stacked', () => {
    const { handle } = setup({ orientation: 'vertical', step: 10 });

    press(handle, 'ArrowDown');
    expect(handle).toHaveAttribute('aria-valuenow', '60');

    press(handle, 'ArrowRight');
    expect(handle).toHaveAttribute('aria-valuenow', '60');
  });

  it('goes to each end with Home and End', () => {
    const { handle } = setup({ max: 90, min: 10 });

    press(handle, 'Home');
    expect(handle).toHaveAttribute('aria-valuenow', '10');

    press(handle, 'End');
    expect(handle).toHaveAttribute('aria-valuenow', '90');
  });

  it('collapses on Enter and restores the position it left', () => {
    const { handle } = setup({ defaultValue: 70, min: 10 });

    press(handle, 'Enter');
    expect(handle).toHaveAttribute('aria-valuenow', '10');

    press(handle, 'Enter');
    expect(handle).toHaveAttribute('aria-valuenow', '70');
  });

  it('holds the position between the minimum and the maximum', () => {
    const { handle } = setup({ max: 80, min: 20, step: 50 });

    press(handle, 'ArrowRight');
    expect(handle).toHaveAttribute('aria-valuenow', '80');

    press(handle, 'ArrowLeft');
    press(handle, 'ArrowLeft');
    expect(handle).toHaveAttribute('aria-valuenow', '20');
  });

  it('follows the pointer while it is captured', () => {
    const { handle } = setup();
    handle.setPointerCapture = vi.fn();
    handle.hasPointerCapture = () => true;
    handle.releasePointerCapture = vi.fn();

    fireEvent.pointerDown(handle, { button: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 250, pointerId: 1 });

    expect(handle).toHaveAttribute('aria-valuenow', '25');
  });

  it('stops following once the pointer is released', () => {
    const { handle } = setup();
    handle.setPointerCapture = vi.fn();
    handle.hasPointerCapture = () => true;
    handle.releasePointerCapture = vi.fn();

    fireEvent.pointerDown(handle, { button: 0, pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 900, pointerId: 1 });

    expect(handle).toHaveAttribute('aria-valuenow', '50');
  });

  it('reports the value the consumer controls, and asks for changes', () => {
    const onValueChange = vi.fn();
    const { handle } = setup({ onValueChange, step: 10, value: 40 });

    press(handle, 'ArrowRight');

    expect(onValueChange).toHaveBeenCalledWith(50);
    expect(handle).toHaveAttribute('aria-valuenow', '40');
  });

  it('warns in development when nothing names the handle', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <Splitter>
        <SplitterPane>Start</SplitterPane>
        <SplitterHandle />
        <SplitterPane>End</SplitterPane>
      </Splitter>,
    );

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('names each part so the stylesheet can place them', () => {
    const { handle, root } = setup();

    expect(root).toHaveAttribute('data-part', 'root');
    expect(screen.getByTestId('start')).toHaveAttribute('data-part', 'pane');
    expect(handle).toHaveAttribute('data-part', 'handle');
  });
});
