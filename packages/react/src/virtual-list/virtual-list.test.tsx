import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VirtualList } from './virtual-list';
import { VirtualListItem } from './virtual-list-item';
import type { VirtualListProps } from './virtual-list.types';

const ITEM_SIZE = 40;

function renderList(props: Partial<VirtualListProps> = {}) {
  const view = render(
    <VirtualList aria-label="Rows" itemCount={1000} itemSize={ITEM_SIZE} {...props}>
      {(index) => <VirtualListItem index={index}>Row {index}</VirtualListItem>}
    </VirtualList>,
  );
  const root = screen.getByRole('list');
  return { ...view, root };
}

/**
 * jsdom performs no layout, so the two numbers the component reads from the
 * element are supplied directly. Both are real properties of a real scroll
 * container; only the layout that would set them is missing.
 */
function scrollTo(root: HTMLElement, { clientHeight = 0, scrollTop = 0 }) {
  Object.defineProperty(root, 'clientHeight', { configurable: true, value: clientHeight });
  Object.defineProperty(root, 'scrollTop', { configurable: true, value: scrollTop });
  fireEvent.scroll(root);
}

const keyDown = (key: string) =>
  new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });

const positions = () => screen.getAllByRole('listitem').map((item) => item.style.insetBlockStart);

describe('VirtualList', () => {
  it('renders a window of rows rather than the whole list', () => {
    renderList();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.queryByText('Row 900')).not.toBeInTheDocument();
  });

  it('reports the whole list to assistive technology, not the window', () => {
    renderList();
    const [first] = screen.getAllByRole('listitem');
    expect(first).toHaveAttribute('aria-setsize', '1000');
    expect(first).toHaveAttribute('aria-posinset', '1');
    expect(screen.getByText('Row 3').closest('[role="listitem"]')).toHaveAttribute(
      'aria-posinset',
      '4',
    );
  });

  it('sizes the canvas to the whole list, so the scrollbar describes it', () => {
    const { root } = renderList();
    const canvas = root.querySelector<HTMLElement>('[data-part="canvas"]');
    expect(canvas).toHaveStyle({ blockSize: `${1000 * ITEM_SIZE}px` });
  });

  it('takes the rows out of the accessibility tree of nothing in between', () => {
    const { root } = renderList();
    expect(root.querySelector('[data-part="canvas"]')).toHaveAttribute('role', 'none');
  });

  it('places each row at its own index, not at its position in the window', () => {
    const { root } = renderList();
    scrollTo(root, { clientHeight: 400, scrollTop: 4000 });

    expect(screen.getByText('Row 100').closest('[role="listitem"]')).toHaveStyle({
      insetBlockStart: `${100 * ITEM_SIZE}px`,
    });
    expect(positions()).toEqual(
      Array.from({ length: 18 }, (_, offset) => `${(96 + offset) * ITEM_SIZE}px`),
    );
  });

  it('moves the window when the container scrolls', () => {
    const { root } = renderList();
    expect(screen.queryByText('Row 100')).not.toBeInTheDocument();

    scrollTo(root, { clientHeight: 400, scrollTop: 4000 });

    expect(screen.getByText('Row 100')).toBeInTheDocument();
    expect(screen.queryByText('Row 0')).not.toBeInTheDocument();
  });

  it('buffers overscan rows on both sides of the viewport', () => {
    const { root } = renderList({ overscan: 1 });
    scrollTo(root, { clientHeight: 400, scrollTop: 4000 });

    expect(screen.getByText('Row 99')).toBeInTheDocument();
    expect(screen.queryByText('Row 98')).not.toBeInTheDocument();
  });

  it('makes the scroll container focusable, because nothing else in it is', () => {
    const { root } = renderList();
    expect(root).toHaveAttribute('tabindex', '0');
  });

  it('binds no keys, leaving the container to scroll the way the platform does', () => {
    const { root } = renderList();
    const event = keyDown('ArrowDown');
    root.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('still calls the consumer’s own scroll handler', () => {
    const onScroll = vi.fn();
    const { root } = renderList({ onScroll });
    scrollTo(root, { clientHeight: 400, scrollTop: 4000 });
    expect(onScroll).toHaveBeenCalledTimes(1);
  });

  it('keeps the class name the consumer passed alongside its own', () => {
    const { root } = renderList({ className: 'app-list' });
    expect(root).toHaveClass('slotted-virtual-list', 'app-list');
  });

  it('renders nothing but the canvas for an empty list', () => {
    const { root } = renderList({ itemCount: 0 });
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(root.querySelector<HTMLElement>('[data-part="canvas"]')).toHaveStyle({
      blockSize: '0px',
    });
  });

  it('measures the viewport after the first render, so a server render matches', () => {
    const observed: Element[] = [];
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(element: Element) {
          observed.push(element);
        }
        unobserve() {}
        disconnect = disconnect;
      },
    );

    const { root, unmount } = renderList();
    expect(observed).toEqual([root]);

    unmount();
    expect(disconnect).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('renders without a ResizeObserver, which a server and jsdom both lack', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    expect(() => renderList()).not.toThrow();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    vi.unstubAllGlobals();
  });
});

describe('VirtualListItem', () => {
  it('derives its size from the list, so a consumer cannot mis-set it', () => {
    renderList({ itemSize: 72 });
    expect(screen.getAllByRole('listitem')[0]).toHaveStyle({ blockSize: '72px' });
  });

  it('warns when it is used outside a list, rather than rendering a broken row', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<VirtualListItem index={0}>Orphan</VirtualListItem>);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
