import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { SlMenubar } from './menubar';

@Component({
  standalone: true,
  imports: [SlMenu, SlMenuItem, SlMenuTrigger, SlMenubar],
  template: `
    <sl-menubar aria-label="Main" [orientation]="orientation()">
      <button [slMenuTriggerFor]="file">File</button>
      <sl-menu #file value="file">
        <button slMenuItem>New</button>
      </sl-menu>

      <button [slMenuTriggerFor]="edit">Edit</button>
      <sl-menu #edit value="edit">
        <button slMenuItem>Undo</button>
      </sl-menu>

      <button [slMenuTriggerFor]="view">View</button>
      <sl-menu #view value="view">
        <button slMenuItem>Zoom in</button>
      </sl-menu>
    </sl-menubar>
  `,
})
class Host {
  readonly orientation = signal<'horizontal' | 'vertical' | undefined>(undefined);
}

const triggers = () => [...document.querySelectorAll<HTMLElement>("[data-part='trigger']")];
const trigger = (label: string) =>
  triggers().find((node) => node.textContent?.trim() === label) as HTMLElement;
const items = () => [...document.querySelectorAll<HTMLElement>("[data-part='item']")];
const item = (label: string) =>
  items().find((node) => node.querySelector("[data-part='label']")?.textContent?.trim() === label);

const press = (key: string) =>
  document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));

const click = (node: Element | null | undefined) =>
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));

describe('SlMenubar', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  it('carries the role and the parts the contract declares', () => {
    const bar = fixture.nativeElement.querySelector("[data-ui='menubar']") as HTMLElement;

    expect(bar.getAttribute('role')).toBe('menubar');
    expect(bar.getAttribute('data-part')).toBe('root');
    expect(trigger('File').getAttribute('role')).toBe('menuitem');
    expect(trigger('File').getAttribute('aria-haspopup')).toBe('menu');
  });

  /** One tab stop for the whole bar, which is what makes it a bar. */
  it('is one tab stop', () => {
    expect(trigger('File').getAttribute('tabindex')).toBe('0');
    expect(trigger('Edit').getAttribute('tabindex')).toBe('-1');
    expect(trigger('View').getAttribute('tabindex')).toBe('-1');
  });

  it('moves between triggers on its own axis, and wraps', () => {
    trigger('File').focus();

    press('ArrowRight');
    expect(document.activeElement).toBe(trigger('Edit'));

    press('End');
    expect(document.activeElement).toBe(trigger('View'));

    press('ArrowRight');
    expect(document.activeElement).toBe(trigger('File'));
  });

  it('opens the menu a trigger names, and switches to another', async () => {
    click(trigger('File'));
    await settle();
    expect(item('New')).not.toBeUndefined();

    click(trigger('Edit'));
    await settle();
    expect(item('New')).toBeUndefined();
    expect(item('Undo')).not.toBeUndefined();
  });

  /** What separates a menubar from a row of buttons. */
  it('switches menus on pointer entry once one is open', async () => {
    trigger('Edit').dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    await settle();
    expect(items()).toHaveLength(0);

    click(trigger('File'));
    await settle();

    trigger('Edit').dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    await settle();
    expect(item('Undo')).not.toBeUndefined();
  });

  /**
   * The pattern's three-step rule, with the recommended half of its choice: the
   * neighbour's menu opens and focus stays on the trigger.
   */
  it('steps to the next menu from inside an open one', async () => {
    click(trigger('File'));
    await settle();
    expect(document.activeElement).toBe(item('New'));

    press('ArrowRight');
    await settle();

    expect(item('Undo')).not.toBeUndefined();
    expect(item('New')).toBeUndefined();
    expect(document.activeElement).toBe(trigger('Edit'));
  });

  it('closes on Escape and leaves focus on the trigger', async () => {
    click(trigger('File'));
    await settle();

    press('Escape');
    await settle();

    expect(items()).toHaveLength(0);
    expect(document.activeElement).toBe(trigger('File'));
  });

  it('states its orientation only when the role does not assume it', async () => {
    const bar = fixture.nativeElement.querySelector("[data-ui='menubar']") as HTMLElement;
    expect(bar.getAttribute('aria-orientation')).toBeNull();

    fixture.componentInstance.orientation.set('vertical');
    await settle();

    expect(bar.getAttribute('aria-orientation')).toBe('vertical');
    expect(bar.getAttribute('data-orientation')).toBe('vertical');
  });

  it('moves along the bar to the trigger a printable character names', () => {
    trigger('File').focus();

    press('v');

    expect(document.activeElement).toBe(trigger('View'));
  });
});
