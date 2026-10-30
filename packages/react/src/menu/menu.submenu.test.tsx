import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Menu } from './menu';
import { MenuContent, MenuTrigger } from './menu-parts';
import { MenuItem } from './menu-items';

/**
 * Where a submenu lands (M2). A headless document lays nothing out, so the
 * surfaces are given the boxes a browser would give them: the parent surface
 * insets its items by five pixels (a border and a step of padding), and the
 * submenu surface insets its first item by the same five. The positioner is
 * real; only the measurements are stated.
 */
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ZERO: Box = { x: 0, y: 0, width: 0, height: 0 };

/** The box an element would have in a browser, stated by what it is. */
function boxOf(element: Element): Box {
  const text = element.textContent ?? '';
  const role = element.getAttribute('role');
  const part = element.getAttribute('data-part');
  if (role === 'menu' && text.includes('Send to'))
    return { x: 100, y: 100, width: 200, height: 120 };
  if (role === 'menuitem' && text === 'Send to') return { x: 105, y: 140, width: 190, height: 32 };
  if (element.getAttribute('data-ui') === 'menu' && part === 'root' && text.includes('Slack')) {
    return { x: 0, y: 0, width: 168, height: 90 };
  }
  if (role === 'menu' && text.includes('Slack')) return { x: 0, y: 0, width: 160, height: 90 };
  if (role === 'menuitem' && text === 'Slack') return { x: 5, y: 5, width: 150, height: 32 };
  return ZERO;
}

function rectOf(value: Box): DOMRect {
  return {
    x: value.x,
    y: value.y,
    left: value.x,
    top: value.y,
    right: value.x + value.width,
    bottom: value.y + value.height,
    width: value.width,
    height: value.height,
    toJSON: () => ({}),
  };
}

function Nested() {
  return (
    <Menu>
      <MenuTrigger>Share</MenuTrigger>
      <MenuContent>
        <MenuItem>Copy link</MenuItem>
        <Menu>
          <MenuTrigger>Send to</MenuTrigger>
          <MenuContent>
            <MenuItem>Slack</MenuItem>
            <MenuItem>Email</MenuItem>
          </MenuContent>
        </Menu>
      </MenuContent>
    </Menu>
  );
}

describe('where a submenu lands', () => {
  beforeEach(() => {
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sits one inset out from the parent edge, its first item level with the item that opened it', async () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      return rectOf(boxOf(this));
    });
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return boxOf(this).width;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return boxOf(this).height;
    });

    render(<Nested />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }), { detail: 1 });
    await screen.findByRole('menu');
    const parentItem = screen.getByRole('menuitem', { name: 'Send to' });

    parentItem.focus();
    fireEvent.keyDown(parentItem, { key: 'ArrowRight' });
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(2));

    const layer = (screen.getAllByRole('menu')[1] as HTMLElement).parentElement as HTMLElement;
    await waitFor(() => expect(layer).toHaveAttribute('data-positioned'));
    /* The item's right edge is at 295; the parent surface's inset of 5 puts
       the layer at 300, and the submenu's inset of 5 lifts it from 140 to 135. */
    expect(layer.style.left).toBe('300px');
    expect(layer.style.top).toBe('135px');
  });

  it('waits a hundred and fifty milliseconds before hover opens it', async () => {
    vi.useFakeTimers();
    try {
      render(<Nested />);
      fireEvent.click(screen.getByRole('button', { name: 'Share' }), { detail: 1 });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      const parentItem = screen.getByRole('menuitem', { name: 'Send to' });

      fireEvent.pointerEnter(parentItem);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      expect(screen.getAllByRole('menu')).toHaveLength(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      expect(screen.getAllByRole('menu')).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

function ThreeLevels() {
  return (
    <Menu>
      <MenuTrigger>Share</MenuTrigger>
      <MenuContent>
        <MenuItem>Copy link</MenuItem>
        <Menu>
          <MenuTrigger>Send to</MenuTrigger>
          <MenuContent>
            <MenuItem>Slack</MenuItem>
            <Menu>
              <MenuTrigger>More</MenuTrigger>
              <MenuContent>
                <MenuItem>Teams</MenuItem>
                <MenuItem>Matrix</MenuItem>
              </MenuContent>
            </Menu>
          </MenuContent>
        </Menu>
      </MenuContent>
    </Menu>
  );
}

/**
 * A submenu is this family opened from an item, so the third level holds every
 * rule the second does: the keyboard reaches it, Escape closes only it, and
 * the inline-start arrow hands focus back to the item that opened it.
 */
describe('three levels deep', () => {
  async function openThird() {
    render(<ThreeLevels />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }), { detail: 1 });
    await screen.findByRole('menu');

    const sendTo = screen.getByRole('menuitem', { name: 'Send to' });
    sendTo.focus();
    fireEvent.keyDown(sendTo, { key: 'ArrowRight' });
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(2));

    const more = screen.getByRole('menuitem', { name: 'More' });
    more.focus();
    fireEvent.keyDown(more, { key: 'ArrowRight' });
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(3));
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Teams' })).toHaveFocus());
    return { sendTo, more };
  }

  it('opens the third level from the keyboard onto its first item', async () => {
    const { more } = await openThird();
    expect(more).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes only the topmost level on Escape, and returns focus to its parent item', async () => {
    const { more } = await openThird();
    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Teams' }), { key: 'Escape' });
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(2));
    await waitFor(() => expect(more).toHaveFocus());
    expect(more).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the third level on ArrowLeft and leaves the second open', async () => {
    const { more } = await openThird();
    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Teams' }), { key: 'ArrowLeft' });
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(2));
    await waitFor(() => expect(more).toHaveFocus());
  });
});
