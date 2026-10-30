import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ChangeRequest } from '@slotted/core/state';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlAccordion } from './accordion';
import { provideAccordionDefaults } from './accordion-defaults';

@Component({
  standalone: true,
  imports: [
    SlAccordion,
    SlCollapsible,
    SlCollapsibleHeader,
    SlCollapsibleTrigger,
    SlCollapsiblePanel,
  ],
  template: `<div
    slAccordion
    #set="slAccordion"
    [(value)]="value"
    [multiple]="multiple()"
    [requireOpen]="requireOpen()"
    [disabled]="disabled()"
    [variant]="variant()"
    [headingLevel]="headingLevel()"
    [loop]="loop()"
    (valueChangeRequest)="requests.push($event)"
  >
    @for (item of items(); track item) {
      <div slCollapsible [value]="item">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>{{ item }}</button>
        </div>
        <div slCollapsiblePanel>panel {{ item }}</div>
      </div>
    }
  </div>`,
})
class Host {
  readonly set = viewChild.required<SlAccordion>('set');
  readonly items = signal(['delivery', 'payment', 'note']);
  readonly value = signal<readonly string[]>([]);
  readonly multiple = signal(false);
  readonly requireOpen = signal(false);
  readonly disabled = signal(false);
  readonly variant = signal<'plain' | 'ruled' | 'framed' | 'separated' | undefined>(undefined);
  readonly headingLevel = signal<'none' | '1' | '2' | '3' | '4' | '5' | '6' | undefined>(undefined);
  readonly loop = signal<boolean | undefined>(undefined);
  readonly requests: ChangeRequest<readonly string[]>[] = [];
}

describe('SlAccordion', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const query = (selector: string) =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll(selector)] as HTMLElement[];
  const root = () => fixture.nativeElement.querySelector('[data-ui="accordion"]') as HTMLElement;
  const items = () => query('[data-ui="collapsible"]');
  const triggers = () => query('[data-part="trigger"]');
  const openValues = () =>
    items()
      .filter((item) => item.hasAttribute('data-open'))
      .map((item) => item.getAttribute('data-value'));
  const click = (index: number) => {
    triggers()[index]?.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
  };
  const press = (index: number, key: string) => {
    triggers()[index]?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));
    fixture.detectChanges();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders its one part and holds the items as their own family', () => {
    expect(root().getAttribute('data-part')).toBe('root');
    expect(root().hasAttribute('role')).toBe(false);
    expect(items()).toHaveLength(3);
  });

  it('opens one panel at a time by default and closes the one that was', () => {
    click(0);
    expect(openValues()).toEqual(['delivery']);

    click(1);
    expect(openValues()).toEqual(['payment']);
    expect(host.requests.at(-1)?.reason).toBe('pointer');
  });

  it('keeps every open panel while several may be open', () => {
    host.multiple.set(true);
    fixture.detectChanges();

    click(0);
    click(1);

    expect(openValues()).toEqual(['delivery', 'payment']);
  });

  it('writes the value back to the template that bound it', () => {
    click(0);
    expect(host.value()).toEqual(['delivery']);
  });

  describe('requireOpen', () => {
    it('marks the header it refuses to let close, and refuses it', () => {
      host.requireOpen.set(true);
      fixture.detectChanges();
      click(0);

      expect(triggers()[0]?.getAttribute('aria-disabled')).toBe('true');
      expect(triggers()[1]?.hasAttribute('aria-disabled')).toBe(false);

      click(0);
      expect(openValues()).toEqual(['delivery']);
    });

    it('still moves the one open panel to another header', () => {
      host.requireOpen.set(true);
      fixture.detectChanges();
      click(0);
      click(2);

      expect(openValues()).toEqual(['note']);
    });
  });

  describe('keyboard', () => {
    it('leaves every header in the page tab sequence', () => {
      for (const trigger of triggers()) expect(trigger.hasAttribute('tabindex')).toBe(false);
    });

    it('moves focus with the arrows and opens nothing', () => {
      triggers()[0]?.focus();
      press(0, 'ArrowDown');

      expect(document.activeElement).toBe(triggers()[1]);
      expect(openValues()).toEqual([]);
    });

    it('reaches the first and last header', () => {
      press(1, 'End');
      expect(document.activeElement).toBe(triggers()[2]);

      press(2, 'Home');
      expect(document.activeElement).toBe(triggers()[0]);
    });

    it('wraps at the ends', () => {
      press(2, 'ArrowDown');
      expect(document.activeElement).toBe(triggers()[0]);
    });
  });

  it('hands each item the variant it maps onto', () => {
    for (const [variant, expected] of Object.entries({
      plain: 'plain',
      ruled: 'ruled',
      framed: 'ruled',
      separated: 'framed',
    })) {
      host.variant.set(variant as never);
      fixture.detectChanges();

      expect(root().getAttribute('data-variant')).toBe(variant);
      expect(items()[0]?.getAttribute('data-variant')).toBe(expected);
    }
  });

  it('reaches every item with the set disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    expect(root().hasAttribute('data-disabled')).toBe(true);
    for (const trigger of triggers()) {
      expect((trigger as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it('hands the heading level to every item that is not already a heading', () => {
    host.headingLevel.set('2');
    fixture.detectChanges();

    for (const header of query('[data-part="header"]')) {
      expect(header.getAttribute('role')).toBe('heading');
      expect(header.getAttribute('aria-level')).toBe('2');
    }
  });

  /** Angular Material's own pair, reached through `exportAs` rather than a handle. */
  describe('the imperative pair', () => {
    it('opens and closes every panel, with the reason programmatic', () => {
      host.multiple.set(true);
      fixture.detectChanges();

      host.set().openAll();
      fixture.detectChanges();
      expect(openValues()).toEqual(['delivery', 'payment', 'note']);
      expect(host.requests.at(-1)?.reason).toBe('programmatic');

      host.set().closeAll();
      fixture.detectChanges();
      expect(openValues()).toEqual([]);
    });

    it('opens only the first while one panel may be open', () => {
      host.set().openAll();
      fixture.detectChanges();

      expect(openValues()).toEqual(['delivery']);
    });

    it('leaves one open when the set may not empty', () => {
      host.multiple.set(true);
      host.requireOpen.set(true);
      fixture.detectChanges();

      host.set().openAll();
      fixture.detectChanges();
      host.set().closeAll();
      fixture.detectChanges();

      expect(openValues()).toEqual(['delivery']);
    });
  });

  it("lets the consumer's own value win over the provider", () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideAccordionDefaults({ size: 'sm', variant: 'separated' })],
    });
    const scoped = TestBed.createComponent(Host);
    scoped.detectChanges();

    const element = scoped.nativeElement.querySelector('[data-ui="accordion"]') as HTMLElement;
    expect(element.getAttribute('data-size')).toBe('sm');
    expect(element.getAttribute('data-variant')).toBe('separated');
  });
});
