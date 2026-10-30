import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlToolbar } from '@slotted/angular/toolbar';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/toggle-group/contract.json';
import { SlToggleGroup } from './toggle-group';
import { provideToggleGroupDefaults } from './toggle-group-defaults';
import { SlToggleGroupIcon, SlToggleGroupItem } from './toggle-group-parts';

@Component({
  standalone: true,
  imports: [SlToggleGroup, SlToggleGroupIcon, SlToggleGroupItem, SlToolbar],
  template: `<div slToggleGroup></div>`,
})
class Host {
  readonly requests: { value: readonly string[]; reason: string }[] = [];
  cancel = false;

  record(request: { value: readonly string[]; reason: string; cancel: () => void }) {
    this.requests.push({ value: request.value, reason: request.reason });
    if (this.cancel) request.cancel();
  }
}

function renderTemplate(template: string, providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  TestBed.overrideComponent(Host, { set: { template } });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

type Fixture = ReturnType<typeof renderTemplate>;

const group = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-ui="toggle-group"]') as HTMLElement;
const items = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="item"]')] as HTMLButtonElement[];

function click(element: HTMLElement, detail = 1) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
}

function press(element: HTMLElement, key: string) {
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }));
}

const RANGE = `<button slToggleGroupItem value="day">Day</button>
               <button slToggleGroupItem value="week">Week</button>
               <button slToggleGroupItem value="month">Month</button>`;

describe('SlToggleGroup', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(`<div slToggleGroup [defaultValue]="['week']">${RANGE}</div>`);

    expect(group(fixture).getAttribute('data-ui')).toBe(contract.ui);
    expect(group(fixture).getAttribute('data-part')).toBe('root');
    expect(group(fixture).getAttribute('role')).toBe('group');
    expect(items(fixture)[1]?.tagName).toBe('BUTTON');
    expect(items(fixture)[1]?.getAttribute('type')).toBe('button');
    expect(items(fixture)[1]?.querySelector('[data-part="label"]')?.textContent?.trim()).toBe(
      'Week',
    );
  });

  it('announces every item as a toggle, on and off alike', () => {
    const fixture = renderTemplate(`<div slToggleGroup [defaultValue]="['week']">${RANGE}</div>`);

    expect(items(fixture)[0]?.getAttribute('aria-pressed')).toBe('false');
    expect(items(fixture)[1]?.getAttribute('aria-pressed')).toBe('true');
    expect(items(fixture)[1]?.getAttribute('data-pressed')).toBe('');
    expect(items(fixture)[0]?.hasAttribute('data-pressed')).toBe(false);
  });

  it('holds one value at a time, and several when it is told to', () => {
    const single = renderTemplate(`<div slToggleGroup [defaultValue]="['day']">${RANGE}</div>`);
    click(items(single)[2] as HTMLElement);
    single.detectChanges();
    expect(items(single)[2]?.getAttribute('aria-pressed')).toBe('true');
    expect(items(single)[0]?.getAttribute('aria-pressed')).toBe('false');

    const many = renderTemplate(
      `<div slToggleGroup multiple [defaultValue]="['day']">${RANGE}</div>`,
    );
    click(items(many)[2] as HTMLElement);
    many.detectChanges();
    expect(items(many)[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(items(many)[2]?.getAttribute('aria-pressed')).toBe('true');
  });

  it('empties when the last one on is pressed again, unless it may not', () => {
    const open = renderTemplate(`<div slToggleGroup [defaultValue]="['day']">${RANGE}</div>`);
    click(items(open)[0] as HTMLElement);
    open.detectChanges();
    expect(items(open)[0]?.getAttribute('aria-pressed')).toBe('false');

    const held = renderTemplate(
      `<div slToggleGroup [deselectable]="false" [defaultValue]="['day']">${RANGE}</div>`,
    );
    click(items(held)[0] as HTMLElement);
    held.detectChanges();
    expect(items(held)[0]?.getAttribute('aria-pressed')).toBe('true');
  });

  it('says why the value moved, and lets a consumer refuse it', () => {
    const fixture = renderTemplate(
      `<div slToggleGroup [defaultValue]="['day']" (valueChange)="record($event)">${RANGE}</div>`,
    );

    click(items(fixture)[1] as HTMLElement, 1);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests[0]?.value).toEqual(['week']);
    expect(fixture.componentInstance.requests[0]?.reason).toBe('pointer');

    click(items(fixture)[2] as HTMLElement, 0);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests[1]?.reason).toBe('keyboard');

    fixture.componentInstance.cancel = true;
    click(items(fixture)[0] as HTMLElement);
    fixture.detectChanges();
    expect(items(fixture)[2]?.getAttribute('aria-pressed')).toBe('true');
  });

  it('asks and waits while a consumer owns the value', () => {
    const fixture = renderTemplate(
      `<div slToggleGroup [value]="['day']" (valueChange)="record($event)">${RANGE}</div>`,
    );

    click(items(fixture)[1] as HTMLElement);
    fixture.detectChanges();

    expect(fixture.componentInstance.requests).toHaveLength(1);
    expect(items(fixture)[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(items(fixture)[1]?.getAttribute('aria-pressed')).toBe('false');
  });

  /**
   * The group holds one tab stop however many items it has, and the arrows
   * move focus between them without toggling: an item is a button.
   */
  it('holds one tab stop and moves focus with the arrows, without toggling', () => {
    const fixture = renderTemplate(`<div slToggleGroup [defaultValue]="['day']">${RANGE}</div>`);

    expect(items(fixture)[0]?.getAttribute('tabindex')).toBe('0');
    expect(items(fixture)[1]?.getAttribute('tabindex')).toBe('-1');

    items(fixture)[0]?.focus();
    press(items(fixture)[0] as HTMLElement, 'ArrowRight');
    fixture.detectChanges();

    expect(document.activeElement).toBe(items(fixture)[1]);
    expect(items(fixture)[1]?.getAttribute('aria-pressed')).toBe('false');
    expect(items(fixture)[0]?.getAttribute('aria-pressed')).toBe('true');
  });

  it('wraps at the ends, and stops wrapping when it is told to', () => {
    const looping = renderTemplate(`<div slToggleGroup>${RANGE}</div>`);
    items(looping)[2]?.focus();
    press(items(looping)[2] as HTMLElement, 'ArrowRight');
    expect(document.activeElement).toBe(items(looping)[0]);

    const stopping = renderTemplate(`<div slToggleGroup [loop]="false">${RANGE}</div>`);
    items(stopping)[2]?.focus();
    press(items(stopping)[2] as HTMLElement, 'ArrowRight');
    expect(document.activeElement).toBe(items(stopping)[2]);
  });

  it('leaves the cross axis alone in a horizontal group and takes it in a vertical one', () => {
    const horizontal = renderTemplate(`<div slToggleGroup>${RANGE}</div>`);
    items(horizontal)[0]?.focus();
    press(items(horizontal)[0] as HTMLElement, 'ArrowDown');
    expect(document.activeElement).toBe(items(horizontal)[0]);

    const vertical = renderTemplate(`<div slToggleGroup orientation="vertical">${RANGE}</div>`);
    items(vertical)[0]?.focus();
    press(items(vertical)[0] as HTMLElement, 'ArrowDown');
    expect(document.activeElement).toBe(items(vertical)[1]);
    expect(group(vertical).getAttribute('aria-orientation')).toBe('vertical');
  });

  it('lets a consumer state the keyboard outright', () => {
    const fixture = renderTemplate(`<div slToggleGroup [rovingFocus]="false">${RANGE}</div>`);

    expect(items(fixture)[0]?.hasAttribute('tabindex')).toBe(false);
    expect(items(fixture)[1]?.hasAttribute('tabindex')).toBe(false);
  });

  it('disables every item when the group is disabled, and one when it is not', () => {
    const whole = renderTemplate(`<div slToggleGroup disabled>${RANGE}</div>`);
    for (const item of items(whole)) expect(item.disabled).toBe(true);

    const one = renderTemplate(
      `<div slToggleGroup>
         <button slToggleGroupItem value="day">Day</button>
         <button slToggleGroupItem value="week" disabled>Week</button>
       </div>`,
    );
    expect(items(one)[0]?.disabled).toBe(false);
    expect(items(one)[1]?.disabled).toBe(true);
    expect(items(one)[1]?.getAttribute('data-disabled')).toBe('');
  });

  it('lets an application state its axes once, and one group outrank it', () => {
    const fixture = renderTemplate(`<div slToggleGroup>${RANGE}</div>`, [
      provideToggleGroupDefaults({ attached: false, size: 'sm', variant: 'ghost' }),
    ]);

    expect(group(fixture).getAttribute('data-size')).toBe('sm');
    expect(group(fixture).getAttribute('data-variant')).toBe('ghost');
    expect(group(fixture).hasAttribute('data-attached')).toBe(false);

    const own = renderTemplate(`<div slToggleGroup size="lg">${RANGE}</div>`, [
      provideToggleGroupDefaults({ size: 'sm' }),
    ]);
    expect(group(own).getAttribute('data-size')).toBe('lg');
  });

  it('keeps a role the consumer wrote on the host', () => {
    const fixture = renderTemplate(`<div slToggleGroup role="toolbar">${RANGE}</div>`);

    expect(group(fixture).getAttribute('role')).toBe('toolbar');
  });

  it('names an item whose content is only a mark', () => {
    const fixture = renderTemplate(
      `<div slToggleGroup>
         <button slToggleGroupItem value="bold" aria-label="Negrito">
           <span slToggleGroupIcon></span>
         </button>
       </div>`,
    );

    expect(items(fixture)[0]?.getAttribute('aria-label')).toBe('Negrito');
    const icon = items(fixture)[0]?.querySelector('[data-part="icon"]');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });
});

@Component({
  standalone: true,
  imports: [SlToggleGroup, SlToggleGroupItem, SlField, SlFieldLabel],
  template: `<div slField>
    <label slFieldLabel>Categoria</label>
    <div slToggleGroup variant="chips" [defaultValue]="['Lazer']">
      <button slToggleGroupItem value="Casa">Casa</button>
      <button slToggleGroupItem value="Lazer">Lazer</button>
      <button slToggleGroupItem value="Outros" disabled>Outros</button>
    </div>
  </div>`,
})
class ChipsHost {}

describe('the chips variant', () => {
  it('draws separate chips with one pressed, never joined, named by the field label', () => {
    TestBed.configureTestingModule({ imports: [ChipsHost] });
    const fixture = TestBed.createComponent(ChipsHost);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[data-ui="toggle-group"]') as HTMLElement;
    const label = fixture.nativeElement.querySelector('[data-ui="field"] label') as HTMLElement;
    const items = [...root.querySelectorAll('button')] as HTMLButtonElement[];

    expect(root.getAttribute('data-variant')).toBe('chips');
    expect(root.hasAttribute('data-attached')).toBe(false);
    expect(root.getAttribute('aria-labelledby')).toBe(label.id);
    expect(items[1]?.getAttribute('aria-pressed')).toBe('true');
    expect(items[0]?.getAttribute('aria-pressed')).toBe('false');
    expect(items[2]?.disabled).toBe(true);
  });
});
