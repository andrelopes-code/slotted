import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createRemovalFocus } from './removal-focus';

const three = '<button>1</button><button>2</button><button>3</button>';

function mount(markup: string) {
  document.body.innerHTML = `<div id="group" tabindex="-1">${markup}</div>`;
  const container = document.getElementById('group') as HTMLElement;
  return { container, items: () => [...container.querySelectorAll('button')] };
}

/** The observer answers in a microtask, so the assertion has to wait for one. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createRemovalFocus', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('sends focus to the control that took the removed one’s place', async () => {
    const { container, items } = mount(three);
    const handle = createRemovalFocus(container, { itemSelector: 'button' });

    items()[1]!.focus();
    items()[1]!.remove();
    await settled();

    expect(document.activeElement).toBe(items()[1]);
    expect(document.activeElement?.textContent).toBe('3');
    handle.destroy();
  });

  it('falls back to the last control when the removed one was last', async () => {
    const { container, items } = mount(three);
    const handle = createRemovalFocus(container, { itemSelector: 'button' });

    items()[2]!.focus();
    items()[2]!.remove();
    await settled();

    expect(document.activeElement?.textContent).toBe('2');
    handle.destroy();
  });

  /**
   * The step no surveyed implementation takes. Without it the browser leaves
   * focus on the document body and the next Tab starts again at the top of the
   * page, which is the whole reason this module exists.
   */
  it('holds focus in the container when the last control is removed', async () => {
    const { container, items } = mount('<button>only</button>');
    const handle = createRemovalFocus(container, { itemSelector: 'button' });

    items()[0]!.focus();
    items()[0]!.remove();
    await settled();

    expect(document.activeElement).toBe(container);
    handle.destroy();
  });

  it('takes the fallback the caller names over the container', async () => {
    const { container, items } = mount('<button>only</button>');
    document.body.insertAdjacentHTML('beforeend', '<button id="after">after</button>');
    const after = document.getElementById('after') as HTMLElement;
    const handle = createRemovalFocus(container, {
      itemSelector: 'button',
      fallback: () => after,
    });

    items()[0]!.focus();
    items()[0]!.remove();
    await settled();

    expect(document.activeElement).toBe(after);
    handle.destroy();
  });

  it('reports where it sent focus', async () => {
    const { container, items } = mount(three);
    const onRestore = vi.fn();
    const handle = createRemovalFocus(container, { itemSelector: 'button', onRestore });

    items()[0]!.focus();
    items()[0]!.remove();
    await settled();

    expect(onRestore).toHaveBeenCalledWith(items()[0]);
    handle.destroy();
  });

  /**
   * A person who tabbed out of the collection reports the element they went
   * to; a removal reports nothing. Without that difference, an item removed
   * from a group nobody is looking at would steal the keyboard.
   */
  it('leaves focus alone when the person had already left', async () => {
    const { container, items } = mount(three);
    document.body.insertAdjacentHTML('beforeend', '<button id="outside">outside</button>');
    const outside = document.getElementById('outside') as HTMLElement;
    const handle = createRemovalFocus(container, { itemSelector: 'button' });

    items()[0]!.focus();
    outside.focus();
    items()[0]!.remove();
    await settled();

    expect(document.activeElement).toBe(outside);
    handle.destroy();
  });

  it('moves nothing when focus is still inside after the change', async () => {
    const { container, items } = mount(three);
    const handle = createRemovalFocus(container, { itemSelector: 'button' });

    items()[0]!.focus();
    items()[2]!.remove();
    await settled();

    expect(document.activeElement?.textContent).toBe('1');
    handle.destroy();
  });

  it('stops moving focus after destroy', async () => {
    const { container, items } = mount(three);
    const handle = createRemovalFocus(container, { itemSelector: 'button' });

    items()[1]!.focus();
    handle.destroy();
    items()[1]!.remove();
    await settled();

    expect(document.activeElement).not.toBe(container);
  });
});
