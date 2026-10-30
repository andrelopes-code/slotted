import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/number-field/contract.json';
import { SlNumberField } from './number-field';
import { provideNumberFieldDefaults } from './number-field-defaults';
import { SlNumberFieldInput } from './number-field-input';
import { SlNumberFieldEnd, SlNumberFieldScrub, SlNumberFieldStart } from './number-field-parts';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlField,
    SlFieldError,
    SlFieldLabel,
    SlNumberField,
    SlNumberFieldEnd,
    SlNumberFieldInput,
    SlNumberFieldScrub,
    SlNumberFieldStart,
  ],
  template: `<div slNumberField></div>`,
})
class Host {
  readonly value = signal<number | null | undefined>(undefined);
  readonly seen = signal<ChangeRequest<number | null>[]>([]);
  readonly control = new FormControl<number | null>(12);

  record(request: ChangeRequest<number | null>) {
    this.seen.update((all) => [...all, request]);
    if (this.value() !== undefined) this.value.set(request.value);
  }

  refuse(request: ChangeRequest<number | null>) {
    request.cancel();
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

const query = (fixture: Fixture, selector: string) =>
  fixture.nativeElement.querySelector(selector) as HTMLElement;

const input = (fixture: Fixture) => query(fixture, '[data-part="input"]') as HTMLInputElement;
const stepper = (fixture: Fixture, part: 'increment' | 'decrement') =>
  query(fixture, `[data-part="${part}"]`) as HTMLButtonElement;

function type(element: HTMLInputElement, value: string) {
  element.value = value;
  element.dispatchEvent(new Event('input'));
}

/**
 * One character, put in at the caret, the way a keyboard puts it in. The whole
 * point of the caret rule is that it survives a sequence of these, which
 * setting the value whole cannot show.
 */
function keystroke(element: HTMLInputElement, character: string) {
  const at = element.selectionStart ?? element.value.length;
  element.value = element.value.slice(0, at) + character + element.value.slice(at);
  element.setSelectionRange(at + 1, at + 1);
  element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
}

/** A backward deletion of one character, already applied, the way a browser applies it. */
function backspace(element: HTMLInputElement, at: number) {
  element.value = element.value.slice(0, at - 1) + element.value.slice(at);
  element.setSelectionRange(at - 1, at - 1);
  element.dispatchEvent(
    new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }),
  );
}

function key(element: HTMLElement, init: KeyboardEventInit) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  element.dispatchEvent(event);
  return event;
}

function press(button: HTMLButtonElement) {
  button.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }),
  );
  button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
}

describe('SlNumberField', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(
      `<div slNumberField>
         <span slNumberFieldStart>R$</span>
         <input slNumberFieldInput defaultValue="1480" />
         <span slNumberFieldEnd>BRL</span>
       </div>`,
    );

    const root = query(fixture, '[data-ui="number-field"]');
    expect(root).toHaveProperty('tagName', 'DIV');
    expect(root.getAttribute('data-part')).toBe('root');
    expect(root.getAttribute('role')).toBeNull();
    expect(input(fixture).getAttribute('data-part')).toBe('input');
    expect(query(fixture, '[data-part="start"]').textContent).toBe('R$');
    expect(query(fixture, '[data-part="end"]').textContent).toBe('BRL');
    expect(query(fixture, '[data-part="stepper"]')).not.toBeNull();
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const fixture = renderTemplate(`<div slNumberField><input slNumberFieldInput /></div>`);
    const root = query(fixture, '[data-ui="number-field"]');

    expect(root.getAttribute('data-size')).toBe(contract.members.numberField.defaults.size);
    expect(root.getAttribute('data-variant')).toBe(contract.members.numberField.defaults.variant);
    expect(root.getAttribute('data-stepper')).toBe(contract.members.numberField.defaults.stepper);
  });

  /**
   * `type="number"` empties itself whenever the text is not a valid
   * floating-point number, so no grouping separator and no currency affix
   * survives it. The role is the APG's, applied to a text input.
   */
  it('holds the value in a text input carrying the spinbutton role', () => {
    const fixture = renderTemplate(
      `<div slNumberField><input slNumberFieldInput defaultValue="12" min="0" max="20" /></div>`,
    );

    expect(input(fixture).getAttribute('type')).toBe('text');
    expect(input(fixture).getAttribute('role')).toBe(contract.controlRole);
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('12');
    expect(input(fixture).getAttribute('aria-valuemin')).toBe('0');
    expect(input(fixture).getAttribute('aria-valuemax')).toBe('20');
    expect(input(fixture).getAttribute('aria-valuetext')).toBe('12');
  });

  it('formats the value for the locale it was given', () => {
    const fixture = renderTemplate(
      `<div slNumberField><input slNumberFieldInput defaultValue="1480.5" locale="pt-BR" /></div>`,
    );
    expect(input(fixture).value).toBe('1.480,5');
  });

  it('reads back a value pasted in the locale’s own writing', () => {
    const fixture = renderTemplate(
      `<div slNumberField>
         <input
           slNumberFieldInput
           locale="pt-BR"
           [format]="{ style: 'currency', currency: 'BRL' }"
           (valueChange)="record($event)"
         />
       </div>`,
    );

    type(input(fixture), 'R$ 1.480,00');
    expect(fixture.componentInstance.seen().at(-1)?.value).toBe(1480);
  });

  /**
   * Grouping is what makes a long number scannable, and the moment a reader
   * most needs to check a magnitude is the moment they are getting it wrong.
   * The family formatted only at the commit for its first release, which left
   * the reader looking at `1234567` until they tabbed away.
   */
  it('gives the text the locale’s shape on the keystroke that changed it', () => {
    const fixture = renderTemplate(
      `<div slNumberField><input slNumberFieldInput locale="en-US" /></div>`,
    );

    type(input(fixture), '1234');
    fixture.detectChanges();
    expect(input(fixture).value).toBe('1,234');

    /* Padding and rounding belong to the commit: the nought the reader has
       just typed is still theirs. */
    type(input(fixture), '1234.50');
    fixture.detectChanges();
    expect(input(fixture).value).toBe('1,234.50');
  });

  it('holds the reader’s own text until a commit when asked to', () => {
    const fixture = renderTemplate(
      `<div slNumberField><input slNumberFieldInput formatOn="commit" locale="en-US" /></div>`,
    );

    type(input(fixture), '1234.5');
    fixture.detectChanges();
    expect(input(fixture).value).toBe('1234.5');

    input(fixture).dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(input(fixture).value).toBe('1,234.5');
  });

  /**
   * The whole cost of formatting while typing. A separator appears between two
   * keystrokes and every string index after it moves, so a caret restored to
   * the index it was at lands on a different character and the next keystroke
   * goes in the wrong place — `1234` then `5` came out as `12,354`.
   */
  it('leaves the caret on the character it was on, not the index it was at', () => {
    const fixture = renderTemplate(
      `<div slNumberField><input slNumberFieldInput locale="en-US" /></div>`,
    );
    const element = input(fixture);
    /* The directive puts the caret back only in the control the reader is in. */
    element.focus();

    for (const character of '1234') keystroke(element, character);
    fixture.detectChanges();
    expect(element.value).toBe('1,234');
    expect(element.selectionStart).toBe(5);

    keystroke(element, '5');
    fixture.detectChanges();
    expect(element.value).toBe('12,345');
  });

  /**
   * Backspace against a separator the family inserted removes punctuation that
   * the next regrouping puts straight back, so the key does nothing and the
   * reader presses it twice to lose one digit. The digit they meant is taken
   * instead.
   */
  it('deletes the digit behind a grouping separator rather than the separator', () => {
    const fixture = renderTemplate(
      `<div slNumberField><input slNumberFieldInput defaultValue="1234" locale="en-US" /></div>`,
    );
    const element = input(fixture);
    element.focus();
    expect(element.value).toBe('1,234');

    /* The caret sits after the comma, so the browser removes the comma. */
    backspace(element, 2);
    fixture.detectChanges();

    expect(element.value).toBe('234');
    expect(element.selectionStart).toBe(0);
  });

  describe('the state model', () => {
    it('moves its own value when nobody owns it', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput defaultValue="4" /></div>`,
      );
      key(input(fixture), { key: 'ArrowUp' });
      fixture.detectChanges();
      expect(input(fixture).value).toBe('5');
    });

    it('never moves a value the consumer owns', () => {
      const fixture = renderTemplate(
        `<div slNumberField>
           <input slNumberFieldInput [value]="4" (valueChange)="seen.set([$event])" />
         </div>`,
      );

      key(input(fixture), { key: 'ArrowUp' });
      fixture.detectChanges();
      expect(fixture.componentInstance.seen().at(-1)?.value).toBe(5);
      expect(input(fixture).value).toBe('4');
    });

    it('takes the consumer’s new value back into the text', () => {
      const fixture = renderTemplate(
        `<div slNumberField>
           <input slNumberFieldInput [value]="value()" (valueChange)="record($event)" />
         </div>`,
      );
      fixture.componentInstance.value.set(4);
      fixture.detectChanges();

      key(input(fixture), { key: 'ArrowUp' });
      fixture.detectChanges();
      expect(input(fixture).value).toBe('5');
    });

    it('commits nothing when the request is refused', () => {
      const fixture = renderTemplate(
        `<div slNumberField>
           <input slNumberFieldInput defaultValue="4" (valueChange)="refuse($event)" />
         </div>`,
      );

      key(input(fixture), { key: 'ArrowUp' });
      fixture.detectChanges();
      expect(input(fixture).value).toBe('4');
    });

    it('emits only the reasons the contract declares', () => {
      const fixture = renderTemplate(
        `<div slNumberField>
           <input slNumberFieldInput defaultValue="4" max="10" (valueChange)="record($event)" />
         </div>`,
      );

      key(input(fixture), { key: 'ArrowUp' });
      press(stepper(fixture, 'increment'));
      fixture.detectChanges();
      type(input(fixture), '40');
      input(fixture).dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();

      const reasons = fixture.componentInstance.seen().map((request) => request.reason);
      expect(reasons).toContain('keyboard');
      expect(reasons).toContain('pointer');
      expect(reasons).toContain('blur');
      for (const reason of reasons) expect(contract.stateModel.value.reasons).toContain(reason);
    });
  });

  describe('the keyboard the pattern lists', () => {
    it('steps by one on the arrows, by the large amount with Shift and the small one with Alt', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput defaultValue="0" step="1" /></div>`,
      );

      key(input(fixture), { key: 'ArrowUp' });
      fixture.detectChanges();
      expect(input(fixture).value).toBe('1');

      key(input(fixture), { key: 'ArrowUp', shiftKey: true });
      fixture.detectChanges();
      expect(input(fixture).value).toBe('11');

      key(input(fixture), { key: 'ArrowDown', altKey: true });
      fixture.detectChanges();
      expect(input(fixture).value).toBe('10.9');
    });

    it('steps by the large amount on the page keys', () => {
      const fixture = renderTemplate(
        `<div slNumberField>
           <input slNumberFieldInput defaultValue="0" step="1" largeStep="25" />
         </div>`,
      );

      key(input(fixture), { key: 'PageUp' });
      fixture.detectChanges();
      expect(input(fixture).value).toBe('25');
      key(input(fixture), { key: 'PageDown' });
      fixture.detectChanges();
      expect(input(fixture).value).toBe('0');
    });

    it('reaches the bounds on Home and End, and only when they exist', () => {
      const bounded = renderTemplate(
        `<div slNumberField><input slNumberFieldInput defaultValue="5" min="2" max="80" /></div>`,
      );
      key(input(bounded), { key: 'Home' });
      bounded.detectChanges();
      expect(input(bounded).value).toBe('2');
      key(input(bounded), { key: 'End' });
      bounded.detectChanges();
      expect(input(bounded).value).toBe('80');

      const unbounded = renderTemplate(
        `<div slNumberField><input slNumberFieldInput defaultValue="5" /></div>`,
      );
      key(input(unbounded), { key: 'Home' });
      unbounded.detectChanges();
      expect(input(unbounded).value).toBe('5');
    });

    it('commits on Enter without intercepting the submit', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput max="10" locale="en-US" /></div>`,
      );

      type(input(fixture), '40');
      const event = key(input(fixture), { key: 'Enter' });
      fixture.detectChanges();
      expect(input(fixture).value).toBe('10');
      expect(event.defaultPrevented).toBe(false);
    });

    it('binds nothing to Escape', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput defaultValue="4" /></div>`,
      );
      const event = key(input(fixture), { key: 'Escape' });
      expect(event.defaultPrevented).toBe(false);
      expect(contract.escapeBound).toBe(false);
    });
  });

  describe('the two steppers', () => {
    it('keeps them out of the tab order and in the accessibility tree', () => {
      const fixture = renderTemplate(
        `<div slNumberField [messages]="{ increment: 'More', decrement: 'Less' }">
           <input slNumberFieldInput defaultValue="1" />
         </div>`,
      );

      for (const part of ['increment', 'decrement'] as const) {
        const button = stepper(fixture, part);
        expect(button.getAttribute('tabindex')).toBe(String(contract.stepperTabIndex));
        expect(button.getAttribute('type')).toBe('button');
      }
      expect(stepper(fixture, 'increment').getAttribute('aria-label')).toBe('More');
      expect(stepper(fixture, 'decrement').getAttribute('aria-label')).toBe('Less');
    });

    it('points each one at the control it moves', () => {
      const fixture = renderTemplate(
        `<div slField>
           <label slFieldLabel>Quantidade</label>
           <div slNumberField><input slNumberFieldInput defaultValue="1" /></div>
         </div>`,
      );
      expect(stepper(fixture, 'increment').getAttribute('aria-controls')).toBe(input(fixture).id);
    });

    it('disables the one that would leave the range', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput defaultValue="10" min="0" max="10" /></div>`,
      );
      expect(stepper(fixture, 'increment').disabled).toBe(true);
      expect(stepper(fixture, 'decrement').disabled).toBe(false);
    });

    it('disables both when the control cannot be changed', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput defaultValue="1" readOnly /></div>`,
      );
      expect(stepper(fixture, 'increment').disabled).toBe(true);
      expect(stepper(fixture, 'decrement').disabled).toBe(true);
    });

    it('returns focus to the value rather than keeping it on the button', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput defaultValue="1" /></div>`,
      );
      press(stepper(fixture, 'increment'));
      fixture.detectChanges();
      expect(document.activeElement).toBe(input(fixture));
      expect(input(fixture).value).toBe('2');
    });

    it('starts an empty control at the value it was told to start from', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput stepFrom="5" /></div>`,
      );
      press(stepper(fixture, 'increment'));
      fixture.detectChanges();
      expect(input(fixture).value).toBe('5');
    });

    it('renders the split arrangement in the order it is painted', () => {
      const fixture = renderTemplate(
        `<div slNumberField stepper="split"><input slNumberFieldInput defaultValue="3" /></div>`,
      );
      const root = query(fixture, '[data-ui="number-field"]');
      const parts = [...root.children].map((child) => child.getAttribute('data-part'));
      expect(parts).toEqual(['decrement', 'input', 'increment']);
    });

    it('draws a chevron in each stacked half and the minus and plus when split', () => {
      const glyph = (fixture: Fixture, part: 'increment' | 'decrement') =>
        stepper(fixture, part).querySelector('svg[data-glyph]')?.getAttribute('data-glyph');
      const stacked = renderTemplate(
        `<div slNumberField><input slNumberFieldInput defaultValue="3" /></div>`,
      );
      expect(glyph(stacked, 'increment')).toBe('chevron-down');
      expect(glyph(stacked, 'decrement')).toBe('chevron-down');

      const split = renderTemplate(
        `<div slNumberField stepper="split"><input slNumberFieldInput defaultValue="3" /></div>`,
      );
      expect(glyph(split, 'increment')).toBe('plus');
      expect(glyph(split, 'decrement')).toBe('minus');
    });

    it('withdraws them entirely when the arrangement says none', () => {
      const fixture = renderTemplate(
        `<div slNumberField stepper="none"><input slNumberFieldInput defaultValue="3" /></div>`,
      );
      expect(query(fixture, '[data-part="increment"]')).toBeNull();
    });
  });

  describe('the range policies', () => {
    it('returns a value outside the range at the commit', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput min="0" max="10" clamp="blur" /></div>`,
      );
      type(input(fixture), '40');
      input(fixture).dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      expect(input(fixture).value).toBe('10');
    });

    it('leaves a value outside the range where the reader put it', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput min="0" max="10" clamp="none" /></div>`,
      );
      type(input(fixture), '40');
      input(fixture).dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      expect(input(fixture).value).toBe('40');
    });

    it('reports a value it leaves outside the range as invalid', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput min="0" max="10" clamp="none" /></div>`,
      );
      type(input(fixture), '40');
      input(fixture).dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      expect(input(fixture).getAttribute('aria-invalid')).toBe('true');
      expect(query(fixture, '[data-ui="number-field"]').getAttribute('data-invalid')).toBe('');

      type(input(fixture), '5');
      fixture.detectChanges();
      expect(input(fixture).hasAttribute('aria-invalid')).toBe(false);
      expect(query(fixture, '[data-ui="number-field"]').hasAttribute('data-invalid')).toBe(false);
    });

    it('lets a stated [invalid]="false" win over the range report', () => {
      const fixture = renderTemplate(
        `<div slNumberField>
           <input slNumberFieldInput defaultValue="40" min="0" max="10" clamp="none" [invalid]="false" />
         </div>`,
      );
      expect(input(fixture).hasAttribute('aria-invalid')).toBe(false);
    });

    it('snaps to the multiples measured from the minimum when asked', () => {
      const fixture = renderTemplate(
        `<div slNumberField>
           <input slNumberFieldInput defaultValue="4" min="2" step="3" snapToStep />
         </div>`,
      );
      key(input(fixture), { key: 'ArrowUp' });
      fixture.detectChanges();
      expect(input(fixture).value).toBe('5');
    });

    it('commits a typed value to the nearest multiple, not one step past it', () => {
      const fixture = renderTemplate(
        `<div slNumberField>
           <input slNumberFieldInput min="2" step="3" snapToStep />
         </div>`,
      );
      type(input(fixture), '7');
      input(fixture).dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      expect(input(fixture).value).toBe('8');

      type(input(fixture), '11');
      input(fixture).dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      expect(input(fixture).value).toBe('11');
    });
  });

  describe('the field around it', () => {
    it('takes its identity, its description and its state without a wrapper', () => {
      const fixture = renderTemplate(
        `<div slField invalid required>
           <label slFieldLabel>Discount</label>
           <div slNumberField><input slNumberFieldInput defaultValue="120" /></div>
           <span slFieldError>The discount cannot exceed 100%.</span>
         </div>`,
      );

      const control = input(fixture);
      expect(control.id).not.toBe('');
      expect(query(fixture, '[data-part="label"]').getAttribute('for')).toBe(control.id);
      expect(control.getAttribute('aria-invalid')).toBe('true');
      expect(control.getAttribute('aria-required')).toBe('true');
      expect(control.getAttribute('aria-describedby')).toContain('-error');
      expect(query(fixture, '[data-ui="number-field"]').getAttribute('data-invalid')).toBe('');
    });

    it('never writes the native required attribute', () => {
      const fixture = renderTemplate(
        `<div slField required><div slNumberField><input slNumberFieldInput /></div></div>`,
      );
      expect(input(fixture).hasAttribute('required')).toBe(false);
      expect(contract.requiredAttribute).toBe('aria-required');
    });

    it('takes the field’s step before the application token’s', () => {
      const fixture = renderTemplate(
        `<div slField size="lg"><div slNumberField><input slNumberFieldInput /></div></div>`,
      );
      expect(query(fixture, '[data-ui="number-field"]').getAttribute('data-size')).toBe('lg');
    });
  });

  describe('forms', () => {
    it('belongs in a reactive form', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput [formControl]="control" /></div>`,
      );

      expect(input(fixture).value).toBe('12');

      key(input(fixture), { key: 'ArrowUp' });
      fixture.detectChanges();
      expect(fixture.componentInstance.control.value).toBe(13);

      fixture.componentInstance.control.setValue(40);
      fixture.detectChanges();
      expect(input(fixture).value).toBe('40');
    });

    it('takes its disabled state from the form as well as from the field', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput [formControl]="control" /></div>`,
      );
      fixture.componentInstance.control.disable();
      fixture.detectChanges();
      expect(input(fixture).hasAttribute('disabled')).toBe(true);
    });

    /**
     * The visible control holds the formatted string, so `name` moves to a
     * hidden input beside it: submitting `R$ 1.480,00` to a server expecting
     * `1480` is the defect this avoids.
     */
    it('submits the raw number rather than the formatted string', () => {
      const fixture = renderTemplate(
        `<div slNumberField>
           <input
             slNumberFieldInput
             name="amount"
             defaultValue="1480"
             locale="pt-BR"
             [format]="{ style: 'currency', currency: 'BRL' }"
           />
         </div>`,
      );

      expect(input(fixture).value).toContain('1.480,00');
      expect(input(fixture).hasAttribute('name')).toBe(false);
      const hidden = query(fixture, 'input[type="hidden"]') as HTMLInputElement;
      expect(hidden.getAttribute('name')).toBe('amount');
      expect(hidden.value).toBe('1480');
    });

    it('commits the number it shows, at the precision the format states', () => {
      const fixture = renderTemplate(
        `<div slNumberField>
           <input slNumberFieldInput name="amount" [format]="{ maximumFractionDigits: 2 }" />
         </div>`,
      );
      type(input(fixture), '10.555');
      input(fixture).dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      expect(input(fixture).value).toBe('10.56');
      expect((query(fixture, 'input[type="hidden"]') as HTMLInputElement).value).toBe('10.56');
      expect(input(fixture).getAttribute('aria-valuenow')).toBe('10.56');
    });
  });

  describe('what a consumer reaches past the inputs', () => {
    it('hands the instance and the element to a template', () => {
      const fixture = renderTemplate(
        `<div slNumberField>
           <input slNumberFieldInput #campo="slNumberFieldInput" defaultValue="4" />
         </div>`,
      );
      const directive = fixture.debugElement
        .query((node) => node.nativeElement === input(fixture))
        .injector.get(SlNumberFieldInput);

      expect(directive.inputElement).toBe(input(fixture));
      directive.increment();
      fixture.detectChanges();
      expect(input(fixture).value).toBe('5');
    });

    it('lets an application decide once what its number fields look like', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput defaultValue="1480.5" /></div>`,
        [provideNumberFieldDefaults({ stepper: 'split', variant: 'subtle' })],
      );

      const root = query(fixture, '[data-ui="number-field"]');
      expect(root.getAttribute('data-variant')).toBe('subtle');
      expect(root.getAttribute('data-stepper')).toBe('split');
    });

    it('writes and speaks in the language in force, and follows a change of it in place', () => {
      const locale = signal('pt-BR');
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput defaultValue="1480.5" /></div>`,
        [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
      );

      expect(input(fixture).value).toBe('1.480,5');
      expect(stepper(fixture, 'increment').getAttribute('aria-label')).toBe('Aumentar');

      locale.set('en-US');
      fixture.detectChanges();
      expect(stepper(fixture, 'increment').getAttribute('aria-label')).toBe('Increase');
      expect(stepper(fixture, 'decrement').getAttribute('aria-label')).toBe('Decrease');
    });

    it('lets a static attribute the consumer wrote survive the host bindings', () => {
      const fixture = renderTemplate(
        `<div slNumberField>
           <input slNumberFieldInput id="minha-quantidade" inputmode="numeric" />
         </div>`,
      );
      expect(input(fixture).id).toBe('minha-quantidade');
      expect(input(fixture).getAttribute('inputmode')).toBe('numeric');
    });
  });

  describe('the software keyboard', () => {
    it('asks for the keypad the format admits and never sniffs the device', () => {
      const integers = renderTemplate(
        `<div slNumberField>
           <input slNumberFieldInput min="0" [format]="{ maximumFractionDigits: 0 }" />
         </div>`,
      );
      expect(input(integers).getAttribute('inputmode')).toBe(contract.inputMode.integer);

      const fractional = renderTemplate(
        `<div slNumberField><input slNumberFieldInput min="0" /></div>`,
      );
      expect(input(fractional).getAttribute('inputmode')).toBe(contract.inputMode.fractional);

      const signed = renderTemplate(`<div slNumberField><input slNumberFieldInput /></div>`);
      expect(input(signed).getAttribute('inputmode')).toBe(contract.inputMode.negative);
    });
  });

  describe('the wheel', () => {
    it('does not move the value unless it was asked to', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput defaultValue="4" /></div>`,
      );
      input(fixture).focus();
      input(fixture).dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }));
      fixture.detectChanges();
      expect(input(fixture).value).toBe('4');
    });

    it('moves the value when it was, and only while the control has focus', () => {
      const fixture = renderTemplate(
        `<div slNumberField><input slNumberFieldInput defaultValue="4" wheel /></div>`,
      );

      input(fixture).dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }));
      fixture.detectChanges();
      expect(input(fixture).value).toBe('4');

      input(fixture).focus();
      input(fixture).dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }));
      fixture.detectChanges();
      expect(input(fixture).value).toBe('5');
    });
  });

  it('refuses a control written without the frame around it', () => {
    expect(() => renderTemplate(`<input slNumberFieldInput />`)).toThrow();
  });

  /**
   * A browser's own autofill, autocorrect and spelling suggestions have nothing
   * to offer a number, and all three would paint over a value the reader is
   * part way through typing.
   */
  it('turns off every suggestion the browser would make about a number', () => {
    const fixture = renderTemplate(
      `<div slNumberField><input slNumberFieldInput defaultValue="1" /></div>`,
    );
    expect(input(fixture).getAttribute('autocomplete')).toBe('off');
    expect(input(fixture).getAttribute('autocorrect')).toBe('off');
    expect(input(fixture).getAttribute('spellcheck')).toBe('false');
  });
});

describe('slNumberFieldScrub', () => {
  const scrubTemplate = (attributes = '', sensitivity = '') =>
    `<div slNumberField>
       <span slNumberFieldStart><span slNumberFieldScrub ${sensitivity}>L</span></span>
       <input slNumberFieldInput aria-label="Largura" ${attributes} (valueChange)="record($event)" />
     </div>`;
  const pointer = (type: string, init: PointerEventInit = {}) =>
    new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, ...init });
  const drag = (fixture: Fixture, from: number, ...moves: PointerEventInit[]) => {
    const part = query(fixture, '[data-part="scrub"]');
    part.dispatchEvent(pointer('pointerdown', { clientX: from }));
    for (const move of moves) part.dispatchEvent(pointer('pointermove', move));
    part.dispatchEvent(pointer('pointerup'));
    fixture.detectChanges();
  };

  it('moves the number one step per two pixels towards the inline end', () => {
    const fixture = renderTemplate(scrubTemplate('[defaultValue]="10"'));
    drag(fixture, 100, { clientX: 101 }, { clientX: 106 }, { clientX: 104 });
    expect(input(fixture).value).toBe('12');
    expect(fixture.componentInstance.seen().map(({ value, reason }) => [value, reason])).toEqual([
      [13, 'pointer'],
      [12, 'pointer'],
    ]);
  });

  it('takes its sensitivity and the large step under Shift', () => {
    const fixture = renderTemplate(
      scrubTemplate('[defaultValue]="0" [max]="100"', '[sensitivity]="10"'),
    );
    drag(fixture, 0, { clientX: 10, shiftKey: true }, { clientX: 200, shiftKey: true });
    expect(input(fixture).value).toBe('100');
  });

  it('marks the drag on the frame and on the part, and focuses the value', () => {
    const fixture = renderTemplate(scrubTemplate());
    const part = query(fixture, '[data-part="scrub"]');
    part.dispatchEvent(pointer('pointerdown', { clientX: 0 }));
    fixture.detectChanges();
    expect(query(fixture, '[data-ui="number-field"]').hasAttribute('data-scrubbing')).toBe(true);
    expect(part.hasAttribute('data-scrubbing')).toBe(true);
    expect(document.activeElement).toBe(input(fixture));
    part.dispatchEvent(pointer('pointerup'));
    fixture.detectChanges();
    expect(query(fixture, '[data-ui="number-field"]').hasAttribute('data-scrubbing')).toBe(false);
    expect(part.getAttribute('aria-hidden')).toBe('true');
  });

  it('does nothing on a read-only control', () => {
    const fixture = renderTemplate(scrubTemplate('[defaultValue]="5" readOnly'));
    drag(fixture, 0, { clientX: 40 });
    expect(input(fixture).value).toBe('5');
  });
});
