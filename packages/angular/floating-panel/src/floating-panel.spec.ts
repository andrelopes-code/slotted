import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

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

    grip.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }));

    expect(fixture.componentInstance.moves.at(-1)?.x).toBeGreaterThanOrEqual(0);
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
