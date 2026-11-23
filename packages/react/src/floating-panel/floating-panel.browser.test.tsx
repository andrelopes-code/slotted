import { render, screen } from '@testing-library/react';
import { StrictMode, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';

import type { FloatingPanelProps } from './index';
import {
  FloatingPanel,
  FloatingPanelBody,
  FloatingPanelClose,
  FloatingPanelHandle,
  FloatingPanelTitle,
} from './index';

describe('a floating panel', () => {
  it('leaves the page usable, moves by key, and returns focus on Escape', async () => {
    const onPlaceChange = vi.fn();
    render(<Page onPlaceChange={onPlaceChange} />);
    const opener = screen.getByRole('button', { name: 'Calculator' });

    await userEvent.click(opener);
    const panel = screen.getByRole('region', { name: 'Calculator' });
    expect(panel.getAttribute('role')).toBe('region');

    await userEvent.click(screen.getByRole('button', { name: /Page action/ }));
    expect(screen.getByRole('button', { name: 'Page action 1' })).toBeTruthy();

    const before = panel.getBoundingClientRect().left;
    screen.getByRole('button', { name: 'Move' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(onPlaceChange).toHaveBeenCalledTimes(1);
    expect(panel.getBoundingClientRect().left).toBeCloseTo(before - 8, 0);

    opener.focus();
    await userEvent.click(screen.getByRole('textbox', { name: 'Expression' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('region', { name: 'Calculator' })).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('draws a controlled place beyond the viewport inside it', async () => {
    render(<Page place={{ x: 5000, y: 5000 }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Calculator' }));
    const box = screen.getByRole('region', { name: 'Calculator' }).getBoundingClientRect();

    expect(box.right).toBeLessThanOrEqual(window.innerWidth + 0.5);
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight + 0.5);
    expect(box.left).toBeGreaterThanOrEqual(0);
  });

  it('lets an effect of the application focus a field as it opens', async () => {
    render(
      <StrictMode>
        <Page focusOnOpen />
      </StrictMode>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Calculator' }));

    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Expression' }));
  });

  it('moves by the steps it is given', async () => {
    const onPlaceChange = vi.fn();
    render(<Page largeStep={64} onPlaceChange={onPlaceChange} step={16} />);
    await userEvent.click(screen.getByRole('button', { name: 'Calculator' }));
    const panel = screen.getByRole('region', { name: 'Calculator' });
    const before = panel.getBoundingClientRect();
    screen.getByRole('button', { name: 'Move' }).focus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(panel.getBoundingClientRect().left).toBeCloseTo(before.left - 16, 0);

    await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(panel.getBoundingClientRect().top).toBeCloseTo(before.top - 64, 0);
    expect(onPlaceChange).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['ltr', 'bottom-end'],
    ['ltr', 'top-start'],
    ['rtl', 'bottom-end'],
    ['rtl', 'top-start'],
  ] as const)('opens its inset from the viewport (%s, %s)', async (dir, defaultPlace) => {
    const style = { '--slotted-floating-panel-inset': '40px' } as CSSProperties;
    document.documentElement.dir = dir;
    render(<Page defaultPlace={defaultPlace} style={style} />);
    await userEvent.click(screen.getByRole('button', { name: 'Calculator' }));
    const box = screen.getByRole('region', { name: 'Calculator' }).getBoundingClientRect();
    const { clientHeight, clientWidth } = document.documentElement;
    document.documentElement.dir = '';

    expect(defaultPlace === 'top-start' ? box.top : clientHeight - box.bottom).toBeCloseTo(40, 0);
    expect(
      (dir === 'ltr') === (defaultPlace === 'top-start') ? box.left : clientWidth - box.right,
    ).toBeCloseTo(40, 0);
  });

  it('reports one end per drag, and none for a press that does not move it', async () => {
    const onPlaceChange = vi.fn();
    render(
      <StrictMode>
        <Page onPlaceChange={onPlaceChange} />
      </StrictMode>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Calculator' }));
    const panel = screen.getByRole('region', { name: 'Calculator' });
    const before = panel.getBoundingClientRect();
    const title = screen.getByRole('heading', { name: 'Calculator' }).getBoundingClientRect();
    const at = { x: title.left + 4, y: title.top + title.height / 2 };

    await mouse('mousePressed', at.x, at.y);
    await mouse('mouseReleased', at.x, at.y);
    expect(onPlaceChange).not.toHaveBeenCalled();

    await mouse('mousePressed', at.x, at.y);
    await mouse('mouseMoved', at.x - 20, at.y - 30);
    await mouse('mouseMoved', at.x - 50, at.y - 70);
    await mouse('mouseReleased', at.x - 50, at.y - 70);

    await expect.poll(() => panel.hasAttribute('data-dragging')).toBe(false);
    const after = panel.getBoundingClientRect();
    expect(after.left).toBeCloseTo(before.left - 50, 0);
    expect(after.top).toBeCloseTo(before.top - 70, 0);
    expect(onPlaceChange).toHaveBeenCalledExactlyOnceWith({ x: after.left, y: after.top });
  });
});

interface PageProps extends Omit<FloatingPanelProps, 'children' | 'onOpenChange' | 'open'> {
  readonly focusOnOpen?: boolean;
}

function Page({ focusOnOpen = false, ...panel }: PageProps) {
  const [open, setOpen] = useState(false);
  const [clicks, setClicks] = useState(0);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && focusOnOpen) field.current?.focus();
  }, [focusOnOpen, open]);

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        Calculator
      </button>

      <button onClick={() => setClicks((count) => count + 1)} type="button">
        Page action {clicks}
      </button>

      <FloatingPanel {...panel} onOpenChange={setOpen} open={open}>
        <FloatingPanelHandle>
          <FloatingPanelTitle>Calculator</FloatingPanelTitle>
          <FloatingPanelClose />
        </FloatingPanelHandle>

        <FloatingPanelBody>
          <input aria-label="Expression" ref={field} />
        </FloatingPanelBody>
      </FloatingPanel>
    </>
  );
}

async function mouse(type: 'mousePressed' | 'mouseMoved' | 'mouseReleased', x: number, y: number) {
  const frame = window.frameElement?.getBoundingClientRect();
  await cdp().send('Input.dispatchMouseEvent', {
    type,
    x: (frame?.left ?? 0) + x,
    y: (frame?.top ?? 0) + y,
    button: 'left',
    buttons: type === 'mouseReleased' ? 0 : 1,
    clickCount: 1,
  });
}
