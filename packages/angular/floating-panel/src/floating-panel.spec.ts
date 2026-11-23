import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/floating-panel/contract.json';
import type { FloatingPlace } from './floating-panel';
import {
  SlFloatingPanel,
  SlFloatingPanelBody,
  SlFloatingPanelClose,
  SlFloatingPanelHandle,
  SlFloatingPanelTitle,
} from './floating-panel';

@Component({
  standalone: true,
  imports: [
    SlFloatingPanel,
    SlFloatingPanelBody,
    SlFloatingPanelClose,
    SlFloatingPanelHandle,
    SlFloatingPanelTitle,
  ],
  template: `<button id="opener" type="button">Calculator</button>
    <section
      slFloatingPanel
      [open]="open()"
      [place]="place()"
      [step]="16"
      [largeStep]="64"
      (openChange)="open.set($event)"
      (placeChange)="moves.push($event)"
    >
      <div slFloatingPanelHandle>
        <h2 slFloatingPanelTitle>Calculator</h2>
        <button slFloatingPanelClose></button>
      </div>
      <div slFloatingPanelBody><input aria-label="Expression" /></div>
    </section>`,
})
class Host {
  readonly open = signal(false);
  readonly place = signal<FloatingPlace | undefined>({ x: 40, y: 40 });
  readonly moves: FloatingPlace[] = [];
}

describe('SlFloatingPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[data-ui="floating-panel"]') as HTMLElement;
    return { fixture, root };
  }

  it('is a named region with every part the contract declares, hidden until open', () => {
    const { fixture, root } = setup();
    expect(root.hasAttribute('hidden')).toBe(true);

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(root.getAttribute('role')).toBe('region');
    expect(root.getAttribute('aria-labelledby')).toBe(
      root.querySelector('[data-part="title"]')!.id,
    );
    for (const part of contract.members.floatingPanel.parts) {
      expect(
        root.getAttribute('data-part') === part || root.querySelector(`[data-part="${part}"]`),
        part,
      ).toBeTruthy();
    }
  });

  it('moves a step on an arrow of its grip and reports the place', () => {
    const { fixture, root } = setup();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const grip = root.querySelector('[data-part="grip"]') as HTMLElement;
    layout(root);

    grip.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }));

    grip.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown', shiftKey: true }),
    );

    expect(fixture.componentInstance.moves).toEqual([
      { x: 56, y: 40 },
      { x: 40, y: 104 },
    ]);
  });

  it('stands in its corner, able to take focus, until it has a place', () => {
    const { fixture, root } = setup();
    fixture.componentInstance.place.set(undefined);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(root.getAttribute('data-corner')).toBe('bottom-end');
    expect(root.style.visibility).toBe('');

    fixture.componentInstance.place.set({ x: 40, y: 40 });
    fixture.detectChanges();

    expect(root.hasAttribute('data-corner')).toBe(false);
    expect(root.style.getPropertyValue('--_x')).toBe('40px');
  });

  it('reports one end per drag, and none for a press that does not move it', () => {
    const { fixture, root } = setup();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const handle = root.querySelector('[data-part="handle"]') as HTMLElement;
    handle.setPointerCapture = () => {};
    const pointer = (type: string, clientX: number) =>
      handle.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, clientX }));

    pointer('pointerdown', 10);
    pointer('pointerup', 10);
    expect(fixture.componentInstance.moves).toHaveLength(0);

    pointer('pointerdown', 10);
    pointer('pointermove', 30);
    pointer('pointermove', 60);
    pointer('pointerup', 60);
    expect(fixture.componentInstance.moves).toHaveLength(1);
  });

  it('closes on Escape inside it and returns focus to the element that held it', () => {
    const { fixture, root } = setup();
    const opener = fixture.nativeElement.querySelector('#opener') as HTMLElement;
    opener.focus();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const focus = vi.spyOn(opener, 'focus');

    root
      .querySelector('input')!
      .dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }),
      );
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(false);
    expect(focus).toHaveBeenCalled();
  });
});

/** jsdom lays nothing out: a panel drawn at 40, 40 in a viewport of 1000 by 800. */
function layout(root: HTMLElement) {
  root.getBoundingClientRect = () => new DOMRect(40, 40, 300, 200);
  const page = root.ownerDocument.documentElement;
  vi.spyOn(page, 'clientWidth', 'get').mockReturnValue(1000);
  vi.spyOn(page, 'clientHeight', 'get').mockReturnValue(800);
}
