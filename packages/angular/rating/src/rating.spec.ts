import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/rating/contract.json';
import { SlRating, SlRatingCaption, SlRatingSymbol } from './rating';
import { provideRating, SlRatingIdFactory } from './rating-defaults';
import { SlRatingDisplay } from './rating-display';
import { SlRatingSummary } from './rating-summary';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlField,
    SlFieldLabel,
    SlRating,
    SlRatingCaption,
    SlRatingDisplay,
    SlRatingSummary,
    SlRatingSymbol,
  ],
  template: `<div slRating></div>`,
})
class Host {
  readonly control = new FormControl<number | null>(null);
  readonly requests: unknown[] = [];
  readonly previews: unknown[] = [];
  value: number | null = 4;
  levels: readonly number[] = [];
  counts: readonly number[] = [9, 18, 47, 158, 1052];
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

const root = (fixture: Fixture, selector = '[data-ui="rating"]') =>
  fixture.nativeElement.querySelector(selector) as HTMLElement;
const radios = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('input[data-part="input"]')] as HTMLInputElement[];
const radio = (fixture: Fixture, value: string) =>
  radios(fixture).find((input) => input.value === value) as HTMLInputElement;
const checkedValue = (fixture: Fixture) => radios(fixture).find((input) => input.checked)?.value;

function click(element: Element, detail = 1) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
}

function key(element: Element, name: string) {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event;
}

function pointer(element: Element, type: string, init: PointerEventInit = {}) {
  element.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...init }));
}

/** jsdom lays nothing out, so the row is given the box a browser would measure. */
function measureRow(fixture: Fixture, width = 100) {
  const row = root(fixture).querySelector('[data-part="symbols"]') as HTMLElement;
  row.getBoundingClientRect = () =>
    ({ x: 0, y: 0, left: 0, top: 0, width, height: 20, right: width, bottom: 20 }) as DOMRect;
  return row;
}

/** The family's own sentences are asserted in Brazilian Portuguese, the language the page is in. */
const PT = [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })];

describe('SlRating', () => {
  it('renders the harness anatomy: a radio group of items, each a radio, a symbol and a fill', () => {
    const fixture = renderTemplate(`<div slRating aria-label="Rating" [value]="4"></div>`, PT);
    const host = root(fixture);

    expect(host.getAttribute('data-part')).toBe('root');
    expect(host.getAttribute('role')).toBe(contract.rootRole.rating);
    expect(host.getAttribute('aria-label')).toBe('Rating');
    expect(host.getAttribute('data-max')).toBe('5');
    expect(host.getAttribute('data-step')).toBeNull();

    const items = [...host.querySelectorAll(':scope > [data-part="symbols"] > [data-part="item"]')];
    expect(items).toHaveLength(5);
    const item = items[0] as HTMLElement;
    expect([...item.children].map((child) => child.getAttribute('data-part'))).toEqual([
      'input',
      'symbol',
      'fill',
    ]);
    const glyph = item.querySelector('[data-part="symbol"] > [data-ui="icon"] > svg');
    expect(glyph?.getAttribute('data-glyph')).toBe('star');
    expect(item.querySelector('[data-part="fill"] svg')?.getAttribute('data-glyph')).toBe('star');

    expect(radios(fixture).map((input) => input.getAttribute('aria-label'))).toEqual([
      '1 de 5',
      '2 de 5',
      '3 de 5',
      '4 de 5',
      '5 de 5',
    ]);
    expect(radios(fixture).every((input) => input.type === 'radio')).toBe(true);
    expect(checkedValue(fixture)).toBe('4');
    expect(items[3]?.hasAttribute('data-checked')).toBe(true);
    expect(items[2]?.hasAttribute('data-checked')).toBe(false);
  });

  it('writes the contract’s defaults and the axes a consumer may style on', () => {
    const plain = renderTemplate(`<div slRating></div>`);
    const defaults = contract.members.rating.defaults;
    expect(root(plain).getAttribute('data-size')).toBe(defaults.size);
    expect(root(plain).getAttribute('data-tone')).toBe(defaults.tone);
    expect(radios(plain)).toHaveLength(defaults.max);

    const styled = renderTemplate(`<div slRating size="lg" tone="danger" [max]="10"></div>`);
    expect(root(styled).getAttribute('data-size')).toBe('lg');
    expect(root(styled).getAttribute('data-tone')).toBe('danger');
    expect(root(styled).getAttribute('data-max')).toBe('10');
    expect(radios(styled)).toHaveLength(10);
  });

  it('groups its radios by one name, generating one when the consumer writes none', () => {
    const generated = renderTemplate(`<div slRating></div>`);
    const names = new Set(radios(generated).map((input) => input.name));
    expect(names.size).toBe(1);
    expect([...names][0]).toMatch(/^slotted-rating-/);
    expect(contract.generatesName).toBe(true);

    const named = renderTemplate(`<div slRating name="rating" form="order"></div>`);
    for (const input of radios(named)) {
      expect(input.name).toBe('rating');
      expect(input.getAttribute('form')).toBe('order');
    }
  });

  it('draws a half step as two radios per item, the half first, named in the locale', () => {
    const fixture = renderTemplate(`<div slRating [step]="0.5" [value]="3.5"></div>`, PT);
    const items = [...root(fixture).querySelectorAll('[data-part="item"]')];

    expect(root(fixture).getAttribute('data-step')).toBe('0.5');
    expect(radios(fixture)).toHaveLength(10);
    const first = items[0]?.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    expect(first[0]?.hasAttribute(contract.halfAttribute)).toBe(true);
    expect(first[0]?.value).toBe('0.5');
    expect(first[1]?.hasAttribute(contract.halfAttribute)).toBe(false);
    expect(first[1]?.value).toBe('1');
    expect(radio(fixture, '3.5').getAttribute('aria-label')).toBe('3,5 de 5');
    expect(radio(fixture, '3.5').checked).toBe(true);
    expect(items[3]?.hasAttribute('data-checked')).toBe(true);
  });

  it('puts an out-of-range value on the grid of the scale', () => {
    const over = renderTemplate(`<div slRating [value]="7"></div>`);
    expect(checkedValue(over)).toBe('5');
    const between = renderTemplate(`<div slRating [value]="3.2"></div>`);
    expect(checkedValue(between)).toBe('4');
    const none = renderTemplate(`<div slRating [value]="-1"></div>`);
    expect(checkedValue(none)).toBeUndefined();
  });

  it('asks before it moves, with the pointer as the reason, and commits what nobody refused', () => {
    const fixture = renderTemplate(
      `<div slRating [(value)]="value" (valueChangeRequest)="requests.push($event)"></div>`,
    );

    click(radio(fixture, '2'));
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({
      previous: 4,
      reason: 'pointer',
      value: 2,
    });
    expect(fixture.componentInstance.value).toBe(2);
    expect(checkedValue(fixture)).toBe('2');
  });

  it('keeps the value when the request is cancelled, and writes every radio back', () => {
    const fixture = renderTemplate(
      `<div slRating [value]="4" (valueChangeRequest)="$event.cancel()"></div>`,
    );

    click(radio(fixture, '2'));
    fixture.detectChanges();
    expect(radio(fixture, '4').checked).toBe(true);
    expect(radio(fixture, '2').checked).toBe(false);
  });

  it('empties the value when the checked radio is pressed again, with the reason clear', () => {
    const fixture = renderTemplate(
      `<div slRating [(value)]="value" (valueChangeRequest)="requests.push($event)"></div>`,
    );

    click(radio(fixture, '4'));
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({
      previous: 4,
      reason: 'clear',
      value: null,
    });
    expect(fixture.componentInstance.value).toBeNull();
    expect(checkedValue(fixture)).toBeUndefined();
  });

  it('does not empty on a press of the checked radio when it is not clearable, nor on Space', () => {
    const fixed = renderTemplate(
      `<div slRating [value]="4" [clearable]="false" (valueChangeRequest)="requests.push($event)"></div>`,
    );
    click(radio(fixed, '4'));
    fixed.detectChanges();
    expect(fixed.componentInstance.requests).toHaveLength(0);
    expect(checkedValue(fixed)).toBe('4');

    const space = renderTemplate(
      `<div slRating [value]="4" (valueChangeRequest)="requests.push($event)"></div>`,
    );
    click(radio(space, '4'), 0);
    space.detectChanges();
    expect(space.componentInstance.requests).toHaveLength(0);
    expect(checkedValue(space)).toBe('4');
  });

  it('refuses the click while read-only, requests nothing, and stays focusable', () => {
    const fixture = renderTemplate(
      `<div slRating readOnly [value]="4" (valueChangeRequest)="requests.push($event)"></div>`,
    );
    const target = radio(fixture, '2');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 });
    target.dispatchEvent(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.requests).toHaveLength(0);
    expect(checkedValue(fixture)).toBe('4');
    expect(root(fixture).getAttribute('aria-readonly')).toBe('true');
    expect(root(fixture).hasAttribute('data-readonly')).toBe(true);
    expect(target.disabled).toBe(false);

    expect(key(radio(fixture, '4'), 'ArrowRight').defaultPrevented).toBe(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests).toHaveLength(0);
  });

  it('writes the states on the root and the radios', () => {
    const disabled = renderTemplate(`<div slRating disabled></div>`);
    expect(root(disabled).hasAttribute('data-disabled')).toBe(true);
    expect(radios(disabled).every((input) => input.disabled)).toBe(true);

    const invalid = renderTemplate(`<div slRating invalid required></div>`);
    expect(root(invalid).hasAttribute('data-invalid')).toBe(true);
    expect(root(invalid).getAttribute('aria-invalid')).toBe('true');
    expect(root(invalid).getAttribute('aria-required')).toBe('true');
    expect(radios(invalid).some((input) => input.required)).toBe(false);
  });

  it('moves by the family’s keys, stops at both ends and focuses the radio of the new value', () => {
    const fixture = renderTemplate(
      `<div slRating [(value)]="value" (valueChangeRequest)="requests.push($event)"></div>`,
    );
    const requests = fixture.componentInstance.requests;

    expect(key(radio(fixture, '4'), 'ArrowRight').defaultPrevented).toBe(true);
    fixture.detectChanges();
    expect(requests.at(-1)).toMatchObject({ value: 5, reason: 'keyboard' });
    expect(document.activeElement).toBe(radio(fixture, '5'));

    key(radio(fixture, '5'), 'ArrowUp');
    fixture.detectChanges();
    expect(requests).toHaveLength(1);
    expect(fixture.componentInstance.value).toBe(5);

    key(radio(fixture, '5'), 'Home');
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(1);
    expect(checkedValue(fixture)).toBe('1');

    key(radio(fixture, '1'), 'ArrowLeft');
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(1);

    key(radio(fixture, '1'), 'End');
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(5);

    key(radio(fixture, '5'), 'ArrowDown');
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(4);
    expect(contract.wraps).toBe(false);
  });

  it('empties on Backspace and Delete when clearable, keeping focus where it was', () => {
    const fixture = renderTemplate(
      `<div slRating [(value)]="value" (valueChangeRequest)="requests.push($event)"></div>`,
    );
    const target = radio(fixture, '4');
    target.focus();

    key(target, 'Backspace');
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({
      value: null,
      reason: 'clear',
    });
    expect(checkedValue(fixture)).toBeUndefined();
    expect(document.activeElement).toBe(target);

    const fixed = renderTemplate(
      `<div slRating [value]="4" [clearable]="false" (valueChangeRequest)="requests.push($event)"></div>`,
    );
    expect(key(radio(fixed, '4'), 'Delete').defaultPrevented).toBe(false);
    expect(fixed.componentInstance.requests).toHaveLength(0);
  });

  it('reverses the inline arrows in a right-to-left document', () => {
    const fixture = renderTemplate(`<div slRating style="direction: rtl" [(value)]="value"></div>`);
    key(radio(fixture, '4'), 'ArrowRight');
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(3);
  });

  it('reads a finger dragged along the row, only when the value changes, and marks the drag', () => {
    const fixture = renderTemplate(
      `<div slRating [(value)]="value" (valueChangeRequest)="requests.push($event)"></div>`,
    );
    const row = measureRow(fixture);
    const requests = fixture.componentInstance.requests;

    pointer(row, 'pointerdown', { pointerType: 'touch', pointerId: 1, clientX: 70 });
    fixture.detectChanges();
    expect(root(fixture).hasAttribute('data-dragging')).toBe(true);

    pointer(row, 'pointermove', { pointerType: 'touch', pointerId: 1, clientX: 25 });
    fixture.detectChanges();
    expect(requests.at(-1)).toMatchObject({ value: 2, reason: 'pointer' });

    pointer(row, 'pointermove', { pointerType: 'touch', pointerId: 1, clientX: 30 });
    fixture.detectChanges();
    expect(requests).toHaveLength(1);

    pointer(row, 'pointerup', { pointerType: 'touch', pointerId: 1, clientX: 30 });
    fixture.detectChanges();
    expect(root(fixture).hasAttribute('data-dragging')).toBe(false);
    expect(fixture.componentInstance.value).toBe(2);
    expect(checkedValue(fixture)).toBe('2');

    /* The click the platform sends after the gesture does not undo it. */
    click(radio(fixture, '4'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(2);
    expect(checkedValue(fixture)).toBe('2');
  });

  it('answers a tap without a drag as a press', () => {
    const fixture = renderTemplate(`<div slRating [(value)]="value"></div>`);
    const row = measureRow(fixture);

    pointer(row, 'pointerdown', { pointerType: 'pen', pointerId: 2, clientX: 50 });
    pointer(row, 'pointerup', { pointerType: 'pen', pointerId: 2, clientX: 50 });
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(3);
  });

  it('does not scrub with a mouse', () => {
    const fixture = renderTemplate(`<div slRating [(value)]="value"></div>`);
    const row = measureRow(fixture);

    pointer(row, 'pointerdown', { pointerType: 'mouse', pointerId: 3, clientX: 10 });
    pointer(row, 'pointermove', { pointerType: 'mouse', pointerId: 3, clientX: 30 });
    fixture.detectChanges();
    expect(root(fixture).hasAttribute('data-dragging')).toBe(false);
    expect(fixture.componentInstance.value).toBe(4);
  });

  it('previews the value under the pointer, then nothing when it leaves', () => {
    const fixture = renderTemplate(
      `<div slRating [value]="2" (previewChange)="previews.push($event)">
         <ng-template slRatingCaption let-value="value" let-preview="preview">
           {{ preview ?? value ?? 'No rating' }}
         </ng-template>
       </div>`,
    );
    const caption = () =>
      root(fixture).querySelector(':scope > [data-part="value"]')?.textContent?.trim();

    expect(caption()).toBe('2');
    expect(root(fixture).querySelector('[data-part="value"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    );

    pointer(radio(fixture, '5'), 'pointerover', { pointerType: 'mouse' });
    fixture.detectChanges();
    expect(fixture.componentInstance.previews).toEqual([5]);
    expect(caption()).toBe('5');

    pointer(root(fixture), 'pointerleave', { pointerType: 'mouse', bubbles: false });
    fixture.detectChanges();
    expect(fixture.componentInstance.previews).toEqual([5, null]);
    expect(caption()).toBe('2');
  });

  it('projects a static caption into the value part', () => {
    const fixture = renderTemplate(
      `<div slRating><span slRatingCaption>Toque numa estrela</span></div>`,
    );
    expect(root(fixture).querySelector('[data-part="value"]')?.textContent).toContain(
      'Toque numa estrela',
    );
  });

  it('omits the value part when there is no caption', () => {
    const fixture = renderTemplate(`<div slRating></div>`);
    expect(root(fixture).querySelector('[data-part="value"]')).toBeNull();
  });

  it('lets a template replace the symbol, with its index and its fill', () => {
    const fixture = renderTemplate(
      `<div slRating [value]="2">
         <ng-template slRatingSymbol let-index="index" let-fill="fill">
           <b class="heart">{{ index }}:{{ fill }}</b>
         </ng-template>
       </div>`,
    );
    const hearts = [...root(fixture).querySelectorAll('[data-part="symbol"] .heart')];
    expect(hearts.map((heart) => heart.textContent)).toEqual(['0:1', '1:1', '2:0', '3:0', '4:0']);
    expect(root(fixture).querySelector('[data-part="symbol"] [data-ui="icon"]')).toBeNull();
  });

  it('focuses the checked radio, or the first, through its instance', () => {
    const fixture = renderTemplate(
      `<div slRating #rating="slRating" [value]="3"></div>
       <div slRating #empty="slRating" class="empty"></div>
       <button type="button" (click)="rating.focus(); empty.focus()">focar</button>`,
    );
    const instance = fixture.debugElement.children[0]?.references['rating'] as SlRating;
    instance.focus();
    expect(document.activeElement).toBe(radio(fixture, '3'));

    const other = fixture.debugElement.children[1]?.references['empty'] as SlRating;
    other.focus();
    const first = fixture.nativeElement.querySelector('.empty input') as HTMLInputElement;
    expect(document.activeElement).toBe(first);
  });

  it('takes its state from the field around it', () => {
    const fixture = renderTemplate(
      `<div slField invalid required readOnly size="sm">
         <label slFieldLabel>Nota</label>
         <div slRating></div>
       </div>`,
    );
    expect(root(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(root(fixture).getAttribute('aria-required')).toBe('true');
    expect(root(fixture).getAttribute('aria-readonly')).toBe('true');
    expect(root(fixture).getAttribute('data-size')).toBe('sm');
  });

  it('lets an application decide once, and an instance still win', () => {
    const fixture = renderTemplate(
      `<div slRating class="a"></div><div slRating class="b" size="sm" [max]="3"></div>`,
      [provideRating({ size: 'lg', tone: 'accent', max: 10, clearable: false }), ...PT],
    );
    const a = root(fixture, '.a');
    const b = root(fixture, '.b');
    expect(a.getAttribute('data-size')).toBe('lg');
    expect(a.getAttribute('data-tone')).toBe('accent');
    expect(a.querySelectorAll('input')).toHaveLength(10);
    expect(a.querySelector('input')?.getAttribute('aria-label')).toBe('1 de 10');
    expect(b.getAttribute('data-size')).toBe('sm');
    expect(b.querySelectorAll('input')).toHaveLength(3);
  });

  it('lays a partial message record from the instance over the language in force', () => {
    const fixture = renderTemplate(
      `<div slRating [messages]="{ itemLabel: 'Nota {value} de {max}' }" [step]="0.5"></div>`,
      PT,
    );
    expect(radio(fixture, '2.5').getAttribute('aria-label')).toBe('Nota 2,5 de 5');
  });

  /** The integration point React has no equivalent of. */
  it('belongs in a reactive form, and owns the required validity', () => {
    const fixture = renderTemplate(`<div slRating required [formControl]="control"></div>`);
    const host = fixture.componentInstance;

    expect(host.control.errors).toEqual({ required: true });

    click(radio(fixture, '3'));
    fixture.detectChanges();
    expect(host.control.value).toBe(3);
    expect(host.control.errors).toBeNull();

    host.control.setValue(5);
    fixture.detectChanges();
    expect(checkedValue(fixture)).toBe('5');

    host.control.setValue(null);
    fixture.detectChanges();
    expect(checkedValue(fixture)).toBeUndefined();
    expect(host.control.errors).toEqual({ required: true });

    host.control.disable();
    fixture.detectChanges();
    expect(radios(fixture).every((input) => input.disabled)).toBe(true);
    expect(root(fixture).hasAttribute('data-disabled')).toBe(true);
  });

  it('marks a form control touched when a radio loses focus', () => {
    const fixture = renderTemplate(`<div slRating [formControl]="control"></div>`);
    expect(fixture.componentInstance.control.touched).toBe(false);
    radio(fixture, '1').dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.touched).toBe(true);
  });
});

describe('SlRatingDisplay', () => {
  const display = (fixture: Fixture) => root(fixture, '[slRatingDisplay]');
  const fills = (fixture: Fixture) =>
    [...display(fixture).querySelectorAll('[data-part="item"]')].map((item) =>
      (item as HTMLElement).style.getPropertyValue(contract.fillProperty),
    );

  it('is an image named by its value and count, with a fill per symbol', () => {
    const fixture = renderTemplate(`<div slRatingDisplay [value]="4.6" [count]="1284"></div>`, PT);
    const host = display(fixture);

    expect(host.getAttribute('data-ui')).toBe('rating');
    expect(host.getAttribute('data-part')).toBe('root');
    expect(host.getAttribute('role')).toBe(contract.rootRole.ratingDisplay);
    // language: pt-BR
    expect(host.getAttribute('aria-label')).toBe('Avaliação 4,6 de 5, 1.284 avaliações');
    // language: en-US
    expect(host.getAttribute('data-size')).toBe('md');
    expect(host.getAttribute('data-tone')).toBe('warning');
    expect(host.getAttribute('data-variant')).toBeNull();
    expect(fills(fixture)).toEqual(['1', '1', '1', '1', '0.6']);
    expect(host.querySelector('input')).toBeNull();
    expect(host.querySelector(':scope > [data-part="value"]')?.textContent).toBe('4,6');
    expect(host.querySelector(':scope > [data-part="count"]')?.textContent).toBe('(1.284)');
    expect(host.querySelector('[data-part="value"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('names itself without a count, and hides the number when asked', () => {
    const fixture = renderTemplate(
      `<div slRatingDisplay [value]="3" [showValue]="false" size="sm" tone="accent"></div>`,
      PT,
    );
    // language: pt-BR
    expect(display(fixture).getAttribute('aria-label')).toBe('Avaliação 3 de 5');
    // language: en-US
    expect(display(fixture).querySelector('[data-part="value"]')).toBeNull();
    expect(display(fixture).querySelector('[data-part="count"]')).toBeNull();
    expect(display(fixture).getAttribute('data-size')).toBe('sm');
    expect(display(fixture).getAttribute('data-tone')).toBe('accent');
  });

  it('keeps a label the consumer wrote', () => {
    const fixture = renderTemplate(
      `<div slRatingDisplay aria-label="Average 4.7 of 5" [value]="4.7"></div>`,
    );
    expect(display(fixture).getAttribute('aria-label')).toBe('Average 4.7 of 5');
  });

  it('draws one lit symbol in the compact variant', () => {
    const fixture = renderTemplate(
      `<div slRatingDisplay variant="compact" [value]="3.3" [count]="87"></div>`,
      PT,
    );
    expect(display(fixture).getAttribute('data-variant')).toBe('compact');
    expect(fills(fixture)).toEqual(['1']);
    expect(display(fixture).querySelector('[data-part="count"]')?.textContent).toBe('(87)');
  });

  it('draws a histogram whose bars are each level over the largest', () => {
    const fixture = renderTemplate(
      `<div slRatingDisplay variant="histogram" [value]="3.3" [count]="8" [distribution]="[3, 0, 1, 0, 4]"></div>`,
      PT,
    );
    const host = display(fixture);
    const bars = [...host.querySelectorAll('[data-part="histogram"] > [data-part="bar"]')].map(
      (bar) => (bar as HTMLElement).style.getPropertyValue(contract.shareProperty),
    );

    expect(host.getAttribute('data-variant')).toBe('histogram');
    expect(fills(fixture)).toEqual(['1']);
    expect(bars).toEqual(['0.75', '0', '0.25', '0', '1']);
    expect(host.tagName).toBe('DIV');
    expect(host.querySelector(':scope > [data-part="symbols"]')?.tagName).toBe('DIV');
    expect(host.querySelector('[data-part="histogram"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector(':scope > [data-part="count"]')?.textContent).toBe('8');
    expect([...host.children].map((child) => child.getAttribute('data-part'))).toEqual([
      'symbols',
      'value',
      'histogram',
      'count',
    ]);
  });
});

/**
 * Every story on a Storybook docs page is its own application, and two
 * applications counting from one gave two ratings one name — checking a star
 * in one unchecked the other, because radios group by name across a document.
 */
describe('SlRatingIdFactory', () => {
  it('never repeats a name across two applications in one page', () => {
    const first = new SlRatingIdFactory().next();
    const second = new SlRatingIdFactory().next();

    expect(first).not.toBe(second);
  });
});

describe('rating messages', () => {
  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(`<div slRatingDisplay [value]="3" [count]="0"></div>`, [
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);
    const label = () => root(fixture, '[slRatingDisplay]').getAttribute('aria-label');
    /* CLDR files nought under `one` in Portuguese: the exact branch is read first. */
    // language: pt-BR
    expect(label()).toBe('Avaliação 3 de 5, 0 avaliações');
    // language: en-US

    locale.set('en-US');
    fixture.detectChanges();
    expect(label()).toBe('Rated 3 out of 5, 0 ratings');
  });

  it('writes the singular for one', () => {
    const fixture = renderTemplate(
      `<div slRatingDisplay [value]="5" [count]="1"></div>
       <section slRatingSummary [counts]="[1, 0, 0, 0, 0]"></section>`,
      PT,
    );
    expect(root(fixture, '[slRatingDisplay]').getAttribute('aria-label')).toBe(
      // language: pt-BR
      'Avaliação 5 de 5, 1 avaliação',
      // language: en-US
    );
    const summary = root(fixture, '[slRatingSummary]');
    expect(
      summary.querySelector('[data-part="aggregate"] > [data-part="count"]')?.textContent,
      // language: pt-BR
    ).toBe('Com base em 1 avaliação');
    expect(summary.querySelectorAll('[data-part="level"]')[4]?.getAttribute('aria-label')).toBe(
      '1 estrela: 1 avaliação, 100%',
      // language: en-US
    );
  });
});

describe('SlRatingSummary', () => {
  const summary = (fixture: Fixture) => root(fixture, '[slRatingSummary]');
  const levels = (fixture: Fixture) =>
    [...summary(fixture).querySelectorAll('[data-part="level"]')] as HTMLElement[];
  const columns = (fixture: Fixture) =>
    [...summary(fixture).querySelectorAll('[data-part="column"]')] as HTMLElement[];

  it('draws the aggregate and one bar per level, highest first', () => {
    const fixture = renderTemplate(
      `<section slRatingSummary aria-label="Customer reviews" [counts]="counts"></section>`,
      PT,
    );
    const host = summary(fixture);

    expect(host.tagName).toBe('SECTION');
    expect(host.getAttribute('data-ui')).toBe('rating');
    expect(host.getAttribute('data-part')).toBe('root');
    expect(host.getAttribute('data-variant')).toBe('summary');
    expect(host.getAttribute('data-size')).toBe('md');
    expect(host.getAttribute('data-tone')).toBe('warning');

    const aggregate = host.querySelector(':scope > [data-part="aggregate"]') as HTMLElement;
    expect(aggregate.querySelector(':scope > [data-part="value"]')?.textContent).toBe('4,7');
    expect(aggregate.querySelector(':scope > [data-part="scale"]')?.textContent).toBe('de 5');
    const stars = aggregate.querySelector('[role="img"]') as HTMLElement;
    // language: pt-BR
    expect(stars.getAttribute('aria-label')).toBe('Avaliação 4,7 de 5');
    // language: en-US
    expect(stars.getAttribute('data-size')).toBe('sm');
    expect(aggregate.querySelector(':scope > [data-part="count"]')?.textContent).toBe(
      // language: pt-BR
      'Com base em 1.284 avaliações',
      // language: en-US
    );
    /* The conclusion belongs to the spectrum, which draws the spread it is read from. */
    expect(contract.insight.shownIn).toBe('spectrum');
    expect(aggregate.querySelector('[data-part="insight"]')).toBeNull();

    const list = host.querySelector(':scope > ul[data-part="distribution"]') as HTMLElement;
    // language: pt-BR
    expect(list.getAttribute('aria-label')).toBe('Distribuição por estrelas');
    // language: en-US
    const rows = levels(fixture);
    expect(rows).toHaveLength(5);
    expect(rows[0]?.tagName).toBe('DIV');
    expect(rows[0]?.getAttribute('role')).toBe('group');
    // language: pt-BR
    expect(rows[0]?.getAttribute('aria-label')).toBe('5 estrelas: 1.052 avaliações, 82%');
    // language: en-US
    expect(rows[0]?.querySelector('[data-part="level-label"] > span')?.textContent).toBe('5');
    expect(
      rows[0]?.querySelector('[data-part="level-label"] svg')?.getAttribute('data-glyph'),
    ).toBe('star');
    expect(rows[0]?.querySelector('[data-part="track"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(
      (rows[0]?.querySelector('[data-part="indicator"]') as HTMLElement).style.getPropertyValue(
        contract.shareProperty,
      ),
    ).toBe('0.8193');
    expect(rows[0]?.querySelector('[data-part="level-count"]')?.textContent).toBe('1.052');
    // language: pt-BR
    expect(rows[4]?.getAttribute('aria-label')).toBe('1 estrela: 9 avaliações, 1%');
    // language: en-US
  });

  it('omits the figure and the scale, and the conclusion, when nothing has been rated', () => {
    const fixture = renderTemplate(
      `<section slRatingSummary [counts]="[0, 0, 0, 0, 0]"></section>`,
      PT,
    );
    const aggregate = summary(fixture).querySelector('[data-part="aggregate"]') as HTMLElement;

    expect(aggregate.querySelector('[data-part="value"]')).toBeNull();
    expect(aggregate.querySelector('[data-part="scale"]')).toBeNull();
    expect(aggregate.querySelector('[data-part="insight"]')).toBeNull();
    expect(aggregate.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      // language: pt-BR
      'Avaliação 0 de 5',
      // language: en-US
    );
    expect(aggregate.querySelector('[data-part="count"]')?.textContent).toBe(
      // language: pt-BR
      'Ainda sem avaliações',
    );
    expect(levels(fixture)[0]?.getAttribute('aria-label')).toBe('5 estrelas: 0 avaliações, 0%');
    // language: en-US
  });

  it('hides the conclusion when asked', () => {
    const fixture = renderTemplate(
      `<section slRatingSummary variant="spectrum" [counts]="counts" [showInsight]="false"></section>`,
    );
    expect(summary(fixture).querySelector('[data-part="insight"]')).toBeNull();
  });

  it('draws the conclusion from thresholds an application or an instance moves', () => {
    const fixture = renderTemplate(
      `<section slRatingSummary variant="spectrum" class="a" [counts]="counts"></section>
       <section slRatingSummary variant="spectrum" class="b" [counts]="counts" [insightThresholds]="{ consensus: 0.99 }"></section>`,
      [provideRating({ insightThresholds: { few: 5000 } }), ...PT],
    );
    // language: pt-BR
    expect(root(fixture, '.a [data-part="insight"]').textContent).toBe('Poucas avaliações');
    expect(root(fixture, '.a [data-part="insight"]').getAttribute('data-tone')).toBe('secondary');
    expect(root(fixture, '.b [data-part="insight"]').textContent).toBe('Poucas avaliações');
    // language: en-US
  });

  it('filters by level: pressed buttons, disabled at zero, asking before it moves', () => {
    const fixture = renderTemplate(
      `<section
         slRatingSummary
         filterable
         [counts]="[3, 0, 1, 0, 4]"
         [(selectedLevels)]="levels"
         (selectedLevelsChangeRequest)="requests.push($event)"
       ></section>`,
      PT,
    );
    const rows = levels(fixture);

    expect(rows.every((row) => row.tagName === 'BUTTON')).toBe(true);
    expect(rows.map((row) => row.getAttribute('aria-pressed'))).toEqual([
      'false',
      'false',
      'false',
      'false',
      'false',
    ]);
    expect(rows.map((row) => (row as HTMLButtonElement).disabled)).toEqual([
      false,
      true,
      false,
      true,
      false,
    ]);

    click(rows[0] as HTMLElement);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({
      previous: [],
      value: [5],
      reason: 'pointer',
    });
    expect(fixture.componentInstance.levels).toEqual([5]);
    expect(levels(fixture)[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(levels(fixture)[0]?.hasAttribute('data-pressed')).toBe(true);

    click(levels(fixture)[4] as HTMLElement, 0);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({
      value: [1, 5],
      reason: 'keyboard',
    });

    click(levels(fixture)[0] as HTMLElement);
    fixture.detectChanges();
    expect(fixture.componentInstance.levels).toEqual([1]);
    expect(levels(fixture)[0]?.hasAttribute('data-pressed')).toBe(false);
  });

  it('keeps the selection when the request is cancelled', () => {
    const fixture = renderTemplate(
      `<section slRatingSummary filterable [counts]="counts" (selectedLevelsChangeRequest)="$event.cancel()"></section>`,
    );
    click(levels(fixture)[0] as HTMLElement);
    fixture.detectChanges();
    expect(levels(fixture)[0]?.getAttribute('aria-pressed')).toBe('false');
  });

  it('draws the spectrum: columns lowest first, the mean on the host, an axis and the buckets', () => {
    const fixture = renderTemplate(
      `<section slRatingSummary variant="spectrum" filterable [counts]="counts"></section>`,
      PT,
    );
    const host = summary(fixture);

    expect(host.getAttribute('data-variant')).toBe('spectrum');
    expect(host.style.getPropertyValue('--slotted-rating-mean')).toBe('4.734');
    expect(host.style.getPropertyValue('--slotted-rating-low')).toBe('4.697');
    expect(host.style.getPropertyValue('--slotted-rating-high')).toBe('4.77');

    const aggregate = host.querySelector(':scope > [data-part="aggregate"]') as HTMLElement;
    expect([...aggregate.children].map((child) => child.getAttribute('data-part'))).toEqual([
      'value',
      'scale',
      'insight',
      'count',
    ]);
    expect(aggregate.querySelector('[data-part="count"]')?.textContent).toBe(
      // language: pt-BR
      '1.284 avaliações · margem de ± 0,04',
      // language: en-US
    );

    const cols = columns(fixture);
    expect(cols.map((column) => column.tagName)).toEqual(Array(5).fill('BUTTON'));
    expect(cols.map((column) => column.style.getPropertyValue(contract.shareProperty))).toEqual([
      '0.0086',
      '0.0171',
      '0.0447',
      '0.1502',
      '1',
    ]);
    // language: pt-BR
    expect(cols[0]?.getAttribute('aria-label')).toBe('1 estrela: 9 avaliações, 1%');
    // language: en-US
    expect(cols[0]?.querySelector('[data-part="bar"]')).not.toBeNull();

    const field = host.querySelector('[data-part="plot"] > [data-part="field"]') as HTMLElement;
    expect([...field.children].map((child) => child.getAttribute('data-part'))).toEqual([
      'columns',
      'interval',
      'mean',
    ]);
    expect(field.querySelector('[data-part="mean-label"]')?.textContent).toBe('4,7');

    const ticks = [...host.querySelectorAll('[data-part="axis"] > [data-part="tick"]')];
    expect(host.querySelector('[data-part="axis"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(
      ticks.map((tick) => tick.querySelector('[data-part="tick-share"]')?.textContent),
    ).toEqual(['1%', '1%', '4%', '12%', '82%']);

    const buckets = [...host.querySelectorAll('[data-part="sentiment"] > [data-part="bucket"]')];
    expect(buckets.map((bucket) => bucket.getAttribute('data-tone'))).toEqual([
      'success',
      'secondary',
      'danger',
    ]);
    expect(buckets.map((bucket) => bucket.textContent)).toEqual([
      '94% positivas',
      '4% neutras',
      '2% negativas',
    ]);
    expect(buckets[0]?.querySelector('strong')?.textContent).toBe('94%');
  });

  it('says an uncertain mean in words, and rounds a half share away from nought', () => {
    const fixture = renderTemplate(
      `<section slRatingSummary variant="spectrum" [counts]="[3, 0, 1, 0, 4]"></section>`,
      PT,
    );
    const host = summary(fixture);

    expect(host.querySelector('[data-part="count"]')?.textContent).toBe(
      // language: pt-BR
      '8 avaliações · média incerta, entre 2,0 e 4,5',
      // language: en-US
    );
    expect(host.querySelector('[data-part="insight"]')?.getAttribute('data-tone')).toBe('warning');
    expect(columns(fixture).map((column) => column.tagName)).toEqual(Array(5).fill('DIV'));
    expect(columns(fixture)[0]?.getAttribute('role')).toBe('group');
    // language: pt-BR
    expect(columns(fixture)[2]?.getAttribute('aria-label')).toBe('3 estrelas: 1 avaliação, 13%');
    // language: en-US
    expect(
      [...host.querySelectorAll('[data-part="bucket"] strong')].map((node) => node.textContent),
    ).toEqual(['50%', '13%', '38%']);
  });

  it('draws an empty spectrum without a figure, a mean or a conclusion', () => {
    const fixture = renderTemplate(
      `<section slRatingSummary variant="spectrum" [counts]="[0, 0, 0, 0, 0]"></section>`,
      PT,
    );
    const host = summary(fixture);
    expect(host.querySelector('[data-part="value"]')).toBeNull();
    expect(host.querySelector('[data-part="scale"]')).toBeNull();
    expect(host.querySelector('[data-part="insight"]')).toBeNull();
    expect(host.querySelector('[data-part="mean"]')).toBeNull();
    expect(host.style.getPropertyValue('--slotted-rating-mean')).toBe('');
    // language: pt-BR
    expect(host.querySelector('[data-part="count"]')?.textContent).toBe('Ainda sem avaliações');
    // language: en-US
  });

  it('reads counts against the scale: missing levels are zero, extra ones are dropped', () => {
    const fixture = renderTemplate(
      `<section slRatingSummary [max]="3" [counts]="[1, 2, 3, 4]"></section>`,
    );
    expect(levels(fixture)).toHaveLength(3);
  });
});
