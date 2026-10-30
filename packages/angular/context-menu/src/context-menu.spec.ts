import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { SlMenu, SlMenuItem } from '@slotted/angular/menu';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/context-menu/contract.json';
import { provideContextMenuDefaults } from './context-menu-defaults';
import { SlContextMenuTrigger } from './context-menu-trigger';

@Component({
  standalone: true,
  imports: [SlContextMenuTrigger, SlMenu, SlMenuItem],
  template: `
    <div [slContextMenuTriggerFor]="actions" tabindex="0" [longPressDelay]="delay()">
      <span>Q3 board deck.pdf</span>
      <button type="button">Star</button>
    </div>
    <sl-menu #actions [disabled]="disabled()" (openChangeRequest)="reasons.push($event.reason)">
      <button slMenuItem>Open</button>
      <button slMenuItem>Rename</button>
      <button slMenuItem tone="danger">Move to trash</button>
    </sl-menu>
  `,
})
class Host {
  readonly disabled = signal(false);
  readonly delay = signal<number | undefined>(undefined);
  readonly reasons: string[] = [];
}

const target = () => document.querySelector<HTMLElement>("[data-ui='context-menu']")!;
const surface = () => document.querySelector<HTMLElement>("[data-ui='menu'] [role='menu']");
const items = () => [...document.querySelectorAll<HTMLElement>("[data-part='item']")];
const item = (label: string) =>
  items().find((node) => node.querySelector("[data-part='label']")?.textContent?.trim() === label);

const rightClick = (element: Element, x = 40, y = 60) => {
  const event = new MouseEvent('contextmenu', {
    bubbles: true,
    button: 2,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  element.dispatchEvent(event);
  return event;
};

describe('slContextMenuTriggerFor', () => {
  let fixture: ComponentFixture<Host>;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    await settle();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('owns the target as its root and holds sl-menu unchanged', async () => {
    const root = target();
    expect(root.getAttribute('data-part')).toBe('root');
    expect(root.hasAttribute('aria-haspopup')).toBe(false);
    expect(surface()).toBeNull();

    rightClick(root);
    await settle();

    expect(surface()).not.toBeNull();
    expect(contract.members.contextMenu.parts).toEqual(['root']);
  });

  it('opens at the pointer, prevents the native menu and focuses the first item', async () => {
    const event = rightClick(target());
    await settle();

    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.reasons).toEqual(['pointer']);
    expect(target().hasAttribute('data-open')).toBe(true);
    expect(document.activeElement).toBe(item('Open'));
  });

  it('moves to a new point while open without a second request', async () => {
    rightClick(target(), 40, 60);
    await settle();
    rightClick(target(), 120, 90);
    await settle();

    expect(surface()).not.toBeNull();
    expect(fixture.componentInstance.reasons).toEqual(['pointer']);
  });

  it('opens from the keyboard anchored to the target, and ignores the echoed contextmenu', async () => {
    const root = target();
    root.focus();
    root.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'F10', shiftKey: true }));
    await settle();
    expect(surface()).not.toBeNull();
    expect(fixture.componentInstance.reasons).toEqual(['keyboard']);

    rightClick(root);
    await settle();
    expect(fixture.componentInstance.reasons).toEqual(['keyboard']);
  });

  it('returns focus to the element that held it when the menu opened', async () => {
    const star = target().querySelector('button')!;
    star.focus();
    rightClick(target());
    await settle();
    expect(document.activeElement).toBe(item('Open'));

    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
    );
    await settle();

    expect(surface()).toBeNull();
    expect(document.activeElement).toBe(star);
  });

  it('closes on a primary press on the target, as an outside press', async () => {
    rightClick(target());
    await settle();

    target().dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }),
    );
    await settle();

    expect(surface()).toBeNull();
    expect(fixture.componentInstance.reasons).toEqual(['pointer', 'outsidePress']);
  });

  it('opens on a long press on touch after the delay, marking the press meanwhile', async () => {
    const root = target();
    root.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        pointerType: 'touch',
        clientX: 30,
        clientY: 30,
      }),
    );
    await settle();
    expect(root.hasAttribute('data-pressed')).toBe(true);

    vi.advanceTimersByTime(499);
    await settle();
    expect(surface()).toBeNull();

    vi.advanceTimersByTime(1);
    await settle();
    expect(surface()).not.toBeNull();
    expect(root.hasAttribute('data-pressed')).toBe(false);
  });

  it('cancels the long press when the finger moves', async () => {
    const root = target();
    root.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        pointerType: 'touch',
        clientX: 30,
        clientY: 30,
      }),
    );
    root.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        pointerType: 'touch',
        clientX: 30,
        clientY: 45,
      }),
    );
    vi.advanceTimersByTime(600);
    await settle();
    expect(surface()).toBeNull();
    expect(root.hasAttribute('data-pressed')).toBe(false);
  });

  it('lets the browser’s own menu through while the menu is disabled', async () => {
    fixture.componentInstance.disabled.set(true);
    await settle();
    expect(target().hasAttribute('data-disabled')).toBe(true);

    const event = rightClick(target());
    await settle();
    expect(event.defaultPrevented).toBe(false);
    expect(surface()).toBeNull();
  });
});

@Component({
  standalone: true,
  imports: [SlContextMenuTrigger, SlMenu, SlMenuItem],
  providers: [provideContextMenuDefaults({ longPressDelay: 200 })],
  template: `
    <table>
      <tbody>
        <tr [slContextMenuTriggerFor]="actions" data-part="row" data-part-row="">
          <td>Invoice</td>
        </tr>
      </tbody>
    </table>
    <sl-menu #actions>
      <button slMenuItem>Open</button>
    </sl-menu>
  `,
})
class RowHost {}

describe('slContextMenuTriggerFor on a host that has a part', () => {
  it('keeps the host’s own data-part and reads the provided delay', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await TestBed.configureTestingModule({ imports: [RowHost] }).compileComponents();
    const fixture = TestBed.createComponent(RowHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const row = document.querySelector('tr')!;
    expect(row.getAttribute('data-ui')).toBe('context-menu');
    expect(row.getAttribute('data-part')).toBe('row');

    row.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        pointerType: 'pen',
        clientX: 1,
        clientY: 1,
      }),
    );
    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelector("[data-ui='menu'] [role='menu']")).not.toBeNull();

    fixture.destroy();
    vi.useRealTimers();
  });
});
