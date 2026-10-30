import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/hover-card/contract.json';
import { PopoverBody, PopoverFooter, PopoverTitle } from '../popover';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';
import { HoverCardDefaultsProvider } from './hover-card-defaults';
import type { HoverCardProps } from './hover-card.types';

function Basic({ children, ...props }: Partial<HoverCardProps> & { children?: React.ReactNode }) {
  return (
    <p>
      Assigned to{' '}
      <HoverCard {...props}>
        <HoverCardTrigger href="/people/ana">@ana.souza</HoverCardTrigger>
        <HoverCardContent>
          {children ?? <PopoverBody>Ana Souza · Product, Billing</PopoverBody>}
        </HoverCardContent>
      </HoverCard>{' '}
      for review.
    </p>
  );
}

const trigger = () => screen.getByText('@ana.souza');
const layer = () => document.querySelector("[data-ui='popover']");
const panel = () => document.querySelector("[data-ui='popover'] [data-part='content']");

/**
 * jsdom decides `:focus-visible` from the last event it saw: a `Tab` press
 * before the focus is what makes a programmatic focus read as a keyboard one,
 * which is what a reader's own `Tab` does in a browser.
 */
const focusByKeyboard = (element: HTMLElement) => {
  fireEvent.keyDown(document.body, { key: 'Tab' });
  element.focus();
  fireEvent.focus(element);
};

const hover = (element: Element) => fireEvent.pointerEnter(element, { pointerType: 'mouse' });
const unhover = (element: Element) => fireEvent.pointerLeave(element, { pointerType: 'mouse' });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('HoverCard', () => {
  it('owns the link as its root and holds the popover family unchanged', async () => {
    render(<Basic />);
    const root = trigger();
    expect(root.tagName).toBe('A');
    expect(root.getAttribute('data-ui')).toBe('hover-card');
    expect(root.getAttribute('data-part')).toBe('root');
    expect(root.hasAttribute('aria-haspopup')).toBe(false);
    expect(layer()).toBeNull();

    hover(root);
    act(() => void vi.advanceTimersByTime(600));

    await waitFor(() => expect(layer()).not.toBeNull());
    expect(panel()?.getAttribute('role')).toBe('presentation');
    expect(document.querySelector("[data-ui='popover'] [data-part='arrow']")).not.toBeNull();
    expect(root.hasAttribute('data-open')).toBe(true);
    expect(contract.members.hoverCard.parts).toEqual(['root']);
  });

  it('waits openDelay before opening, and a pointer that leaves first opens nothing', async () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);

    hover(trigger());
    act(() => void vi.advanceTimersByTime(599));
    expect(layer()).toBeNull();
    unhover(trigger());
    act(() => void vi.advanceTimersByTime(600));
    expect(layer()).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();

    hover(trigger());
    act(() => void vi.advanceTimersByTime(600));
    await waitFor(() => expect(layer()).not.toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'pointer' }));
  });

  /**
   * Hoverable and Persistent, SC 1.4.13: the card stays while the pointer is on
   * it, and closes only after closeDelay once it has left both.
   */
  it('stays while the pointer is on the card and closes closeDelay after it leaves', async () => {
    render(<Basic />);
    hover(trigger());
    act(() => void vi.advanceTimersByTime(600));
    await waitFor(() => expect(layer()).not.toBeNull());

    unhover(trigger());
    hover(layer() as Element);
    act(() => void vi.advanceTimersByTime(1000));
    expect(layer()).not.toBeNull();

    unhover(layer() as Element);
    act(() => void vi.advanceTimersByTime(299));
    expect(layer()).not.toBeNull();
    act(() => void vi.advanceTimersByTime(1));
    await waitFor(() => expect(layer()).toBeNull());
  });

  it('closes closeDelay after the pointer leaves the trigger for somewhere else', async () => {
    render(<Basic />);
    hover(trigger());
    act(() => void vi.advanceTimersByTime(600));
    await waitFor(() => expect(layer()).not.toBeNull());

    unhover(trigger());
    act(() => void vi.advanceTimersByTime(300));
    await waitFor(() => expect(layer()).toBeNull());
  });

  it('opens at once on keyboard focus and closes with blur when focus moves on', async () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);
    const root = trigger();

    focusByKeyboard(root);
    await waitFor(() => expect(layer()).not.toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'keyboard' }),
    );

    fireEvent.blur(root, { relatedTarget: document.body });
    await waitFor(() => expect(layer()).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'blur' }),
    );
  });

  /**
   * Dismissible, SC 1.4.13 — and the focus still on the trigger must not answer
   * with the card it just closed.
   */
  it('closes on Escape, and does not reopen on the focus the trigger still holds', async () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);
    const root = trigger();
    focusByKeyboard(root);
    await waitFor(() => expect(layer()).not.toBeNull());

    fireEvent.keyDown(root, { key: 'Escape' });
    await waitFor(() => expect(layer()).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'escape' }),
    );

    fireEvent.focus(root);
    act(() => void vi.advanceTimersByTime(700));
    expect(layer()).toBeNull();

    fireEvent.blur(root);
    focusByKeyboard(root);
    await waitFor(() => expect(layer()).not.toBeNull());
  });

  it('makes a navigable card a dialog the link announces and Tab enters', async () => {
    render(
      <Basic navigable>
        <PopoverTitle>Ana Souza</PopoverTitle>
        <PopoverFooter>
          <button type="button">Follow</button>
        </PopoverFooter>
      </Basic>,
    );
    const root = trigger();
    expect(root.getAttribute('aria-haspopup')).toBe('dialog');
    expect(root.getAttribute('aria-expanded')).toBe('false');

    focusByKeyboard(root);
    await waitFor(() => expect(layer()).not.toBeNull());
    expect(panel()?.getAttribute('role')).toBe('dialog');
    expect(root.getAttribute('aria-expanded')).toBe('true');
    expect(root.getAttribute('aria-controls')).toBe(panel()?.id);

    fireEvent.keyDown(root, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Follow' })).toHaveFocus();

    /* Past the last control a focus guard closes the card and brings focus
       back, and the trigger holds the reopening back. */
    const guards = document.querySelectorAll("[data-part='focus-guard']");
    fireEvent.focus(guards[1] as Element);
    await waitFor(() => expect(layer()).toBeNull());
    expect(root).toHaveFocus();
    fireEvent.focus(root);
    act(() => void vi.advanceTimersByTime(700));
    expect(layer()).toBeNull();
  });

  it('opens on a tap on touch instead of following the link, and follows it on the next', async () => {
    render(<Basic />);
    const root = trigger();

    fireEvent.pointerDown(root, { pointerType: 'touch', button: 0 });
    const first = new MouseEvent('click', { bubbles: true, cancelable: true });
    act(() => void root.dispatchEvent(first));
    expect(first.defaultPrevented).toBe(true);
    await waitFor(() => expect(layer()).not.toBeNull());

    fireEvent.pointerDown(root, { pointerType: 'touch', button: 0 });
    const second = new MouseEvent('click', { bubbles: true, cancelable: true });
    act(() => void root.dispatchEvent(second));
    expect(second.defaultPrevented).toBe(false);
  });

  /** One card, many triggers: the one the pointer is on is the anchor. */
  it('shares one card between many triggers, anchored to the one hovered', async () => {
    render(
      <HoverCard>
        <HoverCardTrigger href="/people/ana" data-user="ana">
          @ana.souza
        </HoverCardTrigger>{' '}
        <HoverCardTrigger href="/people/marcus" data-user="marcus">
          @marcus.lee
        </HoverCardTrigger>
        <HoverCardContent>
          <PopoverBody>Preview</PopoverBody>
        </HoverCardContent>
      </HoverCard>,
    );
    const marcus = screen.getByText('@marcus.lee');
    hover(marcus);
    act(() => void vi.advanceTimersByTime(600));
    await waitFor(() => expect(layer()).not.toBeNull());

    expect(marcus.hasAttribute('data-open')).toBe(true);
    expect(screen.getByText('@ana.souza').hasAttribute('data-open')).toBe(false);
  });

  it('is controlled when open is given, and asks rather than moving', async () => {
    const onOpenChange = vi.fn();
    render(<Basic open={false} onOpenChange={onOpenChange} />);
    hover(trigger());
    act(() => void vi.advanceTimersByTime(600));
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'pointer' }));
    expect(layer()).toBeNull();
  });

  it('takes its delays from the defaults provider and never opens while disabled', async () => {
    render(
      <HoverCardDefaultsProvider openDelay={100}>
        <Basic />
      </HoverCardDefaultsProvider>,
    );
    hover(trigger());
    act(() => void vi.advanceTimersByTime(100));
    await waitFor(() => expect(layer()).not.toBeNull());
  });

  it('never opens while disabled, and the link keeps working', () => {
    render(<Basic disabled />);
    hover(trigger());
    act(() => void vi.advanceTimersByTime(700));
    expect(layer()).toBeNull();
    expect(trigger().hasAttribute('data-disabled')).toBe(false);
  });

  it('runs the consumer’s own handlers and keeps native attributes on the link', () => {
    const onPointerEnter = vi.fn();
    render(
      <HoverCard>
        <HoverCardTrigger href="/x" onPointerEnter={onPointerEnter} rel="noopener">
          x
        </HoverCardTrigger>
        <HoverCardContent>Preview</HoverCardContent>
      </HoverCard>,
    );
    const link = screen.getByText('x');
    expect(link.getAttribute('rel')).toBe('noopener');
    hover(link);
    expect(onPointerEnter).toHaveBeenCalledTimes(1);
  });
});
