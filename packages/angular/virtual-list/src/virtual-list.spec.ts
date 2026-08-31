import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { SlVirtualList } from './virtual-list';
import { SlVirtualListItem } from './virtual-list-item';

const ITEM_SIZE = 40;

@Component({
  imports: [SlVirtualList, SlVirtualListItem],
  template: `
    <div
      slVirtualList
      #list="slVirtualList"
      id="list"
      aria-label="Rows"
      class="app-list"
      [itemCount]="itemCount()"
      [itemSize]="itemSize()"
      [overscan]="overscan()"
    >
      @for (index of list.indices(); track index) {
        <div slVirtualListItem [index]="index">Row {{ index }}</div>
      }
    </div>
  `,
})
class Host {
  readonly itemCount = signal(1000);
  readonly itemSize = signal(ITEM_SIZE);
  readonly overscan = signal(4);
}

@Component({
  imports: [SlVirtualListItem],
  template: `<div slVirtualListItem [index]="0">Orphan</div>`,
})
class OrphanHost {}

/**
 * jsdom performs no layout, so the two numbers the component reads from the
 * element are supplied directly. Both are real properties of a real scroll
 * container; only the layout that would set them is missing.
 */
function scrollTo(root: HTMLElement, { clientHeight = 0, scrollTop = 0 }) {
  Object.defineProperty(root, 'clientHeight', { configurable: true, value: clientHeight });
  Object.defineProperty(root, 'scrollTop', { configurable: true, value: scrollTop });
  root.dispatchEvent(new Event('scroll'));
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const root = element.querySelector<HTMLElement>('#list')!;
  return {
    canvas: () => root.querySelector<HTMLElement>('[data-part="canvas"]')!,
    fixture,
    items: () => [...root.querySelectorAll<HTMLElement>('[role="listitem"]')],
    root,
    scroll: (offsets: { clientHeight?: number; scrollTop?: number }) => {
      scrollTo(root, offsets);
      fixture.detectChanges();
    },
    text: () =>
      [...root.querySelectorAll<HTMLElement>('[role="listitem"]')].map((i) =>
        i.textContent?.trim(),
      ),
  };
}

describe('SlVirtualList', () => {
  it('renders a window of rows rather than the whole list', () => {
    const { items, text } = mount();
    expect(items()).toHaveLength(4);
    expect(text()).toEqual(['Row 0', 'Row 1', 'Row 2', 'Row 3']);
  });

  it('reports the whole list to assistive technology, not the window', () => {
    const { items } = mount();
    expect(items()[0]!.getAttribute('aria-setsize')).toBe('1000');
    expect(items()[0]!.getAttribute('aria-posinset')).toBe('1');
    expect(items()[3]!.getAttribute('aria-posinset')).toBe('4');
  });

  it('sizes the canvas to the whole list, so the scrollbar describes it', () => {
    const { canvas } = mount();
    expect(canvas().style.blockSize).toBe(`${1000 * ITEM_SIZE}px`);
  });

  it('takes the rows out of the accessibility tree of nothing in between', () => {
    const { canvas } = mount();
    expect(canvas().getAttribute('role')).toBe('none');
  });

  it('is a list whose scroll container is focusable, because nothing else in it is', () => {
    const { root } = mount();
    expect(root.getAttribute('role')).toBe('list');
    expect(root.getAttribute('tabindex')).toBe('0');
  });

  it('places each row at its own index, not at its position in the window', () => {
    const { items, scroll } = mount();
    scroll({ clientHeight: 400, scrollTop: 4000 });

    expect(items().map((item) => item.style.insetBlockStart)).toEqual(
      Array.from({ length: 18 }, (_, offset) => `${(96 + offset) * ITEM_SIZE}px`),
    );
    expect(items()[0]!.style.blockSize).toBe(`${ITEM_SIZE}px`);
  });

  it('moves the window when the container scrolls', () => {
    const { scroll, text } = mount();
    expect(text()).not.toContain('Row 100');

    scroll({ clientHeight: 400, scrollTop: 4000 });

    expect(text()).toContain('Row 100');
    expect(text()).not.toContain('Row 0');
  });

  it('buffers overscan rows on both sides of the viewport', () => {
    const { fixture, scroll, text } = mount();
    fixture.componentInstance.overscan.set(1);
    fixture.detectChanges();
    scroll({ clientHeight: 400, scrollTop: 4000 });

    expect(text()).toContain('Row 99');
    expect(text()).not.toContain('Row 98');
  });

  it('binds no keys, leaving the container to scroll the way the platform does', () => {
    const { root } = mount();
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowDown',
    });
    root.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('keeps the class name the consumer passed alongside its own', () => {
    const { root } = mount();
    expect(root.classList.contains('slotted-virtual-list')).toBe(true);
    expect(root.classList.contains('app-list')).toBe(true);
  });

  it('renders nothing but the canvas for an empty list', () => {
    const { canvas, fixture, items } = mount();
    fixture.componentInstance.itemCount.set(0);
    fixture.detectChanges();
    expect(items()).toHaveLength(0);
    expect(canvas().style.blockSize).toBe('0px');
  });

  it('follows the row size the list is given', () => {
    const { fixture, items } = mount();
    fixture.componentInstance.itemSize.set(72);
    fixture.detectChanges();
    expect(items()[0]!.style.blockSize).toBe('72px');
  });

  it('renders without a ResizeObserver, which a server and jsdom both lack', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    expect(() => mount()).not.toThrow();
    vi.unstubAllGlobals();
  });
});

describe('SlVirtualListItem', () => {
  it('warns when it is used outside a list, rather than rendering a broken row', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fixture = TestBed.createComponent(OrphanHost);
    fixture.detectChanges();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
