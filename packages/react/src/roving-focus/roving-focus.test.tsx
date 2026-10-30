import { fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useRovingFocus } from './roving-focus';
import type { RovingFocusOptions } from './roving-focus';

/** A speed dial: a trigger that opens three buttons, outside any menu. */
function Dial({
  onClose,
  ...options
}: Partial<Omit<RovingFocusOptions, 'triggerRef' | 'onClose'>> & { onClose?: () => void }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const roving = useRovingFocus({
    orientation: 'vertical',
    ...options,
    onClose: () => {
      setOpen(false);
      onClose?.();
    },
    triggerRef: trigger,
  });
  return (
    <>
      <button
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            setOpen(true);
            /* The items mount with the open; focus them once they have. */
            queueMicrotask(roving.focusFirst);
          }
        }}
        ref={trigger}
      >
        Add
      </button>
      {open && (
        <div onKeyDown={roving.onKeyDown} role="menu">
          <button {...roving.getItemProps(0)}>One</button>
          <button {...roving.getItemProps(1)} disabled>
            Two
          </button>
          <button {...roving.getItemProps(2)}>Three</button>
          <button {...roving.getItemProps(3)} aria-disabled="true">
            Four
          </button>
        </div>
      )}
    </>
  );
}

const key = (name: string) => fireEvent.keyDown(document.activeElement!, { key: name });
const focused = () => document.activeElement?.textContent;

async function opened(props: Parameters<typeof Dial>[0] = {}) {
  render(<Dial {...props} />);
  screen.getByText('Add').focus();
  key('ArrowDown');
  await Promise.resolve();
  await Promise.resolve();
}

describe('useRovingFocus', () => {
  it('keeps the items out of the tab sequence', async () => {
    await opened();
    for (const name of ['One', 'Three', 'Four'])
      expect(screen.getByText(name)).toHaveAttribute('tabindex', '-1');
  });

  it('focuses the first item when the keyboard opened it', async () => {
    await opened();
    expect(focused()).toBe('One');
  });

  it('moves with the arrows of the axis, skipping a disabled item and keeping an aria-disabled one', async () => {
    await opened();
    key('ArrowDown');
    expect(focused()).toBe('Three');
    key('ArrowDown');
    expect(focused()).toBe('Four');
    key('ArrowUp');
    expect(focused()).toBe('Three');
  });

  it('wraps by default, and stops at the ends when loop is off', async () => {
    await opened();
    key('ArrowUp');
    expect(focused()).toBe('Four');
    key('ArrowDown');
    expect(focused()).toBe('One');
  });

  it('stops at the ends without loop', async () => {
    await opened({ loop: false });
    key('ArrowUp');
    expect(focused()).toBe('One');
    key('End');
    expect(focused()).toBe('Four');
    key('ArrowDown');
    expect(focused()).toBe('Four');
  });

  it('goes to the ends with Home and End', async () => {
    await opened();
    key('End');
    expect(focused()).toBe('Four');
    key('Home');
    expect(focused()).toBe('One');
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    const onClose = vi.fn();
    await opened({ onClose });
    key('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(focused()).toBe('Add');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes on Tab and leaves the key to the browser', async () => {
    const onClose = vi.fn();
    await opened({ onClose });
    expect(fireEvent.keyDown(document.activeElement!, { key: 'Tab' })).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hands focus to the trigger past the end that exits to it', async () => {
    await opened({ exitToTrigger: 'start' });
    key('ArrowUp');
    expect(focused()).toBe('Add');
  });

  it('reads a dial that rises from its trigger: ArrowDown from the first item returns to it', async () => {
    await opened({ exitToTrigger: 'start', reverse: true });
    expect(focused()).toBe('One');
    key('ArrowUp');
    expect(focused()).toBe('Three');
    key('ArrowDown');
    expect(focused()).toBe('One');
    key('ArrowDown');
    expect(focused()).toBe('Add');
  });

  it('reads the horizontal axis in the reading direction', async () => {
    document.documentElement.dir = 'rtl';
    try {
      await opened({ orientation: 'horizontal' });
      key('ArrowLeft');
      expect(focused()).toBe('Three');
      key('ArrowRight');
      expect(focused()).toBe('One');
    } finally {
      document.documentElement.removeAttribute('dir');
    }
  });
});
