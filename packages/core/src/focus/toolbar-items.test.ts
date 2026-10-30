import { beforeEach, describe, expect, it } from 'vitest';

import { TOOLBAR_ITEM_SELECTOR, toolbarOwnedKeys } from './toolbar-items';

function mount(markup: string) {
  document.body.innerHTML = `<div id="bar">${markup}</div>`;
  const bar = document.getElementById('bar') as HTMLElement;
  return {
    bar,
    items: [...bar.querySelectorAll<HTMLElement>(TOOLBAR_ITEM_SELECTOR)],
  };
}

describe('TOOLBAR_ITEM_SELECTOR', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  /**
   * Radix and Base UI wrap each item in a component of their own. Finding them
   * by what they are is what lets this library's own controls drop into a bar
   * unwrapped, and it reaches a control inside a group without a second axis.
   */
  it('finds every focusable control, including the ones inside a group', () => {
    const { items } = mount(
      `<button>a</button>
       <div data-part="group" data-part-group=""><a href="#x">b</a><input type="checkbox" /></div>
       <span data-part="separator" data-part-separator=""></span>
       <div role="menuitem" tabindex="-1">c</div>`,
    );

    expect(items.map((item) => item.tagName.toLowerCase())).toEqual([
      'button',
      'a',
      'input',
      'div',
    ]);
  });

  it('finds nothing that cannot hold focus', () => {
    const { items } = mount(
      '<span>a</span><div data-part="spacer" data-part-spacer=""></div><a>b</a>',
    );

    expect(items).toEqual([]);
  });
});

describe('toolbarOwnedKeys', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  /**
   * The APG asks an author to "avoid including controls whose operation
   * requires the pair of arrow keys used for toolbar navigation". The container
   * enforces it: a text entry keeps its caret keys and focus leaves it on the
   * cross axis.
   */
  it('leaves the flow axis to a control that moves a caret or a value', () => {
    const { items } = mount(
      `<input type="search" /><textarea></textarea><select></select>
       <div role="slider" tabindex="-1"></div><div role="spinbutton" tabindex="-1"></div>`,
    );

    for (const item of items) {
      expect(toolbarOwnedKeys(item, 'horizontal')).toEqual([
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
      ]);
      expect(toolbarOwnedKeys(item, 'vertical')).toEqual(['ArrowUp', 'ArrowDown', 'Home', 'End']);
    }
  });

  /** A checkbox, a radio and a button are inputs that move no caret. */
  it('keeps nothing for a control the arrows do not operate', () => {
    const { items } = mount(
      '<button>a</button><input type="checkbox" /><input type="radio" /><input type="button" />',
    );

    for (const item of items) expect(toolbarOwnedKeys(item, 'horizontal')).toEqual([]);
  });

  it('lets the consumer state it, and state it away', () => {
    const { items } = mount(
      `<button data-toolbar-keys="inline">a</button>
       <button data-toolbar-keys="block">b</button>
       <input data-toolbar-keys="none" />
       <button data-toolbar-keys="all">c</button>`,
    );

    expect(toolbarOwnedKeys(items[0]!, 'vertical')).toEqual([
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ]);
    expect(toolbarOwnedKeys(items[1]!, 'horizontal')).toEqual([
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ]);
    expect(toolbarOwnedKeys(items[2]!, 'horizontal')).toEqual([]);
    expect(toolbarOwnedKeys(items[3]!, 'horizontal')).toEqual([
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'ArrowUp',
      'ArrowDown',
    ]);
  });

  it('reads a contenteditable as a text entry', () => {
    document.body.innerHTML = '<div id="editor" contenteditable="true" tabindex="0"></div>';
    const editor = document.getElementById('editor') as HTMLElement;
    /* jsdom does not derive isContentEditable from the attribute. */
    Object.defineProperty(editor, 'isContentEditable', { value: true });

    expect(toolbarOwnedKeys(editor, 'horizontal')).toEqual([
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ]);
  });
});
