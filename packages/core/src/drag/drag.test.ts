import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTranslator, dragMessages } from '../i18n';
import { PT_BR } from '../i18n/locales/pt-BR';
import { DRAG_PREVIEW_ATTRIBUTE, createDragController } from './drag';
import * as surface from './index';
import type { DragContainerOptions, DragControllerOptions, DropTarget } from './types';

const t = createTranslator({ locale: 'en-US' }).family(dragMessages);

const between = (container: string, index: number): DropTarget => ({
  kind: 'between',
  container,
  index,
});

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rect(element: Element, box: Box) {
  const value: DOMRect = {
    x: box.x,
    y: box.y,
    left: box.x,
    top: box.y,
    right: box.x + box.width,
    bottom: box.y + box.height,
    width: box.width,
    height: box.height,
    toJSON: () => ({}),
  };
  element.getBoundingClientRect = () => value;
}

/**
 * Two lists the way a family renders them: a container element, an element
 * per key, and a model — an array — that the drop handler edits. The rows are
 * 30 pixels tall from y = 100 (`todo`) and y = 300 (`done`).
 */
function scene(overrides: Partial<DragControllerOptions> = {}) {
  document.body.innerHTML = `
    <ul id="todo"><li id="todo-a" tabindex="0">a</li><li id="todo-b" tabindex="0">b</li><li id="todo-c" tabindex="0">c</li></ul>
    <ul id="done"><li id="done-x" tabindex="0">x</li></ul>
    <ul id="empty"></ul>`;
  const model = { todo: ['a', 'b', 'c'], done: ['x'], empty: [] as string[] };
  const announced: string[] = [];
  const drops: unknown[] = [];
  const ends: unknown[] = [];

  const drag = createDragController({
    t,
    announce: (message) => announced.push(message),
    onDrop: (event) => drops.push(event),
    onDragEnd: (event) => ends.push(event),
    ...overrides,
  });

  const list = (key: 'todo' | 'done' | 'empty', extra: Partial<DragContainerOptions> = {}) =>
    drag.registerContainer({
      key,
      items: () => model[key],
      element: () => document.getElementById(key),
      itemElement: (item) => document.getElementById(`${key}-${item}`),
      label: () => key,
      ...extra,
    });

  const layout = (key: 'todo' | 'done' | 'empty', top: number) => {
    const container = document.getElementById(key)!;
    rect(container, { x: 0, y: top, width: 200, height: Math.max(30, model[key].length * 30) });
    model[key].forEach((item, index) => {
      rect(document.getElementById(`${key}-${item}`)!, {
        x: 0,
        y: top + index * 30,
        width: 200,
        height: 30,
      });
    });
  };
  layout('todo', 100);
  layout('done', 300);
  layout('empty', 500);

  return { drag, model, announced, drops, ends, list, layout };
}

describe('the keyboard session', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('starts on the gap the item came out of, and says so', () => {
    const { drag, announced, list } = scene();
    list('todo');

    const started = drag.pickUp({
      items: ['b'],
      source: { container: 'todo', index: 1 },
      reason: 'keyboard',
    });

    expect(started).toBe(true);
    expect(drag.state.status).toBe('dragging');
    expect(drag.state.reason).toBe('keyboard');
    expect(drag.state.target).toEqual(between('todo', 1));
    expect(drag.state.valid).toBe(true);
    expect(drag.state.operation).toBe('move');
    expect(announced).toEqual(['b picked up, position 2 of 3 in todo.']);
  });

  it('moves one position, stops at the end, and repeats the position there', () => {
    const { drag, announced, list } = scene();
    list('todo');
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 }, reason: 'keyboard' });
    announced.length = 0;

    expect(drag.move('next')).toBe(true);
    expect(drag.state.target).toEqual(between('todo', 3));
    expect(announced).toEqual(['b, position 3 of 3 in todo.']);

    expect(drag.move('next')).toBe(false);
    expect(announced).toEqual(['b, position 3 of 3 in todo.', 'b, position 3 of 3 in todo.']);

    expect(drag.move('first')).toBe(true);
    expect(drag.state.target).toEqual(between('todo', 0));
  });

  it('drops with the one event both inputs produce', () => {
    const { drag, drops, ends, list, announced } = scene();
    list('todo');
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 }, reason: 'keyboard' });
    drag.move('next');
    announced.length = 0;

    expect(drag.drop()).toBe(true);

    expect(drops).toEqual([
      {
        items: ['b'],
        source: { container: 'todo', index: 1 },
        target: between('todo', 3),
        operation: 'move',
        reason: 'keyboard',
        event: undefined,
      },
    ]);
    expect(ends).toHaveLength(1);
    expect(ends[0]).toMatchObject({ dropped: true, reason: 'keyboard' });
    expect(drag.state.status).toBe('idle');
    expect(announced).toEqual(['b dropped, position 3 of 3 in todo.']);
  });

  /** A request for the value the consumer already holds is not emitted. */
  it('treats a drop on the identity position as a cancel', () => {
    const { drag, drops, ends, list, announced } = scene();
    list('todo');
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 }, reason: 'keyboard' });
    announced.length = 0;

    expect(drag.drop()).toBe(false);

    expect(drops).toEqual([]);
    expect(ends[0]).toMatchObject({ dropped: false });
    expect(announced).toEqual(['Drag canceled. b returned.']);
  });

  it('crosses to the other container and back, cycling', () => {
    const { drag, list, announced } = scene();
    list('todo');
    list('done');
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 }, reason: 'keyboard' });
    announced.length = 0;

    expect(drag.move('nextContainer')).toBe(true);
    expect(drag.state.target).toEqual(between('done', 0));
    expect(announced).toEqual(['b, position 1 of 2 in done.']);

    expect(drag.move('next')).toBe(true);
    expect(drag.state.target).toEqual(between('done', 1));

    expect(drag.move('nextContainer')).toBe(true);
    expect(drag.state.target).toEqual(between('todo', 0));
  });

  it('never lands on a position the container refuses', () => {
    const { drag, list, announced } = scene();
    list('todo');
    list('done', { accepts: () => false });
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 }, reason: 'keyboard' });
    announced.length = 0;

    expect(drag.move('nextContainer')).toBe(false);
    expect(drag.state.target).toEqual(between('todo', 1));
    expect(announced).toEqual(['No place to drop.']);
  });

  it('reaches the root of an empty container', () => {
    const { drag, drops, list } = scene();
    list('todo');
    list('empty');
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 }, reason: 'keyboard' });

    drag.move('nextContainer');
    expect(drag.state.target).toEqual({ kind: 'root', container: 'empty' });
    drag.drop();
    expect(drops[0]).toMatchObject({ target: { kind: 'root', container: 'empty' } });
  });

  it('lands on an item when the container takes drops on items, and dwells there', () => {
    const onDwell = vi.fn();
    const { drag, list, announced } = scene({ onDwell });
    list('todo', { targets: ['between', 'on'], itemLabel: (key) => `folder ${key}` });
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 }, reason: 'keyboard' });
    announced.length = 0;

    drag.move('previous');
    expect(drag.state.target).toEqual({ kind: 'on', container: 'todo', key: 'a' });
    expect(announced).toEqual(['folder b, on folder a.']);
    expect(onDwell).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);
    expect(onDwell).toHaveBeenCalledTimes(1);

    drag.move('next');
    expect(drag.state.target).toEqual(between('todo', 1));
    vi.advanceTimersByTime(600);
    expect(onDwell).toHaveBeenCalledTimes(1);
  });

  it('counts several items as one drag', () => {
    const { drag, announced, list } = scene();
    list('todo');
    list('done');
    drag.pickUp({ items: ['a', 'b'], source: { container: 'todo', index: 0 }, reason: 'keyboard' });
    expect(announced).toEqual(['2 items picked up, position 1 of 3 in todo.']);
    drag.move('nextContainer');
    expect(announced[1]).toBe('2 items, position 1 of 3 in done.');
  });

  it('speaks the language of the translator it is given', () => {
    const pt = createTranslator({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }).family(
      dragMessages,
    );
    const { drag, announced, list } = scene({ t: pt });
    list('todo');
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 }, reason: 'keyboard' });
    drag.cancel();
    expect(announced).toEqual([
      // language: pt-BR
      'Você pegou b, posição 2 de 3 em todo.',
      'Arraste de b cancelado; tudo ficou onde estava.',
      // language: en-US
    ]);
  });

  it('says the sentence without a place when the target names none', () => {
    const { drag, announced, model } = scene();
    /* The same list, registered again without a name of its own. */
    drag.registerContainer({
      key: 'todo',
      items: () => model.todo,
      element: () => document.getElementById('todo'),
      itemElement: (item) => document.getElementById(`todo-${item}`),
    });
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 }, reason: 'keyboard' });
    drag.move('next');
    expect(announced).toEqual(['b picked up, position 2 of 3.', 'b, position 3 of 3.']);
  });

  it('leaves unsaid what the family says itself, and says nothing without words', () => {
    const quiet = scene({ silent: ['pickedUp', 'moved'] });
    quiet.list('todo');
    quiet.drag.pickUp({
      items: ['b'],
      source: { container: 'todo', index: 1 },
      reason: 'keyboard',
    });
    quiet.drag.move('next');
    quiet.drag.drop();
    expect(quiet.announced).toEqual(['b dropped, position 3 of 3 in todo.']);

    const mute = scene({ t: undefined });
    mute.list('todo');
    mute.drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 }, reason: 'keyboard' });
    mute.drag.cancel();
    expect(mute.announced).toEqual([]);
  });

  it('lets the consumer refuse the start', () => {
    const { drag, list } = scene({ onDragStart: (request) => request.cancel() });
    list('todo');
    expect(drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 } })).toBe(false);
    expect(drag.state.status).toBe('idle');
  });

  it('refuses a second session, a disabled container and an unknown one', () => {
    const { drag, list } = scene();
    list('todo');
    list('done', { disabled: () => true });
    expect(drag.pickUp({ items: ['x'], source: { container: 'done', index: 0 } })).toBe(false);
    expect(drag.pickUp({ items: ['x'], source: { container: 'nope', index: 0 } })).toBe(false);
    expect(drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 } })).toBe(true);
    expect(drag.pickUp({ items: ['a'], source: { container: 'todo', index: 0 } })).toBe(false);
  });

  it('cancels when the source loses the item mid-drag', () => {
    const { drag, model, ends, list } = scene();
    list('todo');
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 } });
    model.todo = ['a', 'c'];
    expect(drag.move('next')).toBe(false);
    expect(ends[0]).toMatchObject({ dropped: false });
  });

  it('reports every change to a subscriber, and stops on unsubscribe', () => {
    const { drag, list } = scene();
    list('todo');
    const seen: string[] = [];
    const stop = drag.subscribe((state) => seen.push(state.status));
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 } });
    stop();
    drag.cancel();
    expect(seen).toEqual(['dragging', 'dragging']);
    expect(drag.state.status).toBe('idle');
  });

  it('returns focus to the item at its new place after a drop, and to the source after a cancel', () => {
    const { drag, model, list } = scene();
    list('todo');
    document.getElementById('todo-b')!.focus();
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 }, reason: 'keyboard' });
    drag.move('next');
    drag.drop();
    /* The family re-rendered: b is now last, and its element is a new one. */
    model.todo = ['a', 'c', 'b'];
    document.getElementById('todo-b')!.remove();
    const moved = document.createElement('li');
    moved.id = 'todo-b';
    moved.tabIndex = 0;
    document.getElementById('todo')!.append(moved);
    vi.advanceTimersToNextFrame();
    expect(document.activeElement).toBe(moved);

    drag.pickUp({ items: ['a'], source: { container: 'todo', index: 0 }, reason: 'keyboard' });
    drag.cancel();
    vi.advanceTimersToNextFrame();
    expect(document.activeElement).toBe(document.getElementById('todo-a'));
  });

  it('leaves focus alone when told to', () => {
    const { drag, list } = scene({ restoreFocus: false });
    list('todo');
    document.body.focus();
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 } });
    drag.cancel();
    vi.advanceTimersToNextFrame();
    expect(document.activeElement).toBe(document.body);
  });
});

describe('handleKeydown', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const press = (key: string, init: KeyboardEventInit = {}) =>
    new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true, ...init });

  it('is not interested while idle', () => {
    const { drag, list } = scene();
    list('todo');
    expect(drag.handleKeydown(press('ArrowDown'))).toBe(false);
  });

  it('moves, drops and cancels, and takes the events it uses', () => {
    const { drag, drops, list } = scene();
    list('todo');
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 }, reason: 'keyboard' });

    const down = press('ArrowDown');
    expect(drag.handleKeydown(down)).toBe(true);
    expect(down.defaultPrevented).toBe(true);
    expect(drag.state.target).toEqual(between('todo', 3));

    expect(drag.handleKeydown(press('a'))).toBe(false);

    const enter = press('Enter');
    expect(drag.handleKeydown(enter)).toBe(true);
    expect(drops).toHaveLength(1);
    expect(drag.state.status).toBe('idle');
  });

  it('reads the direction of the container for a horizontal row', () => {
    const { drag, list } = scene();
    document.getElementById('todo')!.style.direction = 'rtl';
    list('todo', { orientation: 'horizontal' });
    drag.pickUp({ items: ['a'], source: { container: 'todo', index: 0 }, reason: 'keyboard' });
    drag.handleKeydown(press('ArrowLeft'));
    expect(drag.state.target).toEqual(between('todo', 2));
  });

  it('copies on a drop with the platform modifier when copy is allowed', () => {
    const { drag, drops, list } = scene();
    list('todo');
    drag.pickUp({
      items: ['b'],
      source: { container: 'todo', index: 1 },
      reason: 'keyboard',
      allowedOperations: ['move', 'copy'],
    });
    drag.move('next');
    drag.handleKeydown(press('Enter', { ctrlKey: true }));
    expect(drops[0]).toMatchObject({ operation: 'copy' });
  });

  /**
   * The window's capture listener runs before the document's, which is where
   * `dismissable-layer` listens: a drag inside a dialog cancels the drag and
   * the dialog stays.
   */
  it('takes Escape on the window before anything on the document sees it', () => {
    const { drag, ends, list } = scene();
    list('todo');
    const onDocument = vi.fn();
    document.addEventListener('keydown', onDocument, true);
    drag.pickUp({ items: ['b'], source: { container: 'todo', index: 1 }, reason: 'keyboard' });

    document.getElementById('todo-b')!.dispatchEvent(press('Escape'));

    expect(ends[0]).toMatchObject({ dropped: false });
    expect(onDocument).not.toHaveBeenCalled();
    document.removeEventListener('keydown', onDocument, true);

    document.getElementById('todo-b')!.dispatchEvent(press('Escape'));
    expect(ends).toHaveLength(1);
  });
});

describe('moveBy', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is pick up, one move and a drop, said once', () => {
    const { drag, drops, ends, announced, list } = scene();
    list('todo');

    const moved = drag.moveBy({
      items: ['b'],
      source: { container: 'todo', index: 1 },
      intent: 'next',
      reason: 'keyboard',
    });

    expect(moved).toBe(true);
    expect(drops[0]).toMatchObject({ target: between('todo', 3), reason: 'keyboard' });
    expect(ends[0]).toMatchObject({ dropped: true });
    expect(announced).toEqual(['b, position 3 of 3 in todo.']);
    expect(drag.state.status).toBe('idle');
  });

  it('is a no-op at the end, and says the position', () => {
    const { drag, drops, announced, list } = scene();
    list('todo');
    const moved = drag.moveBy({
      items: ['c'],
      source: { container: 'todo', index: 2 },
      intent: 'next',
    });
    expect(moved).toBe(false);
    expect(drops).toEqual([]);
    expect(announced).toEqual(['c, position 3 of 3 in todo.']);
    expect(drag.state.status).toBe('idle');
  });
});

describe('the pointer', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const pointer = (type: string, init: PointerEventInit) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'mouse',
      ...init,
    });

  function down(element: Element, x: number, y: number, init: PointerEventInit = {}) {
    element.dispatchEvent(pointer('pointerdown', { clientX: x, clientY: y, button: 0, ...init }));
  }
  function moveTo(x: number, y: number, init: PointerEventInit = {}) {
    document.dispatchEvent(pointer('pointermove', { clientX: x, clientY: y, ...init }));
  }
  function up(x: number, y: number, init: PointerEventInit = {}) {
    document.dispatchEvent(pointer('pointerup', { clientX: x, clientY: y, ...init }));
  }

  it('is not a drag until the pointer has travelled', () => {
    const { drag, list } = scene();
    list('todo');
    drag.attachDraggable(document.getElementById('todo-b')!, { container: 'todo', key: 'b' });

    down(document.getElementById('todo-b')!, 10, 135);
    moveTo(12, 137);
    expect(drag.state.status).toBe('idle');

    moveTo(10, 145);
    expect(drag.state.status).toBe('dragging');
    expect(drag.state.reason).toBe('pointer');
    expect(drag.state.point).toEqual({ x: 10, y: 145 });
  });

  it('resolves the point to the position under it and drops there with the pointer reason', () => {
    const { drag, drops, announced, list } = scene();
    list('todo');
    list('done');
    drag.attachDraggable(document.getElementById('todo-b')!, { container: 'todo', key: 'b' });

    down(document.getElementById('todo-b')!, 10, 135);
    moveTo(10, 150);
    expect(drag.state.target).toEqual(between('todo', 1));

    moveTo(10, 320);
    expect(drag.state.target).toEqual(between('done', 1));
    moveTo(10, 250);
    expect(drag.state.target).toBeNull();
    expect(drag.state.valid).toBe(false);

    up(10, 305);
    expect(drops[0]).toMatchObject({
      target: between('done', 0),
      reason: 'pointer',
      operation: 'move',
    });
    /* A pointer session says the pick-up and the drop, not every move. */
    expect(announced).toEqual([
      'b picked up, position 2 of 3 in todo.',
      'b dropped, position 1 of 2 in done.',
    ]);
  });

  it('shows a clone of the source under the pointer, and removes it at the end', () => {
    const { drag, list } = scene();
    list('todo');
    drag.attachDraggable(document.getElementById('todo-b')!, { container: 'todo', key: 'b' });

    down(document.getElementById('todo-b')!, 10, 135);
    moveTo(10, 150);
    const preview = document.querySelector(`[${DRAG_PREVIEW_ATTRIBUTE}]`) as HTMLElement;
    expect(preview).not.toBeNull();
    expect(preview.id).toBe('');
    expect(preview.getAttribute('aria-hidden')).toBe('true');
    expect(preview.style.position).toBe('fixed');
    expect(preview.style.pointerEvents).toBe('none');
    expect(preview.style.width).toBe('200px');
    /* The finger was 5 pixels into the row, and stays there. */
    expect(preview.style.translate).toBe('0px 145px');
    expect(preview.getAttribute('data-operation')).toBe('move');

    up(10, 150);
    expect(document.querySelector(`[${DRAG_PREVIEW_ATTRIBUTE}]`)).toBeNull();
  });

  it('marks the preview over a container that refuses', () => {
    const { drag, list } = scene();
    list('todo');
    list('done', { accepts: () => false });
    drag.attachDraggable(document.getElementById('todo-b')!, { container: 'todo', key: 'b' });
    down(document.getElementById('todo-b')!, 10, 135);
    moveTo(10, 310);
    expect(drag.state.target).toEqual(between('done', 0));
    expect(drag.state.valid).toBe(false);
    const preview = document.querySelector(`[${DRAG_PREVIEW_ATTRIBUTE}]`)!;
    expect(preview.hasAttribute('data-drop-invalid')).toBe(true);
  });

  it('only starts from the handle, and never from a secondary button', () => {
    const { drag, list } = scene();
    list('todo');
    const item = document.getElementById('todo-b')!;
    item.innerHTML = '<span id="grip">::</span> b';
    drag.attachDraggable(item, {
      container: 'todo',
      key: 'b',
      handle: () => document.getElementById('grip'),
    });

    down(item, 10, 135);
    moveTo(10, 160);
    expect(drag.state.status).toBe('idle');

    down(document.getElementById('grip')!, 10, 135, { button: 2 });
    moveTo(10, 160);
    expect(drag.state.status).toBe('idle');

    down(document.getElementById('grip')!, 10, 135);
    moveTo(10, 160);
    expect(drag.state.status).toBe('dragging');
  });

  it('leaves a press on a control inside the row to the control', () => {
    const { drag, list } = scene();
    list('todo');
    const item = document.getElementById('todo-b')!;
    item.innerHTML = '<span data-label>b</span><button id="more">more</button>';
    drag.attachDraggable(item, { container: 'todo', key: 'b' });

    down(document.getElementById('more')!, 10, 135);
    moveTo(10, 160);
    expect(drag.state.status).toBe('idle');

    down(item.querySelector('[data-label]')!, 10, 135);
    moveTo(10, 160);
    expect(drag.state.status).toBe('dragging');
  });

  it('leaves a press the family refuses to whatever the press was for', () => {
    const { drag, list } = scene();
    list('todo');
    const item = document.getElementById('todo-b')!;
    item.innerHTML =
      '<span data-label>b</span><span data-part="resizer" data-part-resizer=""></span>';
    drag.attachDraggable(item, {
      container: 'todo',
      key: 'b',
      canDrag: (event) =>
        !(event.target instanceof Element && event.target.closest('[data-part="resizer"]')),
    });

    down(item.querySelector('[data-part="resizer"]')!, 10, 135);
    moveTo(10, 160);
    expect(drag.state.status).toBe('idle');

    down(item.querySelector('[data-label]')!, 10, 135);
    moveTo(10, 160);
    expect(drag.state.status).toBe('dragging');
  });

  it('lets a family replace the hit test and keep everything else', () => {
    const resolveTarget = vi.fn(() => between('done', 0));
    const { drag, drops, list } = scene({ resolveTarget });
    list('todo');
    list('done');
    drag.attachDraggable(document.getElementById('todo-b')!, { container: 'todo', key: 'b' });
    down(document.getElementById('todo-b')!, 10, 135);
    moveTo(10, 160);
    expect(resolveTarget).toHaveBeenCalledWith(
      { x: 10, y: 160 },
      expect.arrayContaining([
        expect.objectContaining({ key: 'todo' }),
        expect.objectContaining({ key: 'done' }),
      ]),
    );
    expect(drag.state.target).toEqual(between('done', 0));
    up(10, 160);
    expect(drops[0]).toMatchObject({ target: between('done', 0) });
  });

  it('waits for a touch to hold, and lets a swipe scroll', () => {
    const { drag, list } = scene();
    list('todo');
    drag.attachDraggable(document.getElementById('todo-b')!, { container: 'todo', key: 'b' });
    const item = document.getElementById('todo-b')!;

    down(item, 10, 135, { pointerType: 'touch' });
    moveTo(10, 160, { pointerType: 'touch' });
    vi.advanceTimersByTime(250);
    expect(drag.state.status).toBe('idle');

    down(item, 10, 135, { pointerType: 'touch' });
    vi.advanceTimersByTime(250);
    expect(drag.state.status).toBe('dragging');

    const scroll = new Event('touchmove', { cancelable: true, bubbles: true });
    document.body.dispatchEvent(scroll);
    expect(scroll.defaultPrevented).toBe(true);
  });

  it('cancels on pointercancel and when the page is hidden', () => {
    const { drag, ends, list } = scene();
    list('todo');
    drag.attachDraggable(document.getElementById('todo-b')!, { container: 'todo', key: 'b' });

    down(document.getElementById('todo-b')!, 10, 135);
    moveTo(10, 160);
    document.dispatchEvent(pointer('pointercancel', {}));
    expect(ends[0]).toMatchObject({ dropped: false, reason: 'pointer' });

    down(document.getElementById('todo-b')!, 10, 135);
    moveTo(10, 160);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(ends).toHaveLength(2);
  });

  it('ignores a second pointer while one drags', () => {
    const { drag, list } = scene();
    list('todo');
    drag.attachDraggable(document.getElementById('todo-b')!, { container: 'todo', key: 'b' });
    drag.attachDraggable(document.getElementById('todo-a')!, { container: 'todo', key: 'a' });
    down(document.getElementById('todo-b')!, 10, 135);
    moveTo(10, 185);
    expect(drag.state.target).toEqual(between('todo', 3));
    down(document.getElementById('todo-a')!, 10, 105, { pointerId: 2 });
    moveTo(10, 130, { pointerId: 2 });
    expect(drag.state.items).toEqual(['b']);
    moveTo(10, 320, { pointerId: 2 });
    expect(drag.state.target).toEqual(between('todo', 3));
  });

  it('scrolls a container the pointer is at the edge of, on each frame', () => {
    const { drag, list } = scene({ autoScroll: { threshold: 40, speed: 12 } });
    list('todo');
    const container = document.getElementById('todo')!;
    container.style.overflowY = 'auto';
    Object.defineProperty(container, 'scrollHeight', { value: 900, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 90, configurable: true });
    document.elementFromPoint = () => document.getElementById('todo-c');
    drag.attachDraggable(document.getElementById('todo-b')!, { container: 'todo', key: 'b' });

    down(document.getElementById('todo-b')!, 10, 135);
    moveTo(10, 185);
    vi.advanceTimersToNextFrame();
    expect(container.scrollTop).toBe(11);
    vi.advanceTimersToNextFrame();
    expect(container.scrollTop).toBe(22);

    moveTo(10, 140);
    vi.advanceTimersToNextFrame();
    expect(container.scrollTop).toBe(22);
  });

  it('scrolls only the axis it was given', () => {
    const { drag, list } = scene({ autoScroll: { threshold: 40, speed: 12, axis: 'x' } });
    list('todo');
    const container = document.getElementById('todo')!;
    container.style.overflowY = 'auto';
    container.style.overflowX = 'auto';
    Object.defineProperty(container, 'scrollHeight', { value: 900, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 90, configurable: true });
    Object.defineProperty(container, 'scrollWidth', { value: 900, configurable: true });
    Object.defineProperty(container, 'clientWidth', { value: 200, configurable: true });
    document.elementFromPoint = () => document.getElementById('todo-c');
    drag.attachDraggable(document.getElementById('todo-b')!, { container: 'todo', key: 'b' });

    /* At the bottom-right corner: both edges are near, one axis moves. */
    down(document.getElementById('todo-b')!, 10, 135);
    moveTo(195, 185);
    vi.advanceTimersToNextFrame();
    expect(container.scrollTop).toBe(0);
    expect(container.scrollLeft).toBeGreaterThan(0);
  });

  it('detaches, and destroy detaches everything', () => {
    const { drag, list } = scene();
    list('todo');
    const item = document.getElementById('todo-b')!;
    const detach = drag.attachDraggable(item, { container: 'todo', key: 'b' });
    detach();
    down(item, 10, 135);
    moveTo(10, 160);
    expect(drag.state.status).toBe('idle');

    drag.attachDraggable(item, { container: 'todo', key: 'b' });
    down(item, 10, 135);
    moveTo(10, 160);
    expect(drag.state.status).toBe('dragging');
    drag.destroy();
    expect(drag.state.status).toBe('idle');
    down(item, 10, 135);
    moveTo(10, 160);
    expect(drag.state.status).toBe('idle');
  });
});

describe('the public surface', () => {
  it('exports the controller and the pure pieces', () => {
    expect(typeof surface.createDragController).toBe('function');
    expect(typeof surface.resolvePoint).toBe('function');
    expect(typeof surface.containerPositions).toBe('function');
    expect(typeof surface.intentForKey).toBe('function');
    expect(surface.DRAG_KEYS.drop).toEqual(['Space', 'Enter']);
  });
});
