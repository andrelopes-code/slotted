import { afterEach, describe, expect, it } from 'vitest';

import { createFocusOrigin } from './focus-origin';
import type { FocusOriginHandle } from './focus-origin';
import { focusTarget } from './focus-target';

const handles: FocusOriginHandle[] = [];

function region() {
  document.body.innerHTML = '<button>before</button><div tabindex="0"><p>text</p></div>';
  const element = document.querySelector('div') as HTMLElement;
  handles.push(createFocusOrigin(element));
  return element;
}

/** A pointer press focuses the nearest focusable ancestor, as a browser does. */
function press(target: Element) {
  target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
  target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  const focusable = target.closest<HTMLElement>('[tabindex], button, a[href]');
  if (focusable === null) (document.activeElement as HTMLElement | null)?.blur();
  else focusable.focus();
}

function key(target: Element, name: string) {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: name }));
}

describe('createFocusOrigin', () => {
  afterEach(() => {
    handles.splice(0).forEach((handle) => handle.destroy());
    document.body.innerHTML = '';
  });

  it('marks a focus reached by Tab as keyboard', () => {
    const element = region();
    key(document.querySelector('button')!, 'Tab');
    element.focus();

    expect(element.getAttribute('data-focus-origin')).toBe('keyboard');
  });

  it('keeps a focus reached by a click as pointer when a modifier is pressed after it', () => {
    const element = region();
    press(element.querySelector('p')!);
    expect(element.getAttribute('data-focus-origin')).toBe('pointer');

    for (const modifier of ['Shift', 'Control', 'Alt', 'Meta']) key(element, modifier);

    expect(element.getAttribute('data-focus-origin')).toBe('pointer');
  });

  it('turns pointer into keyboard on a navigation key, because the reader scrolls by keyboard', () => {
    const element = region();
    press(element.querySelector('p')!);
    key(element, 'ArrowDown');

    expect(element.getAttribute('data-focus-origin')).toBe('keyboard');
  });

  it('marks a programmatic focus after a key press as keyboard, and after a click as pointer', () => {
    const element = region();
    const button = document.querySelector('button')!;

    key(button, 'Enter');
    element.focus();
    expect(element.getAttribute('data-focus-origin')).toBe('keyboard');

    element.blur();
    press(button);
    element.focus();
    expect(element.getAttribute('data-focus-origin')).toBe('pointer');
  });

  it('clears the origin on blur and on destroy', () => {
    const element = region();
    element.focus();
    element.blur();
    expect(element.hasAttribute('data-focus-origin')).toBe(false);

    element.focus();
    handles.splice(0).forEach((handle) => handle.destroy());
    expect(element.hasAttribute('data-focus-origin')).toBe(false);
  });
});

describe('focusTarget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('focuses a destination for one visit, and a click inside it never focuses it after', () => {
    document.body.innerHTML = '<main><p>text</p></main>';
    const main = document.querySelector('main')!;

    focusTarget(main);
    expect(document.activeElement).toBe(main);

    press(main.querySelector('p')!);
    expect(document.activeElement).not.toBe(main);
    expect(main.hasAttribute('tabindex')).toBe(false);

    press(main.querySelector('p')!);
    expect(document.activeElement).not.toBe(main);
  });

  it('removes the attribute on blur', () => {
    document.body.innerHTML = '<main><p>text</p></main><button>after</button>';
    const main = document.querySelector('main')!;

    focusTarget(main);
    document.querySelector('button')!.focus();

    expect(main.hasAttribute('tabindex')).toBe(false);
  });

  it('leaves a tabindex the consumer wrote as written', () => {
    document.body.innerHTML = '<main tabindex="-1"></main><button>after</button>';
    const main = document.querySelector('main')!;

    focusTarget(main);
    expect(document.activeElement).toBe(main);
    document.querySelector('button')!.focus();

    expect(main.getAttribute('tabindex')).toBe('-1');
  });
});
