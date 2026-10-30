import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createArrowNavigation } from './arrow-navigation';

const three = '<button>1</button><button>2</button><button>3</button>';

function mount(markup: string) {
  document.body.innerHTML = `<div id="group">${markup}</div>`;
  const container = document.getElementById('group') as HTMLElement;
  return { container, items: [...container.querySelectorAll('button')] };
}

const press = (element: Element, key: string, modifiers: KeyboardEventInit = {}) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, ...modifiers }));

describe('createArrowNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  /**
   * The whole reason the engine exists apart from `createRovingTabindex`: an
   * accordion keeps every header in the page tab sequence, so a helper that
   * wrote a tab stop would take the other headers out of it.
   */
  it('writes no tabindex at all', () => {
    const { container, items } = mount(three);
    const handle = createArrowNavigation(container, {
      itemSelector: 'button',
      orientation: () => 'vertical',
    });

    press(items[0]!, 'ArrowDown');

    expect(items.map((item) => item.getAttribute('tabindex'))).toEqual([null, null, null]);
    expect(document.activeElement).toBe(items[1]);
    handle.destroy();
  });

  /**
   * `focus()` scrolls every scroller above the item, the page included, and
   * Chrome centres an item it has to reveal. A list that scrolls inside a
   * layer anchored to a control takes focus its own way.
   */
  it('lets the caller say how an item takes focus', () => {
    const { container, items } = mount(three);
    const focus = vi.fn((item: HTMLElement) => item.focus({ preventScroll: true }));
    const handle = createArrowNavigation(container, {
      focus,
      itemSelector: 'button',
      orientation: () => 'vertical',
    });

    press(items[0]!, 'End');

    expect(focus).toHaveBeenCalledWith(items[2]);
    expect(document.activeElement).toBe(items[2]);
    handle.destroy();
  });

  it('moves along the axis and reports every move', () => {
    const { container, items } = mount(three);
    const onMove = vi.fn();
    const handle = createArrowNavigation(container, {
      itemSelector: 'button',
      onMove,
      orientation: () => 'vertical',
    });

    press(items[0]!, 'ArrowDown');
    press(items[1]!, 'ArrowUp');

    expect(onMove.mock.calls.map(([index]) => index)).toEqual([1, 0]);
    handle.destroy();
  });

  it('wraps at both ends by default and clamps when looping is off', () => {
    const looping = mount(three);
    const wrapping = createArrowNavigation(looping.container, {
      itemSelector: 'button',
      orientation: () => 'vertical',
    });
    press(looping.items[2]!, 'ArrowDown');
    expect(document.activeElement).toBe(looping.items[0]);
    wrapping.destroy();

    const clamped = mount(three);
    const stopping = createArrowNavigation(clamped.container, {
      itemSelector: 'button',
      loop: false,
      orientation: () => 'vertical',
    });
    clamped.items[2]!.focus();
    press(clamped.items[2]!, 'ArrowDown');
    expect(document.activeElement).toBe(clamped.items[2]);
    stopping.destroy();
  });

  it('jumps to the first and last item', () => {
    const { container, items } = mount(three);
    const handle = createArrowNavigation(container, {
      itemSelector: 'button',
      orientation: () => 'vertical',
    });

    press(items[1]!, 'End');
    expect(document.activeElement).toBe(items[2]);
    press(items[2]!, 'Home');
    expect(document.activeElement).toBe(items[0]);
    handle.destroy();
  });

  it('skips a disabled item', () => {
    const { container, items } = mount(
      '<button>1</button><button disabled>2</button><button>3</button>',
    );
    const handle = createArrowNavigation(container, {
      itemSelector: 'button',
      orientation: () => 'vertical',
    });

    press(items[0]!, 'ArrowDown');

    expect(document.activeElement).toBe(items[2]);
    handle.destroy();
  });

  it('starts from where the caller says when the key came from outside the items', () => {
    const { container, items } = mount(three);
    const handle = createArrowNavigation(container, {
      itemSelector: 'button',
      orientation: () => 'vertical',
      origin: () => 2,
    });

    press(container, 'ArrowUp');

    expect(document.activeElement).toBe(items[1]);
    handle.destroy();
  });

  it('follows the reading direction rather than the physical arrow', () => {
    const { container, items } = mount(three);
    const handle = createArrowNavigation(container, {
      direction: () => 'rtl',
      itemSelector: 'button',
    });

    press(items[0]!, 'ArrowLeft');

    expect(document.activeElement).toBe(items[1]);
    handle.destroy();
  });

  it('re-reads the item list on refresh', () => {
    const { container } = mount(three);
    const handle = createArrowNavigation(container, { itemSelector: 'button' });

    container.append(document.createElement('button'));
    handle.refresh();

    expect(handle.items()).toHaveLength(4);
    handle.destroy();
  });

  /**
   * The collection is read on render paths — a roving tab stop, a refresh —
   * and one `getComputedStyle` there forces a style recalculation of whatever
   * the render has just dirtied. A data-grid of fifty rows paid it per row on
   * every scroll step.
   */
  it('reads no computed style to collect the items', () => {
    const { container, items } = mount(three);
    const styles = vi.spyOn(window, 'getComputedStyle');
    const handle = createArrowNavigation(container, { itemSelector: 'button' });
    handle.refresh();

    expect(handle.items()).toEqual(items);
    expect(handle.firstEnabled()).toBe(0);
    expect(styles).not.toHaveBeenCalled();
    styles.mockRestore();
    handle.destroy();
  });

  it('stops handling keys after destroy', () => {
    const { container, items } = mount(three);
    const handle = createArrowNavigation(container, {
      itemSelector: 'button',
      orientation: () => 'vertical',
    });

    handle.destroy();
    items[0]!.focus();
    press(items[0]!, 'ArrowDown');

    expect(document.activeElement).toBe(items[0]);
  });
});

/**
 * The collapse in `toolbar` hides a control the bar has no room for, and a ring
 * that kept it would hand the reader a stop the platform refuses to honour —
 * the same fact `isNavigationDisabled` records for a disabled control.
 */
describe('createArrowNavigation and an item that cannot be focused', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('skips an item carrying the hidden attribute', () => {
    const { container, items } = mount(
      '<button>1</button><button hidden>2</button><button>3</button>',
    );
    const handle = createArrowNavigation(container, { itemSelector: 'button' });

    items[0]!.focus();
    press(items[0]!, 'ArrowRight');

    expect(handle.items()).toEqual([items[0], items[2]]);
    expect(document.activeElement).toBe(items[2]);
    handle.destroy();
  });

  /**
   * `visibility: hidden` is read at navigation time, for the candidate a key
   * moves to, rather than for the whole list on every read of it.
   */
  it('skips an item whose computed visibility is hidden when a key moves', () => {
    const { container, items } = mount(
      '<button>1</button><button style="visibility: hidden">2</button><button>3</button>',
    );
    const handle = createArrowNavigation(container, {
      itemSelector: 'button',
      orientation: () => 'vertical',
    });

    items[0]!.focus();
    const styles = vi.spyOn(window, 'getComputedStyle');
    press(items[0]!, 'ArrowDown');

    expect(document.activeElement).toBe(items[2]);
    expect(styles).toHaveBeenCalledTimes(2);
    styles.mockRestore();
    handle.destroy();
  });

  it('skips an item inside a hidden subtree', () => {
    const { container, items } = mount(
      '<button>1</button><div hidden><button>2</button></div><button>3</button>',
    );
    const handle = createArrowNavigation(container, { itemSelector: 'button' });

    expect(handle.items()).toEqual([items[0], items[2]]);
    handle.destroy();
  });

  it('takes an item back into the ring when it is shown again', () => {
    const { container, items } = mount(
      '<button>1</button><button hidden>2</button><button>3</button>',
    );
    const handle = createArrowNavigation(container, { itemSelector: 'button' });

    items[1]!.removeAttribute('hidden');
    handle.refresh();

    expect(handle.items()).toEqual(items);
    handle.destroy();
  });

  /**
   * `End` reaches the last item that exists, not the last one the selector
   * matched: a bar whose trailing controls are collapsed still has an end.
   */
  it('ends on the last item that is not hidden', () => {
    const { container, items } = mount(
      '<button>1</button><button>2</button><button hidden>3</button>',
    );
    const handle = createArrowNavigation(container, { itemSelector: 'button' });

    items[0]!.focus();
    press(items[0]!, 'End');

    expect(document.activeElement).toBe(items[1]);
    handle.destroy();
  });

  /**
   * An arrow held with a modifier is a chord, and a chord belongs to whoever
   * bound it. The APG names the ring no modified key, and `multi-select` binds
   * `Alt` with an arrow to move a chip one place along its row — a press the
   * ring was consuming to move focus instead.
   */
  it('leaves a modified arrow to whoever bound it', () => {
    const { container, items } = mount('<button>1</button><button>2</button>');
    const handle = createArrowNavigation(container, { itemSelector: 'button' });

    items[0]!.focus();
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey'] as const) {
      const taken = !press(items[0]!, 'ArrowRight', { [modifier]: true });
      expect(taken, modifier).toBe(false);
      expect(document.activeElement, modifier).toBe(items[0]);
    }

    press(items[0]!, 'ArrowRight');
    expect(document.activeElement).toBe(items[1]);
    handle.destroy();
  });
});
