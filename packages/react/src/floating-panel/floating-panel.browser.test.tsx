import { render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

import type { FloatingPlace } from './index';
import {
  FloatingPanel,
  FloatingPanelBody,
  FloatingPanelClose,
  FloatingPanelHandle,
  FloatingPanelTitle,
} from './index';

function Page({
  onPlaceChange,
  place,
}: {
  onPlaceChange?: (place: FloatingPlace) => void;
  place?: FloatingPlace;
}) {
  const [open, setOpen] = useState(false);
  const [clicks, setClicks] = useState(0);

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        Calculator
      </button>
      <button onClick={() => setClicks((count) => count + 1)} type="button">
        Page action {clicks}
      </button>
      <FloatingPanel
        onOpenChange={setOpen}
        open={open}
        {...(place === undefined ? {} : { place })}
        {...(onPlaceChange === undefined ? {} : { onPlaceChange })}
      >
        <FloatingPanelHandle>
          <FloatingPanelTitle>Calculator</FloatingPanelTitle>
          <FloatingPanelClose />
        </FloatingPanelHandle>
        <FloatingPanelBody>
          <input aria-label="Expression" />
        </FloatingPanelBody>
      </FloatingPanel>
    </>
  );
}

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
});
