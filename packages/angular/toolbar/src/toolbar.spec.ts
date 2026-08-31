import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { SlToolbar } from './toolbar';
import type { ToolbarOrientation } from './toolbar';

@Component({
  imports: [SlToolbar],
  template: `
    <div slToolbar id="toolbar" aria-label="Formatting" [orientation]="orientation()">
      <button type="button">Bold</button>
      <button disabled type="button">Italic</button>
      <button type="button">Underline</button>
      @if (extra()) {
        <button type="button">Strikethrough</button>
      }
    </div>
  `,
})
class Host {
  readonly extra = signal(false);
  readonly orientation = signal<ToolbarOrientation>('horizontal');
}

@Component({
  imports: [SlToolbar],
  template: `<div slToolbar></div>`,
})
class NamelessHost {}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    buttons: () => [...element.querySelectorAll<HTMLButtonElement>('button')],
    fixture,
    toolbar: () => element.querySelector<HTMLElement>('#toolbar')!,
  };
}

const press = (element: Element, key: string) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }));

describe('SlToolbar', () => {
  it('is a toolbar, which is what makes it one tab stop', () => {
    const { toolbar } = mount();

    expect(toolbar().getAttribute('role')).toBe('toolbar');
    expect(toolbar().getAttribute('aria-label')).toBe('Formatting');
  });

  it('leaves exactly one control in the tab order', () => {
    const [bold, italic, underline] = mount().buttons();

    expect(bold?.getAttribute('tabindex')).toBe('0');
    expect(italic?.getAttribute('tabindex')).toBe('-1');
    expect(underline?.getAttribute('tabindex')).toBe('-1');
  });

  it('moves the tab stop with the arrows across the axis, stepping over a disabled control', () => {
    const [bold, italic, underline] = mount().buttons();

    press(bold!, 'ArrowRight');

    expect(underline?.getAttribute('tabindex')).toBe('0');
    expect(italic?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(underline);
  });

  it('wraps past the end, so the row has no dead corner', () => {
    const [bold, , underline] = mount().buttons();

    press(bold!, 'ArrowRight');
    press(underline!, 'ArrowRight');

    expect(document.activeElement).toBe(bold);
  });

  it('uses the other arrow pair when the controls are stacked', () => {
    const { buttons, fixture } = mount();

    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();

    const [bold, , underline] = buttons();
    press(bold!, 'ArrowDown');

    expect(document.activeElement).toBe(underline);
  });

  it('goes to each end with Home and End', () => {
    const [bold, , underline] = mount().buttons();

    press(bold!, 'End');
    expect(document.activeElement).toBe(underline);

    press(underline!, 'Home');
    expect(document.activeElement).toBe(bold);
  });

  it('calls a stacked toolbar vertical, and says nothing for a row', () => {
    const { fixture, toolbar } = mount();

    expect(toolbar().hasAttribute('aria-orientation')).toBe(false);

    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();

    expect(toolbar().getAttribute('aria-orientation')).toBe('vertical');
  });

  it('takes charge of a control added after it was built', async () => {
    const { buttons, fixture } = mount();

    fixture.componentInstance.extra.set(true);
    fixture.detectChanges();

    await vi.waitFor(() => {
      expect(buttons()[3]?.getAttribute('tabindex')).toBe('-1');
    });
  });

  it('warns in development when nothing names it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    TestBed.createComponent(NamelessHost).detectChanges();

    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
