import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFocusScope, tabbables } from './focus-scope';

function mount(page: string, layer: string) {
  document.body.innerHTML = `<div id="page">${page}</div><div id="layer">${layer}</div>`;
  return {
    page: document.getElementById('page') as HTMLElement,
    layer: document.getElementById('layer') as HTMLElement,
  };
}

function tab(node: HTMLElement, shift = false) {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey: shift,
    bubbles: true,
    cancelable: true,
  });
  (document.activeElement ?? node).dispatchEvent(event);
  return event;
}

const three = '<button>a</button><button>b</button><button>c</button>';

describe('tabbables', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('finds the controls a Tab can reach, in document order', () => {
    const { layer } = mount('', '<button>a</button><a href="#x">b</a><input><textarea></textarea>');
    expect(tabbables(layer).map((node) => node.tagName)).toEqual([
      'BUTTON',
      'A',
      'INPUT',
      'TEXTAREA',
    ]);
  });

  it('skips a control the platform has taken out of the sequence', () => {
    const { layer } = mount(
      '',
      `<button>a</button>
       <button disabled>b</button>
       <button tabindex="-1">c</button>
       <a>d</a>
       <input hidden>
       <div inert><button>e</button></div>`,
    );
    expect(tabbables(layer).map((node) => node.textContent)).toEqual(['a']);
  });

  /**
   * `display: none` is the one a dialog meets on every render: a panel that is
   * mounted and closed still holds its controls, and none of them is reachable.
   */
  it('skips a control inside a branch the stylesheet has hidden', () => {
    const { layer } = mount(
      '',
      '<div style="display: none"><button>a</button></div><button>b</button>',
    );
    expect(tabbables(layer).map((node) => node.textContent)).toEqual(['b']);
  });

  it('counts an element the consumer made focusable', () => {
    const { layer } = mount('', '<div tabindex="0">a</div><div tabindex="-1">b</div>');
    expect(tabbables(layer).map((node) => node.textContent)).toEqual(['a']);
  });
});

describe('createFocusScope', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('moves focus to the first tabbable when it is entered', () => {
    const { layer } = mount('<button id="trigger">open</button>', three);
    const scope = createFocusScope(layer);

    scope.enter();

    expect(document.activeElement?.textContent).toBe('a');
    scope.destroy();
  });

  it('moves focus to the container when asked, so a long panel is read from its top', () => {
    const { layer } = mount('', three);
    layer.tabIndex = -1;
    const scope = createFocusScope(layer, { initial: 'container' });

    scope.enter();

    expect(document.activeElement).toBe(layer);
    scope.destroy();
  });

  it('moves focus to the element the caller names, which is the least destructive action', () => {
    const { layer } = mount('', three);
    const cancel = layer.querySelectorAll('button')[1] as HTMLElement;
    const scope = createFocusScope(layer, { initial: () => cancel });

    scope.enter();

    expect(document.activeElement).toBe(cancel);
    scope.destroy();
  });

  it('moves nothing when the caller says not to', () => {
    const { layer } = mount('<button id="trigger">open</button>', three);
    const trigger = document.getElementById('trigger') as HTMLElement;
    trigger.focus();

    const scope = createFocusScope(layer, { initial: false });
    scope.enter();

    expect(document.activeElement).toBe(trigger);
    scope.destroy();
  });

  it('falls back to the container when the layer holds no control at all', () => {
    const { layer } = mount('', '<p>nothing to focus</p>');
    const scope = createFocusScope(layer);

    scope.enter();

    expect(document.activeElement).toBe(layer);
    expect(layer.getAttribute('tabindex')).toBe('-1');
    scope.destroy();
  });

  it('gives back a tabindex it wrote and leaves one the consumer wrote', () => {
    const { layer } = mount('', '<p>nothing</p>');
    const borrowed = createFocusScope(layer);
    borrowed.enter();
    expect(layer.hasAttribute('tabindex')).toBe(true);
    borrowed.destroy();
    expect(layer.hasAttribute('tabindex')).toBe(false);

    layer.setAttribute('tabindex', '0');
    const kept = createFocusScope(layer);
    kept.enter();
    kept.destroy();
    expect(layer.getAttribute('tabindex')).toBe('0');
  });

  /**
   * A layer taken out of the document without being destroyed — a framework
   * unmounting the subtree before the family's own teardown runs — has nothing
   * to hold focus in, and a scope that kept pulling would take the page's focus
   * to a node that is not on the page.
   */
  it('stops containing once its layer has left the document', () => {
    const { page, layer } = mount('<button id="outside">page</button>', three);
    const scope = createFocusScope(layer);
    scope.enter();
    layer.remove();

    const outside = page.querySelector('button') as HTMLElement;
    outside.focus();

    expect(document.activeElement).toBe(outside);
    scope.destroy();
  });

  it('wraps Tab from the last control to the first', () => {
    const { layer } = mount('', three);
    const scope = createFocusScope(layer);
    const items = [...layer.querySelectorAll('button')];

    items[2]!.focus();
    const event = tab(layer);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(items[0]);
    scope.destroy();
  });

  it('wraps Shift+Tab from the first control to the last', () => {
    const { layer } = mount('', three);
    const scope = createFocusScope(layer);
    const items = [...layer.querySelectorAll('button')];

    items[0]!.focus();
    const event = tab(layer, true);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(items[2]);
    scope.destroy();
  });

  it('leaves a Tab between two controls to the browser', () => {
    const { layer } = mount('', three);
    const scope = createFocusScope(layer);
    const items = [...layer.querySelectorAll('button')];

    items[0]!.focus();
    const event = tab(layer);

    expect(event.defaultPrevented).toBe(false);
    scope.destroy();
  });

  it('holds a single control by refusing the Tab that would leave it', () => {
    const { layer } = mount('<button id="trigger">open</button>', '<button>only</button>');
    const scope = createFocusScope(layer);
    const only = layer.querySelector('button') as HTMLElement;

    only.focus();
    tab(layer);

    expect(document.activeElement).toBe(only);
    scope.destroy();
  });

  it('pulls focus back when something outside the layer takes it', () => {
    const { page, layer } = mount('<button id="outside">page</button>', three);
    const scope = createFocusScope(layer);
    scope.enter();

    (page.querySelector('button') as HTMLElement).focus();

    expect(layer.contains(document.activeElement)).toBe(true);
    scope.destroy();
  });

  /**
   * A layer opened over this one — a tour over a dialog, a popover from a
   * control inside it — is portalled after it and did not exist when this
   * scope was made. Focus going there is the reader moving up the stack, and
   * pulling it back would make the upper layer unreachable.
   */
  it('lets focus go to a layer opened over it, and still pulls it back from the page', () => {
    const { page, layer } = mount('<button id="outside">page</button>', three);
    const scope = createFocusScope(layer);
    scope.enter();

    const above = document.createElement('div');
    above.innerHTML = '<button id="above">next step</button>';
    document.body.append(above);
    const card = above.querySelector('button') as HTMLElement;
    card.focus();
    expect(document.activeElement).toBe(card);

    (page.querySelector('button') as HTMLElement).focus();
    expect(layer.contains(document.activeElement)).toBe(true);

    above.remove();
    scope.destroy();
  });

  /**
   * The same move made by a layer that was there first: a tour whose step
   * opened this dialog is raised back over it, which moves it after the
   * dialog in the document — before or after this scope was made. The page
   * the modal layer made inert is out of focus's reach either way.
   */
  it('lets focus go to a layer raised over it, whenever it was raised', () => {
    document.body.innerHTML =
      '<div id="page"><button>page</button></div><div id="tour"><button>next</button></div><div id="layer"><button>a</button></div>';
    const tour = document.getElementById('tour') as HTMLElement;
    const layer = document.getElementById('layer') as HTMLElement;
    document.body.append(tour);
    const scope = createFocusScope(layer);
    scope.enter();

    (tour.querySelector('button') as HTMLElement).focus();
    expect(tour.contains(document.activeElement)).toBe(true);

    (document.querySelector('#page button') as HTMLElement).focus();
    expect(layer.contains(document.activeElement)).toBe(true);
    scope.destroy();
  });

  it('lets focus leave when it is not containing', () => {
    const { page, layer } = mount('<button id="outside">page</button>', three);
    const scope = createFocusScope(layer, { contain: false });
    scope.enter();

    const outside = page.querySelector('button') as HTMLElement;
    outside.focus();

    expect(document.activeElement).toBe(outside);
    scope.destroy();
  });

  it('returns focus to the element that had it when the scope was made', () => {
    const { layer } = mount('<button id="trigger">open</button>', three);
    const trigger = document.getElementById('trigger') as HTMLElement;
    trigger.focus();

    const scope = createFocusScope(layer);
    scope.enter();
    expect(document.activeElement).not.toBe(trigger);

    scope.destroy();

    expect(document.activeElement).toBe(trigger);
  });

  /**
   * A consumer who focused something else while closing meant it. A scope that
   * overrode them would be the bug with no local explanation.
   */
  it('leaves focus alone when it has already moved somewhere outside', () => {
    const { page, layer } = mount(
      '<button id="trigger">open</button><button id="other">other</button>',
      three,
    );
    const trigger = document.getElementById('trigger') as HTMLElement;
    trigger.focus();

    const scope = createFocusScope(layer, { contain: false });
    scope.enter();
    const other = page.querySelector('#other') as HTMLElement;
    other.focus();
    scope.destroy();

    expect(document.activeElement).toBe(other);
  });

  /**
   * The failure every surveyed library leaves on the floor: a dialog that
   * deletes the row it was opened from has no trigger to return to, focus lands
   * on `body`, and the next Tab starts again at the top of the page.
   */
  it('returns focus to the nearest connected ancestor when the trigger is gone', () => {
    document.body.innerHTML =
      '<div id="row" tabindex="-1"><button id="trigger">delete</button></div><div id="layer">' +
      three +
      '</div>';
    const layer = document.getElementById('layer') as HTMLElement;
    const row = document.getElementById('row') as HTMLElement;
    const trigger = document.getElementById('trigger') as HTMLElement;
    trigger.focus();

    const scope = createFocusScope(layer);
    scope.enter();
    trigger.remove();
    scope.destroy();

    expect(document.activeElement).toBe(row);
  });

  it('returns focus nowhere when the caller says not to', () => {
    const { layer } = mount('<button id="trigger">open</button>', three);
    const trigger = document.getElementById('trigger') as HTMLElement;
    trigger.focus();

    const scope = createFocusScope(layer, { restore: false });
    scope.enter();
    scope.destroy();

    expect(document.activeElement).not.toBe(trigger);
  });

  it('returns focus to the element the caller names', () => {
    const { page, layer } = mount(
      '<button id="trigger">open</button><button id="after">after</button>',
      three,
    );
    (document.getElementById('trigger') as HTMLElement).focus();
    const after = page.querySelector('#after') as HTMLElement;

    const scope = createFocusScope(layer, { restore: () => after });
    scope.enter();
    scope.destroy();

    expect(document.activeElement).toBe(after);
  });

  it('reports the element it will return focus to', () => {
    const { layer } = mount('<button id="trigger">open</button>', three);
    const trigger = document.getElementById('trigger') as HTMLElement;
    trigger.focus();

    const scope = createFocusScope(layer);
    expect(scope.origin).toBe(trigger);
    scope.destroy();
  });

  /**
   * Two layers, and the inner one closing must not take the outer one's
   * containment with it. The listeners are per scope, so the outer scope is
   * still holding after the inner one is destroyed.
   */
  it('leaves an outer scope containing when an inner one is destroyed', () => {
    document.body.innerHTML =
      '<button id="outside">page</button><div id="outer">' +
      three +
      '<div id="inner"><button>x</button></div></div>';
    const outer = document.getElementById('outer') as HTMLElement;
    const inner = document.getElementById('inner') as HTMLElement;

    const outerScope = createFocusScope(outer);
    outerScope.enter();
    const innerScope = createFocusScope(inner);
    innerScope.enter();
    innerScope.destroy();

    (document.getElementById('outside') as HTMLElement).focus();

    expect(outer.contains(document.activeElement)).toBe(true);
    outerScope.destroy();
  });

  it('moves nothing after it has been destroyed', () => {
    const { page, layer } = mount('<button id="outside">page</button>', three);
    const scope = createFocusScope(layer);
    scope.enter();
    scope.destroy();

    const outside = page.querySelector('button') as HTMLElement;
    outside.focus();

    expect(document.activeElement).toBe(outside);
  });

  it('reports where focus was sent, so a caller can announce it', () => {
    const { layer } = mount('', three);
    const onFocus = vi.fn();
    const scope = createFocusScope(layer, { onFocus });

    scope.enter();

    expect(onFocus).toHaveBeenCalledWith(layer.querySelector('button'));
    scope.destroy();
  });
});
