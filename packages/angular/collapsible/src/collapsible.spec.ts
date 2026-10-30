import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ChangeRequest } from '@slotted/core/state';
import { SlAccordion } from '@slotted/angular/accordion';
import { SlCollapsible } from './collapsible';
import { provideCollapsibleDefaults } from './collapsible-defaults';
import {
  SlCollapsibleActions,
  SlCollapsibleContent,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from './collapsible-parts';

@Component({
  standalone: true,
  imports: [
    SlCollapsible,
    SlCollapsibleHeader,
    SlCollapsibleTrigger,
    SlCollapsibleActions,
    SlCollapsiblePanel,
  ],
  template: `<div
    slCollapsible
    [(open)]="open"
    [size]="size()"
    [variant]="variant()"
    [indicator]="indicator()"
    [level]="level()"
    [mount]="mount()"
    [disabled]="disabled()"
    [loading]="loading()"
    [region]="region()"
    (openChangeRequest)="requests.push($event)"
  >
    @if (heading()) {
      <h3 slCollapsibleHeader>
        <button slCollapsibleTrigger [description]="description()">Delivery</button>
      </h3>
    } @else {
      <div slCollapsibleHeader>
        <button slCollapsibleTrigger>Delivery</button>
      </div>
    }
    <div slCollapsibleActions><button type="button">Edit</button></div>
    <div slCollapsiblePanel>scheduled for September 12</div>
  </div>`,
})
class Host {
  readonly open = signal(false);
  readonly size = signal<'sm' | 'md' | 'lg' | undefined>(undefined);
  readonly variant = signal<'plain' | 'ruled' | 'framed' | undefined>(undefined);
  readonly indicator = signal<'chevron' | 'plus-minus' | 'none' | undefined>(undefined);
  readonly level = signal<'none' | '1' | '2' | '3' | '4' | '5' | '6' | undefined>(undefined);
  readonly mount = signal<'active' | 'lazy' | 'eager' | 'until-found' | undefined>(undefined);
  readonly disabled = signal<boolean | undefined>(undefined);
  readonly loading = signal(false);
  readonly region = signal(false);
  readonly heading = signal(true);
  readonly description = signal<string | undefined>(undefined);
  readonly requests: ChangeRequest<boolean>[] = [];
}

describe('SlCollapsible', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const root = () => fixture.nativeElement.querySelector('[data-ui="collapsible"]') as HTMLElement;
  const trigger = () => fixture.nativeElement.querySelector('[data-part="trigger"]') as HTMLElement;
  const panel = () => fixture.nativeElement.querySelector('[data-part="panel"]') as HTMLElement;
  const content = () => fixture.nativeElement.querySelector('[data-part="content"]');
  const header = () => fixture.nativeElement.querySelector('[data-part="header"]') as HTMLElement;
  const click = (detail = 1) => {
    trigger().dispatchEvent(new MouseEvent('click', { bubbles: true, detail }));
    fixture.detectChanges();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the anatomy the contract declares', () => {
    host.description.set('3 de 12 itens');
    fixture.detectChanges();

    for (const part of [
      'root',
      'header',
      'trigger',
      'indicator',
      'label',
      'description',
      'actions',
      'panel',
    ]) {
      expect(fixture.nativeElement.querySelector(`[data-part="${part}"]`)).not.toBeNull();
    }
    expect(header().tagName).toBe('H3');
  });

  it('wires the trigger to its panel both ways', () => {
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().getAttribute('aria-controls')).toBe(panel().getAttribute('id'));
    expect(panel().getAttribute('aria-labelledby')).toBe(trigger().getAttribute('id'));
  });

  /** The mark is the Glyph element, chosen from the indicator and the state. */
  it('draws the indicator glyph the indicator and the state select', () => {
    const glyph = () =>
      fixture.nativeElement
        .querySelector('[data-part="indicator"] > [data-ui="icon"] > svg[data-glyph]')
        ?.getAttribute('data-glyph');

    expect(glyph()).toBe('chevron-down');
    click();
    expect(glyph()).toBe('chevron-down');

    host.indicator.set('plus-minus');
    fixture.detectChanges();
    expect(glyph()).toBe('minus');
    click();
    expect(glyph()).toBe('plus');

    host.indicator.set('none');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-part="indicator"]')).toBeNull();
  });

  it('toggles from the platform, and reports which device asked', () => {
    click(1);
    expect(host.open()).toBe(true);
    expect(root().hasAttribute('data-open')).toBe(true);
    expect(host.requests.at(-1)?.reason).toBe('pointer');

    click(0);
    expect(host.open()).toBe(false);
    expect(host.requests.at(-1)?.reason).toBe('keyboard');
  });

  /** `model()` writes the change back, which is the guarantee this ecosystem expects. */
  it('writes the value back to the template that bound it', () => {
    host.open.set(true);
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('leaves the trigger in the page tab sequence', () => {
    expect(trigger().hasAttribute('tabindex')).toBe(false);
  });

  it('lets the request be refused before anything commits', () => {
    fixture.componentRef.instance.requests.length = 0;
    const collapsible = fixture.debugElement.children[0]?.injector.get(
      SlCollapsible,
    ) as SlCollapsible;
    collapsible.openChangeRequest.subscribe((request) => request.cancel());

    click();

    expect(host.open()).toBe(false);
  });

  describe('the heading the consumer wrote', () => {
    it('adds nothing to a native heading', () => {
      expect(header().hasAttribute('role')).toBe(false);
      expect(header().hasAttribute('aria-level')).toBe(false);
    });

    /**
     * "If the native host language has an element with an implicit heading and
     * aria-level … a native host language element may be used." Where the
     * consumer wrote something else, the role and the level are supplied.
     */
    it('supplies the role and the level to an element that is not one', () => {
      host.heading.set(false);
      host.level.set('4');
      fixture.detectChanges();

      expect(header().tagName).toBe('DIV');
      expect(header().getAttribute('role')).toBe('heading');
      expect(header().getAttribute('aria-level')).toBe('4');
    });

    it('writes no heading semantics at level none', () => {
      host.heading.set(false);
      host.level.set('none');
      fixture.detectChanges();

      expect(header().hasAttribute('role')).toBe(false);
    });
  });

  describe('mount', () => {
    it("drops the panel's content while closed under active, and keeps the box", () => {
      host.mount.set('active');
      fixture.detectChanges();

      expect(panel()).not.toBeNull();
      expect(content()).toBeNull();

      click();
      expect(content()).not.toBeNull();
    });

    it('builds the content on the first open and keeps it under lazy', () => {
      host.mount.set('lazy');
      fixture.detectChanges();
      expect(content()).toBeNull();

      click();
      click();
      expect(content()).not.toBeNull();
    });

    it('keeps a closed panel out of the tab sequence under eager', () => {
      expect(panel().hasAttribute('inert')).toBe(true);

      click();
      expect(panel().hasAttribute('inert')).toBe(false);
    });

    it('opens the panel the browser page search found', () => {
      host.mount.set('until-found');
      fixture.detectChanges();

      expect(panel().getAttribute('hidden')).toBe('until-found');

      panel().dispatchEvent(new Event('beforematch', { bubbles: true }));
      fixture.detectChanges();

      expect(host.open()).toBe(true);
      expect(host.requests.at(-1)?.reason).toBe('programmatic');
      expect(panel().hasAttribute('hidden')).toBe(false);
    });
  });

  it('reaches the trigger with the family disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    expect((trigger() as HTMLButtonElement).disabled).toBe(true);
    expect(root().hasAttribute('data-disabled')).toBe(true);
  });

  it('says the panel is busy while the content has not arrived', () => {
    host.loading.set(true);
    fixture.detectChanges();

    expect(root().hasAttribute('data-loading')).toBe(true);
    expect(panel().getAttribute('aria-busy')).toBe('true');
  });

  it('makes the panel a landmark only when the consumer asks', () => {
    expect(panel().hasAttribute('role')).toBe(false);

    host.region.set(true);
    fixture.detectChanges();
    expect(panel().getAttribute('role')).toBe('region');
  });

  it("lets the consumer's own value win over the provider", () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideCollapsibleDefaults({ size: 'sm', variant: 'framed' })],
    });
    const scoped = TestBed.createComponent(Host);
    scoped.componentInstance.size.set('lg');
    scoped.detectChanges();

    const element = scoped.nativeElement.querySelector('[data-ui="collapsible"]') as HTMLElement;
    expect(element.getAttribute('data-size')).toBe('lg');
    expect(element.getAttribute('data-variant')).toBe('framed');
  });
});

@Component({
  standalone: true,
  imports: [
    SlAccordion,
    SlCollapsible,
    SlCollapsibleHeader,
    SlCollapsibleTrigger,
    SlCollapsiblePanel,
    SlCollapsibleContent,
  ],
  template: `<div slAccordion [(value)]="value" [multiple]="multiple()" size="lg">
    @for (item of items(); track item) {
      <div slCollapsible [value]="item" mount="lazy">
        <h3 slCollapsibleHeader>
          <button slCollapsibleTrigger>{{ item }}</button>
        </h3>
        <div slCollapsiblePanel>
          <ng-template slCollapsibleContent>panel {{ item }}</ng-template>
        </div>
      </div>
    }
  </div>`,
})
class GroupHost {
  readonly items = signal(['a', 'b']);
  readonly value = signal<readonly string[]>([]);
  readonly multiple = signal(false);
}

describe('SlCollapsible inside a set', () => {
  it('takes its value from the set and its appearance with it', () => {
    const fixture = TestBed.createComponent(GroupHost);
    fixture.detectChanges();

    const items = [...fixture.nativeElement.querySelectorAll('[data-ui="collapsible"]')];
    expect(items[0].getAttribute('data-size')).toBe('lg');
    expect(items[0].getAttribute('data-variant')).toBe('ruled');

    const triggers = [...fixture.nativeElement.querySelectorAll('[data-part="trigger"]')];
    triggers[0].dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toEqual(['a']);
    expect(items[0].hasAttribute('data-open')).toBe(true);
  });

  /** `ng-content` is instantiated whether or not it is inserted; a template is not. */
  it('builds the deferred template only once the panel has opened', () => {
    const fixture = TestBed.createComponent(GroupHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('panel a');

    const triggers = [...fixture.nativeElement.querySelectorAll('[data-part="trigger"]')];
    triggers[0].dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('panel a');
  });
});
