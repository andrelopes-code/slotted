import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { SlButton } from '@slotted/angular/button';
import { SlMenuItem } from '@slotted/angular/menu';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/action-bar/contract.json';
import {
  SlActionBar,
  SlActionBarAction,
  SlActionBarActions,
  SlActionBarSeparator,
  SlActionBarStatus,
} from './action-bar';
import { provideActionBarDefaults } from './action-bar-defaults';
import { SlActionBarOverflow } from './action-bar-overflow';

/**
 * The bar is measured, and the test DOM lays nothing out: every box is nought
 * wide, so a real collapse cannot be provoked here. What is asserted instead is
 * the contract the measurement is given — the rank on each unit, what counts as
 * a unit, and what the surface holds — plus everything that is not measured at
 * all. The arithmetic itself is `collapseState`'s own test.
 */
@Component({
  standalone: true,
  imports: [
    SlActionBar,
    SlActionBarAction,
    SlActionBarActions,
    SlActionBarOverflow,
    SlActionBarSeparator,
    SlActionBarStatus,
    SlButton,
    SlMenuItem,
  ],
  template: `<div
      slActionBar
      aria-label="Order actions"
      [variant]="variant()"
      [size]="size()"
      [align]="align()"
      [sticky]="sticky()"
      [present]="present()"
    >
      <div slActionBarStatus>Draft saved at 14:07</div>
      <div slActionBarActions>
        <div slActionBarAction [slActionBarActionCounterpart]="duplicate">
          <button slButton variant="ghost" tone="secondary" type="button">Duplicar</button>
        </div>
        <div slActionBarAction="high" [slActionBarActionCounterpart]="send">
          <button slButton variant="outline" tone="secondary" type="button">Devolver</button>
        </div>
        <div slActionBarAction="hide">
          <button slButton variant="ghost" tone="secondary" type="button">Preview</button>
        </div>
        @if (archive()) {
          <div slActionBarAction="always" [slActionBarActionCounterpart]="archived">
            <button slButton variant="ghost" tone="secondary" type="button">Arquivar</button>
          </div>
        }
        <div slActionBarSeparator></div>
        <div slActionBarAction>
          <button slButton type="button">Aprovar</button>
        </div>
        <sl-action-bar-overflow />
      </div>
    </div>

    <ng-template #duplicate><button slMenuItem type="button">Duplicar</button></ng-template>
    <ng-template #send><button slMenuItem type="button">Devolver</button></ng-template>
    <ng-template #archived><button slMenuItem type="button">Arquivar</button></ng-template>`,
})
class Host {
  readonly variant = signal<'plain' | 'raised' | undefined>(undefined);
  readonly size = signal<'sm' | 'md' | 'lg' | undefined>(undefined);
  readonly align = signal<'end' | 'start' | 'center' | undefined>(undefined);
  readonly sticky = signal<boolean | undefined>(undefined);
  readonly present = signal(true);
  readonly archive = signal(false);
}

describe('SlActionBar', () => {
  let fixture: ComponentFixture<Host>;

  const bar = () => fixture.nativeElement.querySelector('[data-ui="action-bar"]') as HTMLElement;
  const units = () =>
    [...bar().querySelectorAll('[data-part="action"]')] as unknown as HTMLElement[];
  const priorities = () => units().map((unit) => unit.getAttribute('data-priority'));
  const trigger = () => bar().querySelector('[data-part="overflow"]') as HTMLButtonElement;

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
    expect(bar().getAttribute('role')).toBe('group');
    expect(bar().getAttribute('aria-label')).toBe('Order actions');

    const drawn = new Set(
      [...bar().querySelectorAll('[data-part]')].map((node) => node.getAttribute('data-part')),
    );
    drawn.add(bar().getAttribute('data-part'));
    for (const declared of contract.members.actionBar.parts) expect(drawn).toContain(declared);
  });

  /**
   * The departure from the APG's Toolbar pattern. Every action is its own tab
   * stop, so a reader walking a form arrives at Cancel and then at Save.
   */
  it('holds one tab stop per action, and binds no arrow key', () => {
    for (const control of bar().querySelectorAll('button')) {
      expect(control.hasAttribute('tabindex')).toBe(false);
    }
    expect(contract.rovingFocus).toBe(false);
  });

  describe('rank', () => {
    it('pins an action that declares no counterpart, and ranks a declared one low', () => {
      expect(priorities()).toEqual(['low', 'high', 'hide', 'pinned']);
    });

    it('keeps an always action out of the bar and in the surface', async () => {
      fixture.componentInstance.archive.set(true);
      await fixture.whenStable();

      const always = units().find((unit) => unit.getAttribute('data-priority') === 'always');
      expect(always?.hasAttribute('hidden')).toBe(true);
      expect(trigger().hasAttribute('hidden')).toBe(false);
      expect(trigger().getAttribute('aria-label')).toBe('1 more action');
      expect(
        trigger().querySelector(
          '[data-ui="icon"][aria-hidden="true"] > svg[data-glyph="ellipsis"]',
        ),
      ).not.toBeNull();
    });

    it('reads the same rank table the other binding does', () => {
      expect(contract.priority.rank).toEqual({ hide: 0, low: 1, high: 2 });
    });
  });

  describe('axes', () => {
    it('states every axis in the DOM, at its documented default', () => {
      expect(bar().getAttribute('data-variant')).toBe(contract.members.actionBar.defaults.variant);
      expect(bar().getAttribute('data-size')).toBe(contract.members.actionBar.defaults.size);
      expect(bar().getAttribute('data-align')).toBe(contract.members.actionBar.defaults.align);
      expect(bar().hasAttribute('data-sticky')).toBe(false);
    });

    it('answers each axis the consumer states', async () => {
      fixture.componentInstance.variant.set('raised');
      fixture.componentInstance.align.set('center');
      fixture.componentInstance.sticky.set(true);
      await fixture.whenStable();

      expect(bar().getAttribute('data-variant')).toBe('raised');
      expect(bar().getAttribute('data-align')).toBe('center');
      expect(bar().getAttribute('data-sticky')).toBe('');
    });

    /** A bar that sizes itself sizes the buttons it holds, once. */
    it('hands its own step down to the buttons inside it', async () => {
      fixture.componentInstance.size.set('sm');
      await fixture.whenStable();

      const approve = [...bar().querySelectorAll('[data-ui="button"]')].at(-1) as HTMLElement;
      expect(approve.getAttribute('data-size')).toBe('sm');
      expect(contract.provides.buttonDefaults).toEqual(['size']);
    });
  });

  describe('presence', () => {
    it('paints the bar out once it has left, rather than leaving it reachable', async () => {
      fixture.componentInstance.present.set(false);
      await fixture.whenStable();

      /* The exit is held for the transition the stylesheet declares, and no
         stylesheet runs here — so what is waited on is the floor
         `@slotted/core/presence` puts under it rather than a duration. */
      await vi.waitFor(async () => {
        await fixture.whenStable();
        expect(bar().style.display).toBe('none');
      });
    });
  });

  it('declares no state model, because it holds no value', () => {
    expect('stateModel' in contract).toBe(false);
  });
});

describe('SlActionBar defaults', () => {
  @Component({
    standalone: true,
    imports: [SlActionBar, SlActionBarAction, SlActionBarActions, SlButton],
    template: `<div slActionBar aria-label="Actions">
      <div slActionBarActions>
        <div slActionBarAction><button slButton type="button">Save</button></div>
      </div>
    </div>`,
  })
  class Bare {}

  it('takes the application defaults, and lets the bar win over them', async () => {
    TestBed.configureTestingModule({
      imports: [Bare],
      providers: [provideActionBarDefaults({ align: 'center', sticky: true, variant: 'raised' })],
    });
    const fixture = TestBed.createComponent(Bare);
    fixture.autoDetectChanges();
    await fixture.whenStable();

    const bar = fixture.nativeElement.querySelector('[data-ui="action-bar"]') as HTMLElement;
    expect(bar.getAttribute('data-variant')).toBe('raised');
    expect(bar.getAttribute('data-align')).toBe('center');
    expect(bar.getAttribute('data-sticky')).toBe('');
  });
});

describe('SlActionBar role', () => {
  @Component({
    standalone: true,
    imports: [SlActionBar, SlActionBarActions],
    template: `<div slActionBar role="toolbar" aria-label="Actions">
      <div slActionBarActions></div>
    </div>`,
  })
  class Stated {}

  /** A consumer with ten icon-only actions may assert the composite themselves. */
  it('leaves a role the consumer wrote alone', async () => {
    TestBed.configureTestingModule({ imports: [Stated] });
    const fixture = TestBed.createComponent(Stated);
    fixture.autoDetectChanges();
    await fixture.whenStable();

    const bar = fixture.nativeElement.querySelector('[data-ui="action-bar"]') as HTMLElement;
    expect(bar.getAttribute('role')).toBe('toolbar');
  });
});
