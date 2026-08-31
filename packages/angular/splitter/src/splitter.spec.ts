import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { SlSplitter } from './splitter';
import type { SplitterOrientation } from './splitter';
import { SlSplitterHandle } from './splitter-handle';
import { SlSplitterPane } from './splitter-pane';

@Component({
  imports: [SlSplitter, SlSplitterHandle, SlSplitterPane],
  template: `
    <div
      slSplitter
      id="splitter"
      [max]="max()"
      [min]="min()"
      [orientation]="orientation()"
      [step]="step()"
      [(value)]="value"
    >
      <div slSplitterPane id="start">Start</div>
      <div slSplitterHandle aria-label="Resize panes"></div>
      <div slSplitterPane id="end">End</div>
    </div>
  `,
})
class Host {
  readonly max = signal(100);
  readonly min = signal(0);
  readonly orientation = signal<SplitterOrientation>('horizontal');
  readonly step = signal(5);
  readonly value = signal(50);
}

@Component({
  imports: [SlSplitter, SlSplitterHandle, SlSplitterPane],
  template: `
    <div slSplitter>
      <div slSplitterPane>Start</div>
      <div slSplitterHandle></div>
      <div slSplitterPane>End</div>
    </div>
  `,
})
class NamelessHost {}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const root = element.querySelector<HTMLElement>('#splitter')!;
  root.getBoundingClientRect = () => ({ height: 400, left: 0, top: 0, width: 1000 }) as DOMRect;
  return {
    fixture,
    handle: element.querySelector<HTMLElement>('[role="separator"]')!,
    root,
    start: () => element.querySelector<HTMLElement>('#start')!,
  };
}

function press(fixture: { detectChanges: () => void }, element: HTMLElement, key: string) {
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }));
  fixture.detectChanges();
}

describe('SlSplitter', () => {
  it('reports the first pane as a percentage of the container', () => {
    const { handle } = mount();

    expect(handle.getAttribute('aria-valuenow')).toBe('50');
    expect(handle.getAttribute('aria-valuemin')).toBe('0');
    expect(handle.getAttribute('aria-valuemax')).toBe('100');
  });

  it('writes the position as the first grid track', () => {
    const { fixture, root } = mount();

    fixture.componentInstance.value.set(30);
    fixture.detectChanges();

    expect(root.style.gridTemplateColumns).toBe('30% auto 1fr');
    expect(root.style.gridTemplateRows).toBe('');
  });

  it('lays stacked panes out in rows instead of columns', () => {
    const { fixture, root } = mount();

    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();

    expect(root.style.gridTemplateRows).toBe('50% auto 1fr');
    expect(root.style.gridTemplateColumns).toBe('');
  });

  it('calls the separator vertical when the panes are side by side', () => {
    const { fixture, handle } = mount();

    expect(handle.getAttribute('aria-orientation')).toBe('vertical');

    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();

    expect(handle.hasAttribute('aria-orientation')).toBe(false);
  });

  it('is the only focusable part of the family', () => {
    const { handle, start } = mount();

    expect(handle.getAttribute('tabindex')).toBe('0');
    expect(start().hasAttribute('tabindex')).toBe(false);
  });

  it('moves one step towards each edge with the arrows across the axis', () => {
    const { fixture, handle } = mount();

    fixture.componentInstance.step.set(10);
    fixture.detectChanges();

    press(fixture, handle, 'ArrowRight');
    expect(handle.getAttribute('aria-valuenow')).toBe('60');

    press(fixture, handle, 'ArrowLeft');
    press(fixture, handle, 'ArrowLeft');
    expect(handle.getAttribute('aria-valuenow')).toBe('40');
  });

  it('ignores the arrows along the axis, so the page can still scroll', () => {
    const { fixture, handle } = mount();

    press(fixture, handle, 'ArrowUp');
    press(fixture, handle, 'ArrowDown');

    expect(handle.getAttribute('aria-valuenow')).toBe('50');
  });

  it('goes to each end with Home and End', () => {
    const { fixture, handle } = mount();

    fixture.componentInstance.min.set(10);
    fixture.componentInstance.max.set(90);
    fixture.detectChanges();

    press(fixture, handle, 'Home');
    expect(handle.getAttribute('aria-valuenow')).toBe('10');

    press(fixture, handle, 'End');
    expect(handle.getAttribute('aria-valuenow')).toBe('90');
  });

  it('collapses on Enter and restores the position it left', () => {
    const { fixture, handle } = mount();

    fixture.componentInstance.min.set(10);
    fixture.componentInstance.value.set(70);
    fixture.detectChanges();

    press(fixture, handle, 'Enter');
    expect(handle.getAttribute('aria-valuenow')).toBe('10');

    press(fixture, handle, 'Enter');
    expect(handle.getAttribute('aria-valuenow')).toBe('70');
  });

  it('holds the position between the minimum and the maximum', () => {
    const { fixture, handle } = mount();

    fixture.componentInstance.min.set(20);
    fixture.componentInstance.max.set(80);
    fixture.componentInstance.step.set(50);
    fixture.detectChanges();

    press(fixture, handle, 'ArrowRight');
    expect(handle.getAttribute('aria-valuenow')).toBe('80');

    press(fixture, handle, 'ArrowLeft');
    press(fixture, handle, 'ArrowLeft');
    expect(handle.getAttribute('aria-valuenow')).toBe('20');
  });

  it('follows the pointer while it is captured', () => {
    const { fixture, handle } = mount();
    handle.setPointerCapture = vi.fn();
    handle.hasPointerCapture = () => true;
    handle.releasePointerCapture = vi.fn();

    handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    handle.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 250 }));
    fixture.detectChanges();

    expect(handle.getAttribute('aria-valuenow')).toBe('25');
  });

  it('stops following once the pointer is released', () => {
    const { fixture, handle } = mount();
    handle.setPointerCapture = vi.fn();
    handle.hasPointerCapture = () => true;
    handle.releasePointerCapture = vi.fn();

    handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    handle.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    handle.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 900 }));
    fixture.detectChanges();

    expect(handle.getAttribute('aria-valuenow')).toBe('50');
  });

  it('writes the position back through the two-way binding', () => {
    const { fixture, handle } = mount();

    press(fixture, handle, 'End');

    expect(fixture.componentInstance.value()).toBe(100);
  });

  it('warns in development when nothing names the handle', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    TestBed.createComponent(NamelessHost).detectChanges();

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('names each part so the stylesheet can place them', () => {
    const { handle, root, start } = mount();

    expect(root.getAttribute('data-part')).toBe('root');
    expect(start().getAttribute('data-part')).toBe('pane');
    expect(handle.getAttribute('data-part')).toBe('handle');
  });
});
