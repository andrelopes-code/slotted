import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createRovingTabindex } from './roving-tabindex';

const three = '<button>1</button><button>2</button><button>3</button>';

function mount(markup: string) {
  document.body.innerHTML = `<div id="group">${markup}</div>`;
  const container = document.getElementById('group') as HTMLElement;
  return { container, items: [...container.querySelectorAll('button')] };
}

const press = (element: Element, key: string) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));

const tabindexes = (items: readonly Element[]) =>
  items.map((item) => item.getAttribute('tabindex'));

describe('createRovingTabindex', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('gives the group one tab stop', () => {
    const { container, items } = mount(three);
    const handle = createRovingTabindex(container, { itemSelector: 'button' });

    expect(tabindexes(items)).toEqual(['0', '-1', '-1']);
    handle.destroy();
  });

  it('moves along the row and reports every move', () => {
    const { container, items } = mount(three);
    const onMove = vi.fn();
    const handle = createRovingTabindex(container, { itemSelector: 'button', onMove });

    press(items[0]!, 'ArrowRight');
    press(items[1]!, 'ArrowRight');
    press(items[2]!, 'ArrowLeft');

    expect(onMove.mock.calls.map(([index]) => index)).toEqual([1, 2, 1]);
    expect(tabindexes(items)).toEqual(['-1', '0', '-1']);
    handle.destroy();
  });

  it('ignores the cross-axis keys for its orientation', () => {
    const { container, items } = mount(three);
    const onMove = vi.fn();
    const handle = createRovingTabindex(container, { itemSelector: 'button', onMove });

    press(items[0]!, 'ArrowDown');

    expect(onMove).not.toHaveBeenCalled();
    handle.destroy();
  });

  it('reads the orientation at the time of the key', () => {
    const { container, items } = mount(three);
    let orientation: 'horizontal' | 'vertical' = 'horizontal';
    const onMove = vi.fn();
    const handle = createRovingTabindex(container, {
      itemSelector: 'button',
      onMove,
      orientation: () => orientation,
    });

    press(items[0]!, 'ArrowDown');
    expect(onMove).not.toHaveBeenCalled();

    orientation = 'vertical';
    press(items[0]!, 'ArrowDown');
    expect(onMove).toHaveBeenCalledWith(1, items[1]);

    handle.destroy();
  });

  it('wraps at both ends by default', () => {
    const { container, items } = mount(three);
    const onMove = vi.fn();
    const handle = createRovingTabindex(container, { itemSelector: 'button', onMove });

    press(items[0]!, 'ArrowLeft');

    expect(onMove).toHaveBeenCalledWith(2, items[2]);
    handle.destroy();
  });

  it('clamps at both ends when looping is off', () => {
    const { container, items } = mount(three);
    const onMove = vi.fn();
    const handle = createRovingTabindex(container, {
      itemSelector: 'button',
      loop: false,
      onMove,
    });

    press(items[0]!, 'ArrowLeft');

    expect(onMove).not.toHaveBeenCalled();
    handle.destroy();
  });

  it('jumps to the first and last item', () => {
    const { container, items } = mount(three);
    const onMove = vi.fn();
    const handle = createRovingTabindex(container, { itemSelector: 'button', onMove });

    press(items[0]!, 'End');
    press(items[2]!, 'Home');

    expect(onMove.mock.calls.map(([index]) => index)).toEqual([2, 0]);
    handle.destroy();
  });

  it('skips items disabled either way', () => {
    const { container, items } = mount(
      '<button>1</button><button disabled>2</button><button aria-disabled="true">3</button><button>4</button>',
    );
    const onMove = vi.fn();
    const handle = createRovingTabindex(container, { itemSelector: 'button', onMove });

    press(items[0]!, 'ArrowRight');

    expect(onMove).toHaveBeenCalledWith(3, items[3]);
    handle.destroy();
  });

  it('never places the tab stop on a disabled item', () => {
    const { container, items } = mount('<button disabled>1</button><button>2</button>');
    const handle = createRovingTabindex(container, { itemSelector: 'button' });

    expect(tabindexes(items)).toEqual(['-1', '0']);
    handle.destroy();
  });

  it('moves the tab stop without moving focus', () => {
    const { container, items } = mount(three);
    const handle = createRovingTabindex(container, { itemSelector: 'button' });

    handle.setActive(2);

    expect(tabindexes(items)).toEqual(['-1', '-1', '0']);
    expect(document.activeElement).not.toBe(items[2]);
    handle.destroy();
  });

  it('re-reads the item list on refresh', () => {
    const { container } = mount(three);
    const handle = createRovingTabindex(container, { itemSelector: 'button' });

    container.insertAdjacentHTML('beforeend', '<button>4</button>');
    handle.refresh();

    expect(tabindexes([...container.querySelectorAll('button')])).toEqual(['0', '-1', '-1', '-1']);
    handle.destroy();
  });

  it('stops handling keys after destroy', () => {
    const { container, items } = mount(three);
    const onMove = vi.fn();
    const handle = createRovingTabindex(container, { itemSelector: 'button', onMove });

    handle.destroy();
    press(items[0]!, 'ArrowRight');

    expect(onMove).not.toHaveBeenCalled();
  });

  it('leaves an empty group alone', () => {
    const { container } = mount('');
    const handle = createRovingTabindex(container, { itemSelector: 'button' });

    expect(() => handle.setActive(0)).not.toThrow();
    handle.destroy();
  });
});
