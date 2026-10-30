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

  /**
   * The tab stop is placed on render paths: at creation, on a refresh after a
   * render, and on `setActive`. None of them reads computed style.
   */
  it('reads no computed style to place the tab stop', () => {
    const { container, items } = mount(three);
    const styles = vi.spyOn(window, 'getComputedStyle');
    const handle = createRovingTabindex(container, { itemSelector: 'button' });
    handle.refresh();
    handle.setActive(2);

    expect(tabindexes(items)).toEqual(['-1', '-1', '0']);
    expect(styles).not.toHaveBeenCalled();
    styles.mockRestore();
    handle.destroy();
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

  /**
   * A control inside a disabled `fieldset` carries no attribute of its own and
   * still cannot be focused. It is how a whole bar is taken out of action with
   * one word.
   */
  it('skips a control an ancestor disabled', () => {
    document.body.innerHTML =
      '<fieldset disabled><div id="group"><button>1</button><button>2</button></div></fieldset>';
    const container = document.getElementById('group') as HTMLElement;
    const items = [...container.querySelectorAll('button')];
    const onMove = vi.fn();
    const handle = createRovingTabindex(container, { itemSelector: 'button', onMove });

    press(items[0]!, 'ArrowRight');

    expect(onMove).not.toHaveBeenCalled();
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

  /**
   * The APG's "next item" is the next one in reading order, so in a
   * right-to-left document it is the one to the left. A collection that always
   * answered `ArrowRight` ran backwards for every reader of Arabic or Hebrew,
   * and the defect was invisible in a left-to-right test suite.
   */
  it('follows the reading direction rather than the physical arrow', () => {
    const { container, items } = mount(three);
    const handle = createRovingTabindex(container, {
      itemSelector: 'button',
      direction: () => 'rtl',
    });

    press(items[0]!, 'ArrowLeft');
    expect(document.activeElement).toBe(items[1]);

    press(items[1]!, 'ArrowRight');
    expect(document.activeElement).toBe(items[0]);

    handle.destroy();
  });

  it('leaves the block axis alone, because dir does not mirror it', () => {
    const { container, items } = mount(three);
    const handle = createRovingTabindex(container, {
      itemSelector: 'button',
      direction: () => 'rtl',
      orientation: () => 'vertical',
    });

    press(items[0]!, 'ArrowDown');
    expect(document.activeElement).toBe(items[1]);

    handle.destroy();
  });

  it('reads the direction off the container when the caller states none', () => {
    const { container, items } = mount(three);
    container.setAttribute('dir', 'rtl');
    const handle = createRovingTabindex(container, { itemSelector: 'button' });

    press(items[0]!, 'ArrowLeft');
    expect(document.activeElement).toBe(items[1]);

    handle.destroy();
  });

  it('leaves an empty group alone', () => {
    const { container } = mount('');
    const handle = createRovingTabindex(container, { itemSelector: 'button' });

    expect(() => handle.setActive(0)).not.toThrow();
    handle.destroy();
  });

  /**
   * A control the reader clicked, or a script focused, holds focus while the
   * tab stop still sits on the item it was written on. Moving relative to the
   * stop rather than to the origin made the first arrow after a click do
   * nothing at all.
   */
  it('moves from where focus is, not from where the tab stop was written', () => {
    const { container, items } = mount(three);
    const handle = createRovingTabindex(container, { itemSelector: 'button' });

    items[2]!.focus();
    press(items[2]!, 'ArrowLeft');

    expect(document.activeElement).toBe(items[1]);
    handle.destroy();
  });

  /**
   * The APG lets a toolbar duplicate the cross-axis pair — "Up Arrow and Down
   * Arrow can duplicate Left Arrow and Right Arrow" — and it is what gives
   * focus a way out of an item that keeps the inline arrows for itself.
   */
  it('duplicates the cross-axis pair when the caller asks for it', () => {
    const { container, items } = mount(three);
    const handle = createRovingTabindex(container, { crossAxis: true, itemSelector: 'button' });

    press(items[0]!, 'ArrowDown');
    expect(document.activeElement).toBe(items[1]);
    press(items[1]!, 'ArrowUp');
    expect(document.activeElement).toBe(items[0]);

    handle.destroy();
  });

  /** `dir` turns the inline axis and leaves the block axis where it is. */
  it('never mirrors the cross-axis pair', () => {
    const { container, items } = mount(three);
    container.setAttribute('dir', 'rtl');
    const handle = createRovingTabindex(container, { crossAxis: true, itemSelector: 'button' });

    press(items[0]!, 'ArrowDown');

    expect(document.activeElement).toBe(items[1]);
    handle.destroy();
  });

  /**
   * A text field in a toolbar needs the inline arrows for its caret, which is
   * what the APG's "include only one such control and make it the last
   * element" is advice about. The container enforces it instead.
   */
  it('leaves a key the focused item keeps for itself', () => {
    document.body.innerHTML =
      '<div id="group"><button>1</button><input id="field" /><button>3</button></div>';
    const container = document.getElementById('group') as HTMLElement;
    const items = [...container.querySelectorAll<HTMLElement>('button, input')];
    const onMove = vi.fn();
    const handle = createRovingTabindex(container, {
      crossAxis: true,
      itemSelector: 'button, input',
      onMove,
      ownedKeys: (item) =>
        item.tagName === 'INPUT' ? ['ArrowLeft', 'ArrowRight', 'Home', 'End'] : [],
    });

    press(items[1]!, 'ArrowRight');
    press(items[1]!, 'Home');
    expect(onMove).not.toHaveBeenCalled();

    press(items[1]!, 'ArrowDown');
    expect(onMove.mock.calls.map(([index]) => index)).toEqual([2]);

    handle.destroy();
  });

  it('does not swallow a key it left to the item', () => {
    document.body.innerHTML = '<div id="group"><input id="field" /></div>';
    const container = document.getElementById('group') as HTMLElement;
    const field = document.getElementById('field') as HTMLElement;
    const handle = createRovingTabindex(container, {
      itemSelector: 'input',
      ownedKeys: () => ['ArrowRight'],
    });

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowRight',
    });
    field.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    handle.destroy();
  });

  /**
   * The APG allows a focusable disabled control "in circumstances where
   * discoverability of a function is crucial". The native attribute is a
   * different thing: the platform will not focus it, so it stays skipped.
   */
  it('keeps an aria-disabled item in the ring when the caller asks', () => {
    const { container, items } = mount(
      '<button>1</button><button aria-disabled="true">2</button><button disabled>3</button>',
    );
    const handle = createRovingTabindex(container, {
      includeAriaDisabled: true,
      itemSelector: 'button',
    });

    press(items[0]!, 'ArrowRight');
    expect(document.activeElement).toBe(items[1]);

    press(items[1]!, 'ArrowRight');
    expect(document.activeElement).toBe(items[0]);

    handle.destroy();
  });
});
