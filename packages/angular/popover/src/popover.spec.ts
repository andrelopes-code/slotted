import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/popover/contract.json';
import { SlPopover } from './popover';
import { POPOVER_DEFAULTS, providePopoverDefaults } from './popover-defaults';
import {
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverClose,
  SlPopoverContent,
  SlPopoverDescription,
  SlPopoverFooter,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
  SlPopoverTrigger,
} from './popover-parts';

@Component({
  standalone: true,
  imports: [
    SlPopover,
    SlPopoverTrigger,
    SlPopoverLayer,
    SlPopoverContent,
    SlPopoverHeader,
    SlPopoverTitle,
    SlPopoverDescription,
    SlPopoverBody,
    SlPopoverFooter,
    SlPopoverClose,
    SlPopoverArrow,
  ],
  template: `
    <ng-container
      slPopover
      [(open)]="open"
      [disabled]="disabled()"
      [size]="size()"
      [autoFocus]="autoFocus()"
      [initialFocus]="initialFocus()"
      (openChangeRequest)="reasons.push($event.reason)"
    >
      <button slPopoverTrigger type="button">Filters</button>
      <ng-template slPopoverLayer>
        <div slPopoverContent>
          <div slPopoverHeader>
            <div slPopoverTitle>Filter invoices</div>
            <p slPopoverDescription>Applies to the current view only.</p>
            <button slPopoverClose></button>
          </div>
          <div slPopoverBody><input aria-label="Search" /></div>
          <div slPopoverFooter><button type="button">Apply</button></div>
        </div>
        <div slPopoverArrow></div>
      </ng-template>
    </ng-container>
  `,
})
class Host {
  readonly open = signal(false);
  readonly disabled = signal(false);
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly autoFocus = signal(true);
  readonly initialFocus = signal<string | undefined>(undefined);
  readonly reasons: string[] = [];
}

const layer = () => document.querySelector('[data-ui="popover"]');
const panel = () => document.querySelector('[role="dialog"]');
const guards = () => document.querySelectorAll('[data-part="focus-guard"]');

function trigger(fixture: ComponentFixture<Host>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('button');
}

/**
 * The positioner measures asynchronously, and the family waits for the first
 * measurement before it moves the focus — a layer still at the origin would
 * scroll the page to itself. Settling therefore takes two passes: one for the
 * template, one for the frame the measurement lands in.
 */
async function settle(fixture: ComponentFixture<unknown>) {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
  await fixture.whenStable();
}

@Component({
  standalone: true,
  imports: [SlPopover, SlPopoverTrigger, SlPopoverLayer, SlPopoverContent],
  template: `
    <ng-container slPopover [open]="true">
      <button slPopoverTrigger type="button">Preview</button>
      <ng-template slPopoverLayer>
        <div slPopoverContent role="presentation">Preview</div>
      </ng-template>
    </ng-container>
  `,
})
class RoleHost {}

/**
 * The consumer's explicit value wins, as `frameworks.md` requires of every
 * family: `slHoverCard` writes `presentation` on a card nothing can enter.
 */
describe('SlPopoverContent role', () => {
  it('lets the consumer\u2019s role win over dialog', async () => {
    await TestBed.configureTestingModule({ imports: [RoleHost] }).compileComponents();
    const fixture = TestBed.createComponent(RoleHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelector('[data-part="content"]')?.getAttribute('role')).toBe(
      'presentation',
    );
    fixture.destroy();
  });
});

describe('SlPopover', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    await settle(fixture);
  });

  it('builds nothing until it is opened', () => {
    expect(layer()).toBeNull();
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false');
    expect(trigger(fixture).getAttribute('aria-haspopup')).toBe('dialog');
  });

  /**
   * The stylesheet selects the arrow as a direct child of the layer, so an
   * arrow written inside the content is an unstyled div — which is what the
   * first rendered reference page showed, and no offline test could see.
   */
  it('keeps the arrow beside the content rather than inside it', async () => {
    fixture.componentInstance.open.set(true);
    await settle(fixture);

    const arrow = document.querySelector('[data-part="arrow"]');
    expect(arrow?.parentElement).toBe(layer() as HTMLElement);
  });

  it('renders every part the contract declares', async () => {
    fixture.componentInstance.open.set(true);
    await settle(fixture);

    const present = contract.members.popover.parts.filter(
      (part) => document.querySelector(`[data-part="${part}"]`) !== null,
    );
    expect(present).toEqual(contract.members.popover.parts);
  });

  it('opens from the trigger and says so on it', async () => {
    trigger(fixture).click();
    await settle(fixture);

    expect(layer()).not.toBeNull();
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('true');
    expect(trigger(fixture).getAttribute('aria-controls')).toBe(panel()?.id);
  });

  /**
   * An `aria-controls` naming an id that is not in the document references
   * nothing, so the trigger names the panel only while the panel exists.
   */
  it('names the panel in aria-controls only while the panel exists', async () => {
    expect(trigger(fixture).hasAttribute('aria-controls')).toBe(false);

    trigger(fixture).click();
    await settle(fixture);
    expect(trigger(fixture).getAttribute('aria-controls')).toBe(panel()?.id);

    trigger(fixture).click();
    for (let pass = 0; pass < 50 && layer() !== null; pass += 1) await settle(fixture);
    expect(layer()).toBeNull();
    expect(trigger(fixture).hasAttribute('aria-controls')).toBe(false);
  });

  it('names the panel from its title and describes it from its description', async () => {
    fixture.componentInstance.open.set(true);
    await settle(fixture);

    expect(panel()?.getAttribute('aria-labelledby')).toBe(
      document.querySelector('[data-part="title"]')?.id,
    );
    expect(panel()?.getAttribute('aria-describedby')).toBe(
      document.querySelector('[data-part="description"]')?.id,
    );
    expect(panel()?.getAttribute('aria-modal')).toBeNull();
  });

  it('takes the focus on open and gives it back on close', async () => {
    trigger(fixture).click();
    await settle(fixture);
    expect(document.activeElement).toBe(panel());

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(trigger(fixture));
  });

  it('focuses what initialFocus names instead', async () => {
    fixture.componentInstance.initialFocus.set('input');
    trigger(fixture).click();
    await settle(fixture);

    expect(document.activeElement).toBe(document.querySelector('input'));
  });

  it('leaves the focus alone when autoFocus is off', async () => {
    fixture.componentInstance.autoFocus.set(false);
    trigger(fixture).focus();
    trigger(fixture).click();
    await settle(fixture);

    expect(document.activeElement).toBe(trigger(fixture));
  });

  /**
   * The question every surveyed library leaves open: what Tab does at the edge
   * of a layer that lives at the end of the document and is not modal.
   */
  it('closes and returns focus when Tab reaches the edge of the layer', async () => {
    fixture.componentInstance.open.set(true);
    await settle(fixture);
    expect(guards().length).toBe(2);

    (guards()[1] as HTMLElement).dispatchEvent(new FocusEvent('focus'));
    await settle(fixture);

    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance.reasons).toContain('keyboard');
    expect(contract.focus.guards.emits).toBe('keyboard');
  });

  it('closes from the close control with the reason dismiss', async () => {
    fixture.componentInstance.open.set(true);
    await settle(fixture);

    const close = document.querySelector('[data-part="close"]') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Close');
    close.click();
    await settle(fixture);

    expect(fixture.componentInstance.reasons).toContain('dismiss');
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('closes on a press outside and not on one inside', async () => {
    fixture.componentInstance.open.set(true);
    await settle(fixture);

    (panel() as HTMLElement).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(true);

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance.reasons).toContain('outsidePress');
  });

  it('never opens while it is disabled', async () => {
    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.open.set(true);
    await settle(fixture);
    expect(layer()).toBeNull();
  });

  it('paints the axes the stylesheet reads', async () => {
    fixture.componentInstance.size.set('lg');
    fixture.componentInstance.open.set(true);
    await settle(fixture);

    expect(layer()?.getAttribute('data-size')).toBe('lg');
    expect(layer()?.getAttribute('data-width')).toBe('auto');
    expect(layer()?.getAttribute('data-align')).toBe('center');
  });
});

@Component({
  standalone: true,
  imports: [SlPopover, SlPopoverTrigger, SlPopoverLayer, SlPopoverContent, SlPopoverBody],
  template: `
    <ng-container slPopover [open]="true" [align]="align()" [flip]="false" [shift]="false">
      <button slPopoverTrigger type="button">Filters</button>
      <ng-template slPopoverLayer>
        <div slPopoverContent aria-label="Filters">
          <div slPopoverBody>Unpaid invoices.</div>
        </div>
      </ng-template>
    </ng-container>
  `,
})
class AlignHost {
  readonly align = signal<'start' | 'center' | 'end'>('start');
}

@Component({
  standalone: true,
  imports: [SlPopover, SlPopoverTrigger, SlPopoverLayer, SlPopoverContent, SlPopoverBody],
  template: `
    <ng-container slPopover defaultOpen>
      <button slPopoverTrigger type="button">Filters</button>
      <ng-template slPopoverLayer>
        <div slPopoverContent aria-label="Filters">
          <div slPopoverBody>Unpaid invoices.</div>
        </div>
      </ng-template>
    </ng-container>
  `,
})
class DefaultOpenHost {}

/** The contract's uncontrolled state is `defaultOpen`, as `slTooltip` reads it. */
describe('SlPopover defaultOpen', () => {
  it('starts open, and closes like any uncontrolled popover', async () => {
    await TestBed.configureTestingModule({ imports: [DefaultOpenHost] }).compileComponents();
    const fixture = TestBed.createComponent(DefaultOpenHost);
    for (let pass = 0; pass < 10 && layer() === null; pass += 1) {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(layer()).not.toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fixture.destroy();
  });
});

/**
 * The layer's padding is the gap around the panel, so a layer aligned to the
 * anchor's start edge would leave the panel one gap inside it. The layer moves
 * out by its own padding, and the panel's edge meets the anchor's. In jsdom
 * every rectangle is empty, so `left` is that offset alone.
 */
describe('SlPopover alignment', () => {
  it.each([
    ['start', '-8px'],
    ['center', '0px'],
    ['end', '8px'],
  ] as const)('lines the panel up with the anchor under align="%s"', async (align, left) => {
    const style = document.createElement('style');
    style.textContent = '[data-ui="popover"] { padding: 8px; }';
    document.head.append(style);

    await TestBed.configureTestingModule({ imports: [AlignHost] }).compileComponents();
    const fixture = TestBed.createComponent(AlignHost);
    fixture.componentInstance.align.set(align);
    for (
      let pass = 0;
      pass < 10 && (layer() as HTMLElement | null)?.style.left !== left;
      pass += 1
    ) {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    expect((layer() as HTMLElement | null)?.style.left).toBe(left);
    fixture.destroy();
    style.remove();
  });
});

describe('providePopoverDefaults', () => {
  it('sets the width once, and the close control speaks the language in force', async () => {
    const locale = signal('pt-BR');
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
        providePopoverDefaults({ width: 'anchor' }),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.open.set(true);
    await settle(fixture);

    const close = () => document.querySelector('[data-part="close"]')?.getAttribute('aria-label');
    // language: pt-BR
    expect(close()).toBe('Fechar');
    // language: en-US
    expect(layer()?.getAttribute('data-width')).toBe('anchor');

    locale.set('en-US');
    await settle(fixture);
    expect(close()).toBe('Close');
  });

  /** The arrow the consumer wrote is drawn only while `arrow` resolves to true. */
  it('draws no arrow when arrow is off', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [providePopoverDefaults({ arrow: false })],
    }).compileComponents();

    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.open.set(true);
    await settle(fixture);

    expect(layer()).not.toBeNull();
    expect(document.querySelector('[data-part="arrow"]')).toBeNull();
  });
});

@Component({
  standalone: true,
  imports: [SlPopover, SlPopoverTrigger, SlPopoverLayer, SlPopoverContent, SlPopoverClose],
  template: `
    <ng-container slPopover [(open)]="open">
      <button slPopoverTrigger type="button">Assign</button>
      <ng-template slPopoverLayer>
        <div slPopoverContent aria-label="Assign">
          <button slPopoverClose>Done</button>
          <button slPopoverClose data-testid="icon"><svg aria-hidden="true"></svg></button>
          <button slPopoverClose aria-label="Dismiss the panel" data-testid="named">Done</button>
        </div>
      </ng-template>
    </ng-container>
  `,
})
class CloseHost {
  readonly open = signal(true);
}

/**
 * The catalog's word names a close control that shows none of its own. A
 * button that says "Done" is announced "Done": an `aria-label` would replace
 * the text a sighted reader sees with a word they do not.
 */
describe('SlPopoverClose name', () => {
  it('writes the catalog label only on a close control with no text', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [CloseHost] }).compileComponents();
    const fixture = TestBed.createComponent(CloseHost);
    await settle(fixture);

    const closes = [...document.querySelectorAll('[data-part="close"]')];
    expect(closes).toHaveLength(3);
    const [text, icon, named] = closes;
    expect(text?.hasAttribute('aria-label')).toBe(false);
    expect(text?.textContent?.trim()).toBe('Done');
    expect(icon?.getAttribute('aria-label')).toBe('Close');
    expect(named?.getAttribute('aria-label')).toBe('Dismiss the panel');

    (text as HTMLButtonElement).click();
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
    fixture.destroy();
  });
});

@Component({
  standalone: true,
  imports: [SlPopover, SlPopoverTrigger, SlPopoverLayer, SlPopoverContent],
  template: `
    <ng-container slPopover [(open)]="open">
      <button slPopoverTrigger type="button" (click)="refuse() ? $event.preventDefault() : null">
        Filters
      </button>
      <ng-template slPopoverLayer>
        <div slPopoverContent aria-label="Filters">Body</div>
      </ng-template>
    </ng-container>
  `,
})
class RefusingTriggerHost {
  readonly open = signal(false);
  readonly refuse = signal(true);
}

/**
 * The consumer's own listener on the trigger runs before the family's, and a
 * `preventDefault` there keeps the popover where it is — as React's composed
 * handler does.
 */
describe('SlPopoverTrigger', () => {
  it('does not toggle when the consumer prevented the click', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [RefusingTriggerHost] }).compileComponents();
    const fixture = TestBed.createComponent(RefusingTriggerHost);
    await settle(fixture);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(layer()).toBeNull();

    fixture.componentInstance.refuse.set(false);
    button.click();
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(true);
    fixture.destroy();
  });
});

describe('providePopoverDefaults, nested', () => {
  it('writes what it states over the defaults already in force', async () => {
    @Component({
      standalone: true,
      providers: [providePopoverDefaults({ width: 'anchor' })],
      template: `<ng-container />`,
    })
    class Section {}

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Section],
      providers: [providePopoverDefaults({ size: 'lg', side: 'top' })],
    }).compileComponents();

    const section = TestBed.createComponent(Section);
    const defaults = section.debugElement.injector.get(POPOVER_DEFAULTS);
    expect(defaults.width).toBe('anchor');
    expect(defaults.size).toBe('lg');
    expect(defaults.side).toBe('top');
    expect(defaults.align).toBe('center');
    section.destroy();
  });
});
