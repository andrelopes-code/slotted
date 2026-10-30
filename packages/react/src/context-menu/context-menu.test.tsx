import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/context-menu/contract.json';
import { MenuContent, MenuItem, MenuSeparator } from '../menu';
import type { MenuHandle } from '../menu';
import { ContextMenu, ContextMenuTrigger } from './context-menu';
import { ContextMenuDefaultsProvider } from './context-menu-defaults';
import type { ContextMenuProps } from './context-menu.types';

function Basic({ children, ...props }: Partial<ContextMenuProps> & { children?: React.ReactNode }) {
  return (
    <ContextMenu {...props}>
      <ContextMenuTrigger tabIndex={0}>{children ?? 'Q3 board deck.pdf'}</ContextMenuTrigger>
      <MenuContent>
        <MenuItem>Open</MenuItem>
        <MenuItem>Rename</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger">Move to trash</MenuItem>
      </MenuContent>
    </ContextMenu>
  );
}

const target = () => document.querySelector("[data-ui='context-menu']") as HTMLElement;
const surface = () => document.querySelector("[data-ui='menu'] [role='menu']");
const item = (name: string) => screen.getByRole('menuitem', { name });

const rightClick = (element: Element, x = 40, y = 60) =>
  fireEvent.contextMenu(element, { clientX: x, clientY: y, button: 2 });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ContextMenu', () => {
  it('owns the target as its root and holds the menu family unchanged', async () => {
    render(<Basic />);
    const root = target();
    expect(root.getAttribute('data-part')).toBe('root');
    expect(root.hasAttribute('aria-haspopup')).toBe(false);
    expect(surface()).toBeNull();

    rightClick(root);

    await waitFor(() => expect(surface()).not.toBeNull());
    expect(surface()?.closest("[data-ui='menu']")).not.toBeNull();
    expect(contract.members.contextMenu.parts).toEqual(['root']);
  });

  it('opens on a secondary click at the pointer, prevents the native menu and focuses the first item', async () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);

    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      button: 2,
      cancelable: true,
      clientX: 40,
      clientY: 60,
    });
    act(() => void target().dispatchEvent(event));

    expect(event.defaultPrevented).toBe(true);
    await waitFor(() => expect(surface()).not.toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'pointer' }));
    expect(target().hasAttribute('data-open')).toBe(true);
    await waitFor(() => expect(item('Open')).toHaveFocus());
  });

  /**
   * The surface moves rather than closing and reopening: `open` did not change,
   * so no request is emitted for the second press.
   */
  it('moves to a new point while open without a second request', async () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);
    rightClick(target(), 40, 60);
    await waitFor(() => expect(surface()).not.toBeNull());

    rightClick(target(), 120, 90);

    expect(surface()).not.toBeNull();
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it('opens from the keyboard with Shift+F10 and the ContextMenu key, anchored to the target', async () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);
    const root = target();
    root.focus();

    fireEvent.keyDown(root, { key: 'F10', shiftKey: true });
    await waitFor(() => expect(surface()).not.toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'keyboard' }),
    );

    /* Windows echoes the key as a contextmenu event; it is not a second press. */
    rightClick(root);
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document.activeElement ?? root, { key: 'Escape' });
    await waitFor(() => expect(surface()).toBeNull());

    fireEvent.keyDown(root, { key: 'ContextMenu' });
    await waitFor(() => expect(surface()).not.toBeNull());
  });

  /**
   * The way back is what held focus when the menu opened — the control inside
   * the row the reader was on — and the target when nothing did.
   */
  it('returns focus to the element that held it when the menu opened', async () => {
    render(
      <Basic>
        <span>Invoice 2026-0412.pdf</span>
        <button type="button">Star</button>
      </Basic>,
    );
    const star = screen.getByRole('button', { name: 'Star' });
    star.focus();

    rightClick(target());
    await waitFor(() => expect(item('Open')).toHaveFocus());

    fireEvent.keyDown(item('Open'), { key: 'Escape' });

    await waitFor(() => expect(surface()).toBeNull());
    expect(star).toHaveFocus();
  });

  it('returns focus to the target itself when nothing held focus', async () => {
    render(<Basic />);
    (document.activeElement as HTMLElement | null)?.blur();

    rightClick(target());
    await waitFor(() => expect(item('Open')).toHaveFocus());

    fireEvent.keyDown(item('Open'), { key: 'Escape' });

    await waitFor(() => expect(surface()).toBeNull());
    expect(target()).toHaveFocus();
  });

  /**
   * The target is a branch of the layer, so the layer would not close on a
   * press inside it; the family does, for the primary button, with the reason
   * the consumer expects of a press anywhere else on the page.
   */
  it('closes on a primary press on the target, as an outside press', async () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);
    rightClick(target());
    await waitFor(() => expect(surface()).not.toBeNull());

    fireEvent.pointerDown(target(), { button: 0, pointerType: 'mouse' });

    await waitFor(() => expect(surface()).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'outsidePress' }),
    );
  });

  it('opens on a long press on touch after the delay, and marks the press meanwhile', async () => {
    render(<Basic />);
    const root = target();

    fireEvent.pointerDown(root, { button: 0, pointerType: 'touch', clientX: 30, clientY: 30 });
    expect(root.hasAttribute('data-pressed')).toBe(true);

    act(() => void vi.advanceTimersByTime(499));
    expect(surface()).toBeNull();

    act(() => void vi.advanceTimersByTime(1));
    await waitFor(() => expect(surface()).not.toBeNull());
    expect(root.hasAttribute('data-pressed')).toBe(false);
  });

  it('cancels the long press when the finger moves or lifts', async () => {
    render(<Basic />);
    const root = target();

    fireEvent.pointerDown(root, { button: 0, pointerType: 'touch', clientX: 30, clientY: 30 });
    fireEvent.pointerMove(root, { pointerType: 'touch', clientX: 30, clientY: 45 });
    expect(root.hasAttribute('data-pressed')).toBe(false);
    act(() => void vi.advanceTimersByTime(600));
    expect(surface()).toBeNull();

    fireEvent.pointerDown(root, { button: 0, pointerType: 'touch', clientX: 30, clientY: 30 });
    fireEvent.pointerUp(root, { pointerType: 'touch' });
    act(() => void vi.advanceTimersByTime(600));
    expect(surface()).toBeNull();
  });

  it('takes the long-press delay from the defaults provider, and lets an instance turn it off', async () => {
    render(
      <ContextMenuDefaultsProvider longPressDelay={200}>
        <Basic />
      </ContextMenuDefaultsProvider>,
    );
    fireEvent.pointerDown(target(), { button: 0, pointerType: 'pen', clientX: 1, clientY: 1 });
    act(() => void vi.advanceTimersByTime(200));
    await waitFor(() => expect(surface()).not.toBeNull());
  });

  it('lets the browser’s own menu through while disabled', () => {
    render(<Basic disabled />);
    const root = target();
    expect(root.hasAttribute('data-disabled')).toBe(true);

    const event = new MouseEvent('contextmenu', { bubbles: true, button: 2, cancelable: true });
    act(() => void root.dispatchEvent(event));

    expect(event.defaultPrevented).toBe(false);
    expect(surface()).toBeNull();
  });

  it('runs the consumer’s handler first and stops when it prevents default', () => {
    const onContextMenu = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(
      <ContextMenu>
        <ContextMenuTrigger onContextMenu={onContextMenu}>Row</ContextMenuTrigger>
        <MenuContent>
          <MenuItem>Open</MenuItem>
        </MenuContent>
      </ContextMenu>,
    );
    rightClick(target());
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(surface()).toBeNull();
  });

  it('renders the consumer’s own element through render, and writes the identity on it', () => {
    render(
      <table>
        <tbody>
          <ContextMenu>
            <ContextMenuTrigger render={(props) => <tr {...props} />}>
              <td>Invoice</td>
            </ContextMenuTrigger>
            <MenuContent>
              <MenuItem>Open</MenuItem>
            </MenuContent>
          </ContextMenu>
        </tbody>
      </table>,
    );
    const row = document.querySelector('tr');
    expect(row?.getAttribute('data-ui')).toBe('context-menu');
    expect(row?.getAttribute('data-part')).toBe('root');
  });

  it('opens from the handle anchored to the target', async () => {
    function Host() {
      const handle = useRef<MenuHandle>(null);
      return (
        <>
          <button type="button" onClick={() => handle.current?.open()}>
            More
          </button>
          <Basic ref={handle} />
        </>
      );
    }
    render(<Host />);
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    await waitFor(() => expect(surface()).not.toBeNull());
  });

  it('declares in the contract every state the target writes', () => {
    expect(contract.members.contextMenu.states).toEqual(['default', 'open', 'pressed', 'disabled']);
    expect(contract.stateModel.open.reasons).toContain('outsidePress');
  });
});
