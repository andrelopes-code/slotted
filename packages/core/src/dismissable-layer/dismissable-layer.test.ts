import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DismissRequest } from './dismissable-layer';
import {
  LAYER_DEPTH_PROPERTY,
  createDismissableLayer,
  createScrollLock,
  pressOrigin,
} from './dismissable-layer';

function mount(markup: string) {
  document.body.innerHTML = markup;
}

function element(id: string) {
  return document.getElementById(id) as HTMLElement;
}

function press(target: Element, type: 'pointerdown' | 'click' = 'pointerdown') {
  target.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
}

function escape(init: KeyboardEventInit = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, ...init }));
}

function focusTo(target: Element) {
  target.dispatchEvent(new Event('focusin', { bubbles: true }));
}

/** Records the reason of every dismissal, which is the whole public report. */
function recorder() {
  const reasons: string[] = [];
  const onDismiss = (request: DismissRequest) => reasons.push(request.reason);
  return { reasons, onDismiss };
}

describe('createDismissableLayer', () => {
  beforeEach(() => {
    mount('');
  });

  /**
   * The platform's way back reaches the layer and never the page under it: the
   * layer holds one history entry while it stands, a `popstate` that leaves
   * the entry is the gesture, and a layer closed by any other path takes its
   * entry back. jsdom traverses the history on a task of its own, so each
   * traversal is awaited through the `popstate` it dispatches.
   */
  describe('back', () => {
    const popped = () =>
      new Promise<void>((resolve) =>
        window.addEventListener('popstate', () => resolve(), { once: true }),
      );

    beforeEach(() => {
      mount('<div id="layer"></div>');
      history.replaceState({ navigationId: 7 }, '');
    });

    it('holds one history entry over the state that was there, and asks with back when it is left', async () => {
      const log = recorder();
      const handle = createDismissableLayer(element('layer'), { ...log, back: true });
      expect(history.state).toMatchObject({ navigationId: 7 });
      expect(typeof history.state.__slottedLayer).toBe('string');

      const gesture = popped();
      history.back();
      await gesture;

      expect(log.reasons).toEqual(['back']);
      expect(history.state).toEqual({ navigationId: 7 });
      /* The family closed on the request: the entry is already gone, nothing else moves. */
      const length = history.length;
      handle.destroy();
      expect(history.length).toBe(length);
    });

    it('puts the entry back when the layer refuses', async () => {
      let refused = 0;
      const handle = createDismissableLayer(element('layer'), {
        back: true,
        onDismiss: (request) => {
          refused += 1;
          request.cancel();
        },
      });
      const token = history.state.__slottedLayer as string;

      const gesture = popped();
      history.back();
      await gesture;

      expect(refused).toBe(1);
      expect(history.state.__slottedLayer).toBe(token);
      handle.destroy();
      await popped();
      expect(history.state).toEqual({ navigationId: 7 });
    });

    it('takes its entry back when closed by another path, and reads no gesture in that', async () => {
      const log = recorder();
      const handle = createDismissableLayer(element('layer'), { ...log, back: true });
      handle.destroy();
      await popped();
      expect(history.state).toEqual({ navigationId: 7 });
      expect(log.reasons).toEqual([]);
    });

    it('leaves a navigation made while it stood alone: the entry is not stepped back over a push that kept its state', async () => {
      const log = recorder();
      const handle = createDismissableLayer(element('layer'), { ...log, back: true });
      /* A router pushes its destination over the state it finds, token included. */
      history.pushState({ ...history.state, key: 'b' }, '', '#/b');
      handle.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(location.hash).toBe('#/b');
      expect(log.reasons).toEqual([]);
      history.replaceState(null, '', location.pathname + location.search);
    });

    it('opens after a closed layer’s traversal lands, and reads no gesture in it', async () => {
      const first = recorder();
      const second = recorder();
      const closing = createDismissableLayer(element('layer'), { ...first, back: true });
      const closed = history.state.__slottedLayer as string;
      closing.destroy();
      const next = createDismissableLayer(element('layer'), { ...second, back: true });
      /* No entry of its own while the first one's traversal is on its way. */
      expect(history.state.__slottedLayer).toBe(closed);
      await popped();
      await Promise.resolve();
      expect(history.state.__slottedLayer).toEqual(expect.any(String));
      expect(history.state.__slottedLayer).not.toBe(closed);
      expect(second.reasons).toEqual([]);
      next.destroy();
      await popped();
      expect(history.state).toEqual({ navigationId: 7 });
    });

    it('asks the topmost layer that holds an entry, one gesture at a time', async () => {
      mount('<div id="outer"></div><div id="inner"></div>');
      const outer = recorder();
      const inner = recorder();
      const first = createDismissableLayer(element('outer'), { ...outer, back: true });
      const second = createDismissableLayer(element('inner'), { ...inner, back: true });

      let gesture = popped();
      history.back();
      await gesture;
      expect(inner.reasons).toEqual(['back']);
      expect(outer.reasons).toEqual([]);
      second.destroy();

      gesture = popped();
      history.back();
      await gesture;
      expect(outer.reasons).toEqual(['back']);
      first.destroy();
      expect(history.state).toEqual({ navigationId: 7 });
    });

    it('holds no entry unless asked', () => {
      const log = recorder();
      const length = history.length;
      const handle = createDismissableLayer(element('layer'), log);
      expect(history.length).toBe(length);
      expect(history.state).toEqual({ navigationId: 7 });
      handle.destroy();
    });
  });

  /**
   * Where the platform has `CloseWatcher`, the layer answers the way back with
   * one watcher and leaves the history alone. The stub records each watcher.
   */
  describe('back with a close watcher', () => {
    const watchers: { onclose: ((event: Event) => void) | null; destroyed: boolean }[] = [];

    beforeEach(() => {
      watchers.length = 0;
      mount('<div id="outer"></div><div id="inner"></div>');
      vi.stubGlobal(
        'CloseWatcher',
        class {
          onclose: ((event: Event) => void) | null = null;
          destroyed = false;
          constructor() {
            watchers.push(this);
          }
          destroy() {
            this.destroyed = true;
          }
        },
      );
      return () => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
      };
    });

    it('holds a watcher instead of a history entry, and destroys it on close', async () => {
      const push = vi.spyOn(history, 'pushState');
      const back = vi.spyOn(history, 'back');

      const handle = createDismissableLayer(element('outer'), { ...recorder(), back: true });
      handle.destroy();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(push).not.toHaveBeenCalled();
      expect(watchers).toHaveLength(1);
      expect(watchers[0]!.destroyed).toBe(true);
      expect(back).not.toHaveBeenCalled();
    });

    it('asks with back when the watcher closes', () => {
      const log = recorder();
      const handle = createDismissableLayer(element('outer'), { ...log, back: true });

      watchers[0]!.onclose!(new Event('close'));

      expect(log.reasons).toEqual(['back']);
      handle.destroy();
    });

    it('watches again when the layer refuses', () => {
      const handle = createDismissableLayer(element('outer'), {
        back: true,
        onDismiss: (request) => request.cancel(),
      });

      watchers[0]!.onclose!(new Event('close'));

      expect(watchers).toHaveLength(2);
      handle.destroy();
      expect(watchers[1]!.destroyed).toBe(true);
    });

    it('keeps Escape from the watchers, so one press closes one layer', () => {
      const outer = recorder();
      const inner = recorder();
      const first = createDismissableLayer(element('outer'), { ...outer, back: true });
      const second = createDismissableLayer(element('inner'), inner);
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(inner.reasons).toEqual(['escape']);
      expect(outer.reasons).toEqual([]);
      second.destroy();
      first.destroy();
    });
  });

  describe('escape', () => {
    beforeEach(() => {
      mount('<div id="outer"></div><div id="inner"></div><button id="away">away</button>');
    });

    it('is answered by the topmost layer alone', () => {
      const outer = recorder();
      const inner = recorder();
      const first = createDismissableLayer(element('outer'), outer);
      const second = createDismissableLayer(element('inner'), inner);

      escape();

      expect(inner.reasons).toEqual(['escape']);
      expect(outer.reasons).toEqual([]);
      second.destroy();
      first.destroy();
    });

    it('reaches the layer below once the one above is gone', () => {
      const outer = recorder();
      const first = createDismissableLayer(element('outer'), outer);
      const second = createDismissableLayer(element('inner'), recorder());

      second.destroy();
      escape();

      expect(outer.reasons).toEqual(['escape']);
      first.destroy();
    });

    /** A held key closes one layer, not the whole stack in one press. */
    it('ignores a repeat', () => {
      const layer = recorder();
      const handle = createDismissableLayer(element('outer'), layer);

      escape({ repeat: true });

      expect(layer.reasons).toEqual([]);
      handle.destroy();
    });

    /** Escape ends an IME composition; it is not a request to close anything. */
    it('ignores a key press that is cancelling a composition', () => {
      const layer = recorder();
      const handle = createDismissableLayer(element('outer'), layer);

      escape({ isComposing: true });

      expect(layer.reasons).toEqual([]);
      handle.destroy();
    });

    it('is swallowed by a topmost layer that refuses it', () => {
      const outer = recorder();
      const first = createDismissableLayer(element('outer'), outer);
      const second = createDismissableLayer(element('inner'), { ...recorder(), escape: false });

      escape();

      expect(outer.reasons).toEqual([]);
      second.destroy();
      first.destroy();
    });
  });

  describe('outside press', () => {
    beforeEach(() => {
      mount(`
        <button id="trigger">open</button>
        <div id="parent"><button id="within">inside</button></div>
        <div id="child"></div>
        <main id="page"></main>`);
    });

    it('dismisses on a press outside the layer', () => {
      const layer = recorder();
      const handle = createDismissableLayer(element('parent'), layer);

      press(element('page'));

      expect(layer.reasons).toEqual(['outsidePress']);
      handle.destroy();
    });

    it('leaves the layer alone for a press inside it', () => {
      const layer = recorder();
      const handle = createDismissableLayer(element('parent'), layer);

      press(element('within'));

      expect(layer.reasons).toEqual([]);
      handle.destroy();
    });

    /** The trigger is the first branch: a press on it must not both dismiss and reopen. */
    it('counts a registered branch as inside', () => {
      const layer = recorder();
      const handle = createDismissableLayer(element('parent'), {
        ...layer,
        branches: [element('trigger')],
      });

      press(element('trigger'));

      expect(layer.reasons).toEqual([]);
      handle.destroy();
    });

    it('takes a branch registered after the layer opened', () => {
      const layer = recorder();
      const handle = createDismissableLayer(element('parent'), layer);
      const remove = handle.addBranch(element('trigger'));

      press(element('trigger'));
      expect(layer.reasons).toEqual([]);

      remove();
      press(element('trigger'));
      expect(layer.reasons).toEqual(['outsidePress']);
      handle.destroy();
    });

    /**
     * The rule `docs/component-features.md` §3 states: a submenu is outside its
     * parent menu in the DOM and inside it in the stack.
     */
    it('does not dismiss an ancestor layer for a press inside a descendant', () => {
      const parent = recorder();
      const child = recorder();
      const first = createDismissableLayer(element('parent'), parent);
      const second = createDismissableLayer(element('child'), child);

      press(element('child'));

      expect(parent.reasons).toEqual([]);
      expect(child.reasons).toEqual([]);
      second.destroy();
      first.destroy();
    });

    it('dismisses the descendant alone for a press inside the ancestor', () => {
      const parent = recorder();
      const child = recorder();
      const first = createDismissableLayer(element('parent'), parent);
      const second = createDismissableLayer(element('child'), child);

      press(element('within'));

      expect(child.reasons).toEqual(['outsidePress']);
      expect(parent.reasons).toEqual([]);
      second.destroy();
      first.destroy();
    });

    it('dismisses the whole stack for a press outside all of it', () => {
      const parent = recorder();
      const child = recorder();
      const first = createDismissableLayer(element('parent'), parent);
      const second = createDismissableLayer(element('child'), child);

      press(element('page'));

      expect(child.reasons).toEqual(['outsidePress']);
      expect(parent.reasons).toEqual(['outsidePress']);
      second.destroy();
      first.destroy();
    });

    /**
     * A layer that refuses to close cannot be left standing on an ancestor that
     * closed underneath it.
     */
    it('stops the cascade when a layer cancels its own dismissal', () => {
      const parent = recorder();
      const first = createDismissableLayer(element('parent'), parent);
      const second = createDismissableLayer(element('child'), {
        onDismiss: (request) => request.cancel(),
      });

      press(element('page'));

      expect(parent.reasons).toEqual([]);
      second.destroy();
      first.destroy();
    });

    it('can be turned off for one layer', () => {
      const layer = recorder();
      const handle = createDismissableLayer(element('parent'), {
        ...layer,
        outsidePress: false,
      });

      press(element('page'));

      expect(layer.reasons).toEqual([]);
      handle.destroy();
    });

    it('asks the predicate the consumer wrote which presses count', () => {
      const layer = recorder();
      const handle = createDismissableLayer(element('parent'), {
        ...layer,
        outsidePress: (target) => (target as Element).id !== 'page',
      });

      press(element('page'));
      expect(layer.reasons).toEqual([]);

      press(element('trigger'));
      expect(layer.reasons).toEqual(['outsidePress']);
      handle.destroy();
    });

    /**
     * A press that starts inside and ends outside is a selection dragged past
     * the edge. The family that wants the other answer asks for it.
     */
    it('waits for the click when the layer asked for the click', () => {
      const layer = recorder();
      const handle = createDismissableLayer(element('parent'), {
        ...layer,
        outsidePressEvent: 'click',
      });

      press(element('page'), 'pointerdown');
      expect(layer.reasons).toEqual([]);

      press(element('page'), 'click');
      expect(layer.reasons).toEqual(['outsidePress']);
      handle.destroy();
    });

    /**
     * DG1. A dialog's node is a frame — a scrim and a viewport around the
     * panel — and a press on the scrim landed inside the node, so the scrim
     * was never a way out. The frame still carries the depth and the `inert`
     * boundary; the panel is what a press is inside of.
     */
    describe('a frame around the content', () => {
      beforeEach(() => {
        mount(`
          <div id="frame">
            <div id="scrim"></div>
            <div id="viewport"><div id="panel"><button id="inside">ok</button></div></div>
          </div>
          <main id="page"></main>`);
      });

      it('reads a press on the frame as outside, and a press in the content as inside', () => {
        const layer = recorder();
        const handle = createDismissableLayer(element('frame'), {
          ...layer,
          content: element('panel'),
        });

        press(element('inside'));
        expect(layer.reasons).toEqual([]);

        press(element('scrim'));
        press(element('viewport'));
        expect(layer.reasons).toEqual(['outsidePress', 'outsidePress']);
        expect(element('frame').style.getPropertyValue(LAYER_DEPTH_PROPERTY)).toBe('0');
        handle.destroy();
      });

      /** A selection dragged out of the panel ends over the scrim, and clicks it. */
      it('ignores a click whose press began inside the content', () => {
        const layer = recorder();
        const handle = createDismissableLayer(element('frame'), {
          ...layer,
          content: element('panel'),
          outsidePressEvent: 'click',
        });

        press(element('inside'), 'pointerdown');
        press(element('scrim'), 'click');
        expect(layer.reasons).toEqual([]);

        press(element('scrim'), 'pointerdown');
        press(element('scrim'), 'click');
        expect(layer.reasons).toEqual(['outsidePress']);
        handle.destroy();
      });

      it('forgets where the pointer went down once a key is pressed', () => {
        const layer = recorder();
        const handle = createDismissableLayer(element('frame'), {
          ...layer,
          content: element('panel'),
          outsidePressEvent: 'click',
        });

        press(element('inside'), 'pointerdown');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
        press(element('page'), 'click');
        expect(layer.reasons).toEqual(['outsidePress']);
        handle.destroy();
      });
    });
  });

  describe('focus leaving the layer', () => {
    beforeEach(() => {
      mount('<div id="parent"><button id="within"></button></div><button id="away"></button>');
    });

    it('is not a dismissal unless the layer asked for it', () => {
      const layer = recorder();
      const handle = createDismissableLayer(element('parent'), layer);

      focusTo(element('away'));

      expect(layer.reasons).toEqual([]);
      handle.destroy();
    });

    it('dismisses with the blur reason when it is asked for', () => {
      const layer = recorder();
      const handle = createDismissableLayer(element('parent'), {
        ...layer,
        focusOutside: true,
      });

      focusTo(element('within'));
      expect(layer.reasons).toEqual([]);

      focusTo(element('away'));
      expect(layer.reasons).toEqual(['blur']);
      handle.destroy();
    });
  });

  describe('the stack', () => {
    beforeEach(() => {
      mount('<div id="a"></div><div id="b"></div><div id="c"></div>');
    });

    it('writes each layer its depth, and reindexes when one leaves', () => {
      const first = createDismissableLayer(element('a'), recorder());
      const second = createDismissableLayer(element('b'), recorder());
      const third = createDismissableLayer(element('c'), recorder());

      expect(element('a').style.getPropertyValue(LAYER_DEPTH_PROPERTY)).toBe('0');
      expect(element('c').style.getPropertyValue(LAYER_DEPTH_PROPERTY)).toBe('2');
      expect(third.depth).toBe(2);
      expect(third.topmost).toBe(true);
      expect(first.topmost).toBe(false);

      second.destroy();
      expect(element('c').style.getPropertyValue(LAYER_DEPTH_PROPERTY)).toBe('1');
      expect(third.depth).toBe(1);

      third.destroy();
      first.destroy();
      expect(element('a').style.getPropertyValue(LAYER_DEPTH_PROPERTY)).toBe('');
    });

    it('dismisses on demand, with the programmatic reason', () => {
      const layer = recorder();
      const handle = createDismissableLayer(element('a'), layer);

      handle.dismiss();

      expect(layer.reasons).toEqual(['programmatic']);
      handle.destroy();
    });

    it('answers nothing once it is destroyed', () => {
      const layer = recorder();
      const handle = createDismissableLayer(element('a'), layer);

      handle.destroy();
      escape();
      press(element('b'));

      expect(layer.reasons).toEqual([]);
    });
  });

  describe('a modal layer', () => {
    beforeEach(() => {
      mount('<main id="page"></main><aside id="side"></aside><div id="layer"></div>');
    });

    it('makes every sibling inert, and gives them back', () => {
      const handle = createDismissableLayer(element('layer'), {
        ...recorder(),
        modal: true,
      });

      expect(element('page').hasAttribute('inert')).toBe(true);
      expect(element('side').hasAttribute('inert')).toBe(true);
      expect(element('layer').hasAttribute('inert')).toBe(false);

      handle.destroy();
      expect(element('page').hasAttribute('inert')).toBe(false);
      expect(element('side').hasAttribute('inert')).toBe(false);
    });

    it('leaves an element that was already inert as it found it', () => {
      element('side').setAttribute('inert', '');
      const handle = createDismissableLayer(element('layer'), {
        ...recorder(),
        modal: true,
      });

      handle.destroy();
      expect(element('side').hasAttribute('inert')).toBe(true);
    });

    it('locks the scroll, and unlocks it', () => {
      const handle = createDismissableLayer(element('layer'), {
        ...recorder(),
        modal: true,
      });

      expect(document.body.style.overflow).toBe('hidden');
      handle.destroy();
      expect(document.body.style.overflow).toBe('');
    });

    it('locks nothing when the layer asks it not to', () => {
      const handle = createDismissableLayer(element('layer'), {
        ...recorder(),
        modal: true,
        scrollLock: false,
      });

      expect(document.body.style.overflow).toBe('');
      handle.destroy();
    });
  });
});

/**
 * The same record read from the other side. A control that loses focus during a
 * press gets `relatedTarget: null` and cannot tell the reader leaving from the
 * reader pressing something of its own (CB11).
 */
describe('pressOrigin', () => {
  beforeEach(() => {
    mount('<div id="frame"><button id="inside"></button></div><button id="page"></button>');
  });

  it('reports nothing while no layer is open', () => {
    press(element('inside'));
    expect(pressOrigin(document)).toBeNull();
  });

  it('names where the press in flight went down, and forgets it at the click', () => {
    const layer = recorder();
    const handle = createDismissableLayer(element('frame'), { ...layer, outsidePress: false });

    press(element('inside'), 'pointerdown');
    expect(pressOrigin(document)).toBe(element('inside'));

    press(element('inside'), 'click');
    expect(pressOrigin(document)).toBeNull();
    handle.destroy();
  });

  it('names a press that went down outside just as plainly', () => {
    const layer = recorder();
    const handle = createDismissableLayer(element('frame'), { ...layer, outsidePress: false });

    press(element('page'), 'pointerdown');
    expect(pressOrigin(document)).toBe(element('page'));
    handle.destroy();
  });

  it('falls back to the ambient document', () => {
    const layer = recorder();
    const handle = createDismissableLayer(element('frame'), { ...layer, outsidePress: false });

    press(element('inside'), 'pointerdown');
    expect(pressOrigin()).toBe(element('inside'));
    handle.destroy();
  });
});

describe('createScrollLock', () => {
  beforeEach(() => {
    document.body.removeAttribute('style');
  });

  it('holds the lock until the last holder releases it', () => {
    const first = createScrollLock();
    const second = createScrollLock();

    first.release();
    expect(document.body.style.overflow).toBe('hidden');

    second.release();
    expect(document.body.style.overflow).toBe('');
  });

  it('releases once however many times it is called', () => {
    const first = createScrollLock();
    const second = createScrollLock();

    first.release();
    first.release();
    expect(document.body.style.overflow).toBe('hidden');

    second.release();
    expect(document.body.style.overflow).toBe('');
  });

  /**
   * The failure a counter without recorded originals produces: released out of
   * order, the page keeps an `overflow` nobody asked for.
   */
  it('gives back the inline styles it found, whatever order the locks release in', () => {
    document.body.style.overflow = 'auto';
    document.body.style.paddingInlineEnd = '8px';

    const first = createScrollLock();
    const second = createScrollLock();
    second.release();
    first.release();

    expect(document.body.style.overflow).toBe('auto');
    expect(document.body.style.paddingInlineEnd).toBe('8px');
  });

  it('compensates the scrollbar the lock takes away', () => {
    const clientWidth = vi
      .spyOn(document.documentElement, 'clientWidth', 'get')
      .mockReturnValue(window.innerWidth - 15);

    const lock = createScrollLock();
    expect(document.body.style.paddingInlineEnd).toBe('15px');

    lock.release();
    expect(document.body.style.paddingInlineEnd).toBe('');
    clientWidth.mockRestore();
  });

  it('adds no padding where the document reports no width to lose', () => {
    const lock = createScrollLock();

    expect(document.body.style.paddingInlineEnd).toBe('');
    lock.release();
  });

  /**
   * A tour whose step opens a dialog: the dialog joins the stack over the
   * tour, makes it inert and takes Escape. `raise()` puts the tour back on
   * top — above the dialog in the stack and in the document, its own `inert`
   * over the dialog, and the dialog its parent, so a press in the tour is not
   * a press outside the dialog.
   */
  describe('raise', () => {
    beforeEach(() => {
      mount(
        '<div id="page"></div><div id="root"><div id="tour"></div><div id="dialog"></div></div>',
      );
    });

    it('puts a layer back on top of one opened over it', () => {
      const tourLog = recorder();
      const dialogLog = recorder();
      const tour = createDismissableLayer(element('tour'), { ...tourLog, modal: true });
      const dialog = createDismissableLayer(element('dialog'), { ...dialogLog, modal: true });
      expect(element('tour').hasAttribute('inert')).toBe(true);
      expect(tour.topmost).toBe(false);

      tour.raise();

      expect(tour.topmost).toBe(true);
      expect(element('tour').hasAttribute('inert')).toBe(false);
      expect(element('dialog').hasAttribute('inert')).toBe(true);
      expect(element('root').lastElementChild).toBe(element('tour'));
      expect(element('tour').style.getPropertyValue(LAYER_DEPTH_PROPERTY)).toBe('1');

      escape();
      expect(tourLog.reasons).toEqual(['escape']);
      expect(dialogLog.reasons).toEqual([]);

      press(element('tour'));
      expect(dialogLog.reasons).toEqual([]);

      tour.destroy();
      expect(element('dialog').hasAttribute('inert')).toBe(false);
      expect(dialog.topmost).toBe(true);
      dialog.destroy();
      expect(element('page').hasAttribute('inert')).toBe(false);
    });

    /**
     * The tour's layer re-created while the dialog stands: it is already on top
     * of the stack, and still under the `inert` the dialog wrote on it.
     */
    it('clears an inert written over a layer already on top of the stack', () => {
      const dialog = createDismissableLayer(element('dialog'), { ...recorder(), modal: true });
      const tour = createDismissableLayer(element('tour'), { ...recorder(), modal: true });
      expect(tour.topmost).toBe(true);
      expect(element('tour').hasAttribute('inert')).toBe(true);
      tour.raise();
      expect(tour.topmost).toBe(true);
      expect(element('tour').hasAttribute('inert')).toBe(false);
      expect(element('dialog').hasAttribute('inert')).toBe(true);
      tour.destroy();
      dialog.destroy();
    });
  });
});
