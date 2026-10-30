import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlMenuItem } from '@slotted/angular/menu';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  SlToolbar,
  SlToolbarGroup,
  SlToolbarItem,
  SlToolbarSeparator,
  SlToolbarSpacer,
} from './toolbar';
import { provideToolbarDefaults } from './toolbar-defaults';
import { SlToolbarOverflow } from './toolbar-overflow';

@Component({
  standalone: true,
  imports: [SlToolbar, SlToolbarGroup, SlToolbarSeparator, SlToolbarSpacer],
  template: `<div
    slToolbar
    aria-label="Formatting"
    [orientation]="orientation()"
    [loop]="loop()"
    [size]="size()"
  >
    <div slToolbarGroup aria-label="Alignment">
      <button type="button">Bold</button>
      <button type="button" [attr.aria-disabled]="ariaDisabled() ? 'true' : null">Italic</button>
    </div>
    <div slToolbarSeparator></div>
    <div slToolbarSpacer></div>
    @if (field()) {
      <input aria-label="Buscar" type="search" />
    } @else {
      <button type="button">Link</button>
    }
    @if (extra()) {
      <button type="button">Quote</button>
    }
  </div>`,
})
class Host {
  readonly orientation = signal<'horizontal' | 'vertical' | undefined>(undefined);
  readonly loop = signal<boolean | undefined>(undefined);
  readonly size = signal<'sm' | 'md' | 'lg' | undefined>(undefined);
  readonly ariaDisabled = signal(false);
  readonly field = signal(false);
  readonly extra = signal(false);
}

describe('SlToolbar', () => {
  let fixture: ComponentFixture<Host>;

  const all = (selector: string) => [
    ...(fixture.nativeElement.querySelectorAll(selector) as NodeListOf<HTMLElement>),
  ];
  const bar = () => fixture.nativeElement.querySelector('[data-ui="toolbar"]') as HTMLElement;
  const items = () => all('button, input');
  const item = (index: number) => items()[index] as HTMLElement;
  const press = (element: HTMLElement, key: string) =>
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    fixture.autoDetectChanges();
    /* Two cycles: the first renders the bar and the trigger, the second is the
       one the trigger's registration starts — the collapse is created from a
       signal the first cycle writes. */
    await fixture.whenStable();
    await fixture.whenStable();
  });

  it('renders the role, the label and every part the contract names', () => {
    expect(bar().getAttribute('role')).toBe('toolbar');
    expect(bar().getAttribute('aria-label')).toBe('Formatting');

    const parts = new Set(all('[data-part]').map((node) => node.getAttribute('data-part')));
    parts.add(bar().getAttribute('data-part'));
    for (const part of ['root', 'group', 'separator', 'spacer']) expect(parts).toContain(part);

    expect(all('[data-part="separator"]')[0]?.getAttribute('aria-orientation')).toBe('vertical');
    expect(all('[data-part="group"]')[0]?.getAttribute('role')).toBe('group');
  });

  it('holds one tab stop', () => {
    expect(item(0).getAttribute('tabindex')).toBe('0');
    expect(item(1).getAttribute('tabindex')).toBe('-1');
    expect(item(2).getAttribute('tabindex')).toBe('-1');
  });

  it('moves along the bar with the arrows and wraps at both ends', async () => {
    item(0).focus();
    press(item(0), 'ArrowRight');
    await fixture.whenStable();
    expect(document.activeElement).toBe(item(1));

    press(item(1), 'ArrowRight');
    await fixture.whenStable();
    expect(document.activeElement).toBe(item(2));

    press(item(2), 'ArrowRight');
    await fixture.whenStable();
    expect(document.activeElement).toBe(item(0));
  });

  /** "Up Arrow and Down Arrow can duplicate Left Arrow and Right Arrow." */
  it('duplicates the cross-axis pair, which the pattern permits', async () => {
    item(0).focus();
    press(item(0), 'ArrowDown');
    await fixture.whenStable();

    expect(document.activeElement).toBe(item(1));
  });

  it('reaches both ends with Home and End', async () => {
    item(0).focus();
    press(item(0), 'End');
    await fixture.whenStable();
    expect(document.activeElement).toBe(item(2));

    press(item(2), 'Home');
    await fixture.whenStable();
    expect(document.activeElement).toBe(item(0));
  });

  it('clamps at the ends when looping is off', async () => {
    fixture.componentInstance.loop.set(false);
    await fixture.whenStable();

    item(0).focus();
    press(item(0), 'ArrowLeft');
    await fixture.whenStable();

    expect(document.activeElement).toBe(item(0));
  });

  it('turns the arrows and announces the axis when the bar is vertical', async () => {
    fixture.componentInstance.orientation.set('vertical');
    await fixture.whenStable();

    expect(bar().getAttribute('aria-orientation')).toBe('vertical');
    expect(all('[data-part="separator"]')[0]?.getAttribute('aria-orientation')).toBe('horizontal');

    item(0).focus();
    press(item(0), 'ArrowDown');
    await fixture.whenStable();
    expect(document.activeElement).toBe(item(1));
  });

  /**
   * The APG allows a focusable disabled control "where discoverability of a
   * function is crucial", which is what `button`'s `focusableWhenDisabled`
   * renders.
   */
  it('keeps an aria-disabled control in the ring', async () => {
    fixture.componentInstance.ariaDisabled.set(true);
    await fixture.whenStable();

    item(0).focus();
    press(item(0), 'ArrowRight');
    await fixture.whenStable();

    expect(document.activeElement).toBe(item(1));
  });

  /**
   * The APG asks an author to avoid a control that needs the navigation pair;
   * the bar enforces it, so the caret keeps its keys and focus leaves on the
   * cross axis.
   */
  it('leaves the flow arrows to an item that operates with them', async () => {
    fixture.componentInstance.field.set(true);
    await fixture.whenStable();

    const field = all('input')[0] as HTMLElement;
    field.focus();
    press(field, 'ArrowLeft');
    await fixture.whenStable();
    expect(document.activeElement).toBe(field);

    press(field, 'ArrowUp');
    await fixture.whenStable();
    expect(document.activeElement).toBe(item(1));
  });

  it('finds a control that arrives after the bar was built', async () => {
    fixture.componentInstance.extra.set(true);
    await fixture.whenStable();

    item(0).focus();
    press(item(0), 'End');
    await fixture.whenStable();

    expect(document.activeElement).toBe(item(3));
  });

  it('takes the defaults an application sets once, and lets a bar win over them', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideToolbarDefaults({ size: 'sm', variant: 'outline' })],
    });
    const scoped = TestBed.createComponent(Host);
    scoped.autoDetectChanges();
    await scoped.whenStable();

    const root = scoped.nativeElement.querySelector('[data-ui="toolbar"]') as HTMLElement;
    expect(root.getAttribute('data-size')).toBe('sm');
    expect(root.getAttribute('data-variant')).toBe('outline');

    scoped.componentInstance.size.set('lg');
    await scoped.whenStable();
    expect(root.getAttribute('data-size')).toBe('lg');
  });
});

/**
 * The collapse is a measurement, and the test environment lays nothing out. The
 * room each box takes is therefore stated on it, which is what a browser would
 * have reported: `data-test-width` on a unit is its width, and on the bar it is
 * the room the bar has. Nothing else is stubbed — it is the same `collapseState`
 * a browser runs.
 */
@Component({
  standalone: true,
  imports: [SlToolbar, SlToolbarItem, SlToolbarSeparator, SlToolbarOverflow, SlMenuItem],
  template: `<div
    slToolbar
    aria-label="Documento"
    overflow="menu"
    [attr.data-test-width]="room()"
    (overflowChange)="hidden.set($event)"
  >
    <div slToolbarItem data-test-width="40">
      <button type="button">Publicar</button>
    </div>
    <div slToolbarSeparator data-test-width="10"></div>
    <div slToolbarItem data-test-width="40" [slToolbarItemCounterpart]="duplicate">
      <button type="button">Duplicar</button>
    </div>
    <div slToolbarItem data-test-width="40" [slToolbarItemCounterpart]="archive">
      <button type="button">Arquivar</button>
    </div>
    <sl-toolbar-overflow data-test-width="30" />
    <ng-template #duplicate><button slMenuItem>Duplicar</button></ng-template>
    <ng-template #archive><button slMenuItem>Arquivar</button></ng-template>
  </div>`,
})
class OverflowHost {
  readonly room = signal(400);
  readonly hidden = signal(-1);
}

describe('SlToolbar under overflow="menu"', () => {
  let fixture: ComponentFixture<OverflowHost>;

  const bar = () => fixture.nativeElement.querySelector('[data-ui="toolbar"]') as HTMLElement;
  const trigger = () => bar().querySelector('[data-part="overflow"]') as HTMLElement;
  const unit = (label: string) =>
    [...bar().querySelectorAll<HTMLElement>('[data-part="item"]')].find((box) =>
      box.textContent?.includes(label),
    ) as HTMLElement;

  /* The trigger is drawn inside `sl-toolbar-overflow`, whose host is
     `display: contents`, so the room stated on the element the test wrote is
     read from the nearest box that states one. */
  const stated = (element: HTMLElement) =>
    Number(element.closest('[data-test-width]')?.getAttribute('data-test-width') ?? 0);

  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return stated(this);
      },
    });
    HTMLElement.prototype.getBoundingClientRect = function rect(this: HTMLElement) {
      const width = stated(this);
      return { bottom: 0, height: 0, left: 0, right: width, top: 0, width, x: 0, y: 0 } as DOMRect;
    };
  });

  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
  });

  async function mount(room: number, providers: unknown[] = []) {
    TestBed.configureTestingModule({ imports: [OverflowHost], providers: providers as never });
    fixture = TestBed.createComponent(OverflowHost);
    fixture.componentInstance.room.set(room);
    fixture.autoDetectChanges();
    /* Two cycles: the first renders the bar and the trigger, the second is the
       one the trigger's registration starts — the collapse is created from a
       signal the first cycle writes. */
    await fixture.whenStable();
    await fixture.whenStable();
  }

  it('hides the trigger and every control while the bar has room', async () => {
    await mount(400);

    expect(bar().getAttribute('data-collapsed')).toBe('0');
    expect(trigger().hasAttribute('hidden')).toBe(true);
    expect(unit('Arquivar').hasAttribute('hidden')).toBe(false);
  });

  /**
   * The end gives way first, which is what "the overflow takes what is left
   * over" means when the bar is read in its own order.
   */
  it('gives way from the end and draws the trigger with the count in its name', async () => {
    await mount(125);

    expect(unit('Arquivar').hasAttribute('hidden')).toBe(true);
    expect(unit('Duplicar').hasAttribute('hidden')).toBe(false);
    expect(trigger().hasAttribute('hidden')).toBe(false);
    expect(trigger().getAttribute('aria-label')).toBe('1 more action');
    expect(
      trigger().querySelector('[data-ui="icon"][aria-hidden="true"] > svg[data-glyph="ellipsis"]'),
    ).not.toBeNull();
  });

  /**
   * A control with nothing to become has nowhere to go, so it stays — which is
   * how the primary action survives a bar that ran out of room, without a
   * priority ranking it above the others.
   */
  it('never hides a unit that declares no counterpart', async () => {
    await mount(30);

    expect(unit('Publicar').hasAttribute('hidden')).toBe(false);
    expect(unit('Duplicar').hasAttribute('hidden')).toBe(true);
    expect(trigger().getAttribute('aria-label')).toBe('2 more actions');
  });

  /** The counted default is a sentence of the language in force, with its plural. */
  it('names the trigger in the language in force', async () => {
    await mount(30, [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })]);

    // language: pt-BR
    expect(trigger().getAttribute('aria-label')).toBe('Mais 2 ações');
    // language: en-US
  });

  /** A rule that divides nothing is a stray line. */
  it('takes a separator that is left dividing nothing', async () => {
    await mount(60);

    const rule = bar().querySelector('[data-part="separator"]') as HTMLElement;
    expect(rule.hasAttribute('hidden')).toBe(true);
  });

  it('renders the counterpart of every collapsed unit, in the bar order', async () => {
    await mount(60);

    trigger().click();
    await fixture.whenStable();

    const items = [...document.querySelectorAll('[role="menuitem"]')];
    expect(items.map((entry) => entry.textContent?.trim())).toEqual(['Duplicar', 'Arquivar']);
  });

  it('reports the count once per change', async () => {
    await mount(125);

    expect(fixture.componentInstance.hidden()).toBe(1);
  });

  /** A control the platform will not focus is not a stop the arrows can land on. */
  it('takes a collapsed control out of the ring', async () => {
    await mount(60);

    const first = bar().querySelector('button') as HTMLElement;
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'End' }));

    expect(document.activeElement).toBe(trigger());
  });
});
