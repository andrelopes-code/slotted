import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SlMenu } from './menu';
import { provideMenuDefaults } from './menu-defaults';
import { SlMenuItem } from './menu-items';
import { SlMenuTrigger } from './menu-trigger';

@Component({
  standalone: true,
  imports: [SlMenu, SlMenuItem, SlMenuTrigger],
  template: '',
})
class Host {
  readonly ran = signal<string | null>(null);
}

const trigger = () => document.querySelector<HTMLElement>('[data-testid="trigger"]')!;
const layers = () => [...document.querySelectorAll<HTMLElement>('[data-ui="menu"][data-open]')];

async function open(attributes: string, phone: boolean, providers: unknown[] = []) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: phone && query === '(max-width: 480px) and (pointer: coarse)',
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  TestBed.overrideComponent(Host, {
    set: {
      template: `<button data-testid="trigger" [slMenuTriggerFor]="actions">Row actions</button>
        <sl-menu #actions ${attributes}>
          <button slMenuItem (select)="ran.set('edit')">Edit</button>
          <button slMenuItem (select)="ran.set('duplicate')">Duplicate</button>
          <button slMenuItem tone="danger" (select)="ran.set('delete')">Delete</button>
          <button slMenuItem data-testid="move" [slMenuTriggerFor]="move">Move to</button>
          <sl-menu #move>
            <button slMenuItem (select)="ran.set('archive')">Archive</button>
            <button slMenuItem (select)="ran.set('trash')">Trash</button>
          </sl-menu>
        </sl-menu>`,
    },
  });
  const fixture = TestBed.createComponent(Host);
  const settle = async () => {
    for (let turn = 0; turn < 3; turn += 1) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
  };
  await settle();
  trigger().click();
  await settle();

  return { fixture, settle };
}

/**
 * A menu of row actions on a phone opened as a list anchored to its trigger,
 * at the list's own height, while the sheet beside it rose from the bottom.
 */
describe('a menu on a phone', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('is a modal sheet of its items under presentation="auto"', async () => {
    const { settle } = await open('presentation="auto"', true);
    const [sheet] = layers();
    const menu = sheet!.querySelector<HTMLElement>('[role="menu"]')!;
    const items = [...menu.querySelectorAll<HTMLElement>(':scope > [role="menuitem"]')];

    expect(sheet!.dataset['presentation']).toBe('sheet');
    expect(items.map((item) => item.textContent?.trim())).toEqual([
      'Edit',
      'Duplicate',
      'Delete',
      'Move to',
    ]);
    expect(menu.contains(document.activeElement)).toBe(true);
    expect(trigger().closest('[inert]')).not.toBeNull();

    sheet!.querySelector<HTMLElement>(':scope > [data-part="backdrop"]')!.click();
    await settle();

    expect(layers()).toHaveLength(0);
    expect(document.activeElement).toBe(trigger());
    expect(document.querySelector('[inert]')).toBeNull();
  });

  it('opens a submenu as a second step of the same sheet', async () => {
    const { fixture, settle } = await open('presentation="auto"', true);
    const item = document.querySelector<HTMLElement>('[data-testid="move"]')!;
    item.click();
    await settle();
    const step = layers()[1]!;
    const second = step.querySelector<HTMLElement>('[role="menu"]')!;

    expect(step.dataset['presentation']).toBe('sheet');
    expect(step.hasAttribute('data-step')).toBe(true);
    expect(second.querySelector('[data-part="title"]')?.textContent?.trim()).toBe('Move to');
    expect(second.contains(document.activeElement)).toBe(true);

    second.querySelector<HTMLElement>('[data-part="back"]')!.click();
    await settle();

    expect(layers()).toHaveLength(1);
    expect(document.activeElement).toBe(item);

    item.click();
    await settle();
    layers()[1]!.querySelector<HTMLElement>('[role="menuitem"]')!.click();
    await settle();

    expect(fixture.componentInstance.ran()).toBe('archive');
    expect(layers()).toHaveLength(0);
    expect(document.activeElement).toBe(trigger());
  });

  it('is a sheet for every menu under the provider', async () => {
    await open('', true, [provideMenuDefaults({ presentation: 'auto' })]);

    expect(layers()[0]!.dataset['presentation']).toBe('sheet');
  });

  it.each([
    ['presentation="auto" on a wide screen', 'presentation="auto"', false],
    ['no presentation on a phone', '', true],
    ['no presentation on a wide screen', '', false],
  ])('is the anchored list with %s', async (_, attributes, phone) => {
    await open(attributes, phone);

    expect(layers()[0]!.dataset['presentation']).toBe('popover');
    expect(layers()[0]!.querySelector('[data-part="backdrop"], [data-part="grip"]')).toBeNull();
    expect(document.querySelector('[inert]')).toBeNull();
  });

  it('keeps an anchored menu open under a press on an item that opens a submenu', async () => {
    const { fixture, settle } = await open('', false);
    document.querySelector<HTMLElement>('[data-testid="move"]')!.click();
    await settle();

    expect(layers()).toHaveLength(2);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(fixture.componentInstance.ran()).toBeNull();
  });
});
