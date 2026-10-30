import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldCounter, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/text-field/contract.json';
import { SlTextField } from './text-field';
import { provideTextFieldDefaults } from './text-field-defaults';
import { SlTextFieldInput } from './text-field-input';
import { SlTextFieldAction, SlTextFieldEnd, SlTextFieldStart } from './text-field-parts';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlField,
    SlFieldCounter,
    SlFieldError,
    SlFieldLabel,
    SlTextField,
    SlTextFieldAction,
    SlTextFieldEnd,
    SlTextFieldInput,
    SlTextFieldStart,
  ],
  template: `<div slTextField></div>`,
})
class Host {
  readonly value = signal<string | undefined>(undefined);
  readonly loading = signal<boolean | undefined>(true);
  readonly kind = signal('password');
  readonly copies: unknown[] = [];
  readonly clicks: unknown[] = [];
  readonly control = new FormControl('Ada');
}

function renderTemplate(template: string, providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  TestBed.overrideComponent(Host, { set: { template } });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

const query = (fixture: ReturnType<typeof renderTemplate>, selector: string) =>
  fixture.nativeElement.querySelector(selector) as HTMLElement;

const input = (fixture: ReturnType<typeof renderTemplate>) =>
  query(fixture, '[data-part="input"]') as HTMLInputElement;

function type(element: HTMLInputElement, value: string) {
  element.value = value;
  element.dispatchEvent(new Event('input'));
}

describe('SlTextField', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(
      `<div slTextField clearable>
         <span slTextFieldStart>R$</span>
         <input slTextFieldInput defaultValue="1.480,00" />
         <span slTextFieldEnd>BRL</span>
       </div>`,
    );

    const root = query(fixture, '[data-ui="text-field"]');
    expect(root).toHaveProperty('tagName', 'DIV');
    expect(root.getAttribute('data-part')).toBe('root');
    expect(root.getAttribute('role')).toBeNull();
    expect(input(fixture).getAttribute('data-part')).toBe('input');
    expect(query(fixture, '[data-part="start"]').textContent).toBe('R$');
    expect(query(fixture, '[data-part="end"]').textContent).toBe('BRL');
    expect(query(fixture, '[data-part="clear"] svg[data-glyph="x"]')).not.toBeNull();
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const fixture = renderTemplate(`<div slTextField><input slTextFieldInput /></div>`);
    const root = query(fixture, '[data-ui="text-field"]');
    const defaults = contract.members.textField.defaults;

    expect(root.getAttribute('data-size')).toBe(defaults.size);
    expect(root.getAttribute('data-variant')).toBe(defaults.variant);
    expect(root.getAttribute('data-mono')).toBeNull();
  });

  /**
   * A host binding beats a static attribute in Angular, so every written value
   * is read before the binding computes — the rule `SlFieldControl` records.
   */
  it('leaves every native attribute the consumer wrote on the element', () => {
    const fixture = renderTemplate(
      `<div slTextField>
         <input
           slTextFieldInput
           type="email"
           autocomplete="email"
           inputmode="email"
           enterkeyhint="send"
           maxlength="64"
           name="email"
           required
           spellcheck="false"
         />
       </div>`,
    );

    const element = input(fixture);
    expect(element.getAttribute('type')).toBe('email');
    expect(element.getAttribute('autocomplete')).toBe('email');
    expect(element.getAttribute('inputmode')).toBe('email');
    expect(element.getAttribute('enterkeyhint')).toBe('send');
    expect(element.getAttribute('maxlength')).toBe('64');
    expect(element.getAttribute('name')).toBe('email');
    expect(element.getAttribute('spellcheck')).toBe('false');
    expect(element.hasAttribute('required')).toBe(true);
  });

  /* ------------------------------------------------------------- value - */

  it('asks to move rather than announcing that it moved, with a reason', () => {
    const requests: { value: string; reason: string; previous: string }[] = [];
    const fixture = renderTemplate(
      `<div slTextField><input slTextFieldInput (valueChange)="0" /></div>`,
    );
    const directive = fixture.debugElement
      .query((node: { nativeElement: Element }) => node.nativeElement.matches?.('input'))
      .injector.get(SlTextFieldInput);
    directive.valueChange.subscribe((request) =>
      requests.push({ value: request.value, reason: request.reason, previous: request.previous }),
    );

    type(input(fixture), 'nota');
    fixture.detectChanges();

    expect(requests).toEqual([{ value: 'nota', reason: 'keyboard', previous: '' }]);
    expect(contract.stateModel.value.reasons).toContain('keyboard');
  });

  it('starts an uncontrolled control from the value it was given', () => {
    const fixture = renderTemplate(
      `<div slTextField><input slTextFieldInput defaultValue="Ada" /></div>`,
    );
    expect(input(fixture).value).toBe('Ada');
  });

  it('writes a consumer’s own value onto the element', () => {
    const fixture = renderTemplate(
      `<div slTextField><input slTextFieldInput [value]="value()" /></div>`,
    );
    fixture.componentInstance.value.set('fixo');
    fixture.detectChanges();
    expect(input(fixture).value).toBe('fixo');
  });

  /* ------------------------------------------------------------- forms - */

  it('belongs in a reactive form, and reports touched on blur', () => {
    const fixture = renderTemplate(
      `<div slTextField><input slTextFieldInput [formControl]="control" /></div>`,
    );
    const element = input(fixture);
    expect(element.value).toBe('Ada');

    type(element, 'Ada Lovelace');
    expect(fixture.componentInstance.control.value).toBe('Ada Lovelace');

    element.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);

    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(element.hasAttribute('disabled')).toBe(true);
  });

  /* ------------------------------------------------------------- clear - */

  it('clears the value, says why, and returns focus to the control', () => {
    const fixture = renderTemplate(
      `<div slTextField clearable><input slTextFieldInput defaultValue="Ada" /></div>`,
    );

    const button = query(fixture, '[data-part="clear"]') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(input(fixture).value).toBe('');
    expect(document.activeElement).toBe(input(fixture));
    expect(query(fixture, '[data-part="clear"]').hidden).toBe(true);
  });

  it('draws no clear button for a control the reader cannot change', () => {
    const fixture = renderTemplate(
      `<div slTextField clearable><input slTextFieldInput defaultValue="Ada" readonly /></div>`,
    );
    expect(query(fixture, '[data-part="clear"]').hidden).toBe(true);
  });

  /* ------------------------------------------------------------ reveal - */

  it('turns a password into characters without changing what the button is called', () => {
    const fixture = renderTemplate(
      `<div slTextField revealable><input slTextFieldInput type="password" defaultValue="segredo" /></div>`,
    );

    const button = query(fixture, '[data-part="reveal"]') as HTMLButtonElement;
    const label = button.getAttribute('aria-label');
    expect(input(fixture).getAttribute('type')).toBe('password');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(query(fixture, '[data-part="reveal"] svg[data-glyph]').getAttribute('data-glyph')).toBe(
      'eye',
    );

    button.click();
    fixture.detectChanges();

    expect(input(fixture).getAttribute('type')).toBe('text');
    expect(query(fixture, '[data-part="reveal"]').getAttribute('aria-pressed')).toBe('true');
    expect(query(fixture, '[data-part="reveal"]').getAttribute('aria-label')).toBe(label);
    /* A revealed value is one a press will hide: the glyph is the crossed eye. */
    expect(query(fixture, '[data-part="reveal"] svg[data-glyph]').getAttribute('data-glyph')).toBe(
      'eye-off',
    );
  });

  it('reads a bound type as it reads a written one', () => {
    const fixture = renderTemplate(
      `<div slTextField revealable><input slTextFieldInput [type]="kind()" /></div>`,
    );
    expect(input(fixture).getAttribute('type')).toBe('password');
    (query(fixture, '[data-part="reveal"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(input(fixture).getAttribute('type')).toBe('text');

    fixture.componentInstance.kind.set('email');
    fixture.detectChanges();
    expect(query(fixture, '[data-part="reveal"]')).toBeNull();
    expect(input(fixture).getAttribute('type')).toBe('email');
  });

  it('offers no reveal toggle on a control that is not a password', () => {
    const fixture = renderTemplate(
      `<div slTextField revealable><input slTextFieldInput type="text" /></div>`,
    );
    expect(query(fixture, '[data-part="reveal"]')).toBeNull();
  });

  /* ------------------------------------------------------------- field - */

  it('takes its identifier, description and state from the field around it', () => {
    const fixture = renderTemplate(
      `<div slField invalid readOnly required>
         <label slFieldLabel>EIN</label>
         <div slTextField><input slTextFieldInput /></div>
         <span slFieldError>Six digits missing.</span>
       </div>`,
    );

    const element = input(fixture);
    const label = query(fixture, 'label');
    expect(label.getAttribute('for')).toBe(element.getAttribute('id'));
    expect(element.getAttribute('aria-invalid')).toBe('true');
    expect(element.getAttribute('aria-required')).toBe('true');
    expect(element.hasAttribute('readonly')).toBe(true);
    /* `aria-required` and never the native attribute, which would engage
       browser constraint validation and change submit behavior. */
    expect(element.hasAttribute('required')).toBe(false);
    expect(element.getAttribute('aria-describedby')).toContain('-error');
    expect(query(fixture, '[data-ui="text-field"]').hasAttribute('data-invalid')).toBe(true);
    expect(query(fixture, '[data-ui="text-field"]').hasAttribute('data-readonly')).toBe(true);
  });

  it('takes its step from the field rather than from the token', () => {
    const fixture = renderTemplate(
      `<div slField size="sm"><div slTextField><input slTextFieldInput /></div></div>
       <div slTextField data-testid="loose"><input slTextFieldInput /></div>`,
      [provideTextFieldDefaults({ size: 'lg', variant: 'subtle' })],
    );

    expect(
      query(fixture, '[data-ui="field"] [data-ui="text-field"]').getAttribute('data-size'),
    ).toBe('sm');
    expect(query(fixture, '[data-testid="loose"]').getAttribute('data-size')).toBe('lg');
    expect(query(fixture, '[data-testid="loose"]').getAttribute('data-variant')).toBe('subtle');
  });

  /* -------------------------------------------------------------- count - */

  it('publishes its count and lets the field draw it', () => {
    const fixture = renderTemplate(
      `<div slField>
         <label slFieldLabel>Assunto</label>
         <div slTextField><input slTextFieldInput showCount maxlength="5" defaultValue="ab" /></div>
       </div>`,
    );

    expect(query(fixture, '[data-part="counter"]').textContent?.trim()).toBe('2/5');

    type(input(fixture), 'abc');
    fixture.detectChanges();
    expect(query(fixture, '[data-part="counter"]').textContent?.trim()).toBe('3/5');
  });

  it('marks a count that has passed a soft limit the browser does not enforce', () => {
    const fixture = renderTemplate(
      `<div slField>
         <div slTextField><input slTextFieldInput showCount countMax="2" defaultValue="abcd" /></div>
       </div>`,
    );

    const counter = query(fixture, '[data-part="counter"]');
    expect(counter.textContent?.trim()).toBe('4/2');
    expect(counter.hasAttribute('data-invalid')).toBe(true);
  });

  it('leaves a counter the page wrote alone', () => {
    const fixture = renderTemplate(
      `<div slField>
         <span slFieldCounter>3 palavras</span>
         <div slTextField><input slTextFieldInput showCount defaultValue="a b c" /></div>
       </div>`,
    );

    const counters = fixture.nativeElement.querySelectorAll('[data-part="counter"]');
    expect(counters).toHaveLength(1);
    expect(counters[0].textContent?.trim()).toBe('3 palavras');
  });

  /* ---------------------------------------------------------- defaults - */

  it('names its buttons in the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(
      `<div slTextField clearable><input slTextFieldInput defaultValue="x" /></div>`,
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );

    expect(query(fixture, '[data-part="clear"]').getAttribute('aria-label')).toBe('Limpar');

    locale.set('en-US');
    fixture.detectChanges();
    expect(query(fixture, '[data-part="clear"]').getAttribute('aria-label')).toBe('Clear');
  });

  it('lays its own messages over the language in force', () => {
    const fixture = renderTemplate(
      `<div slTextField clearable [messages]="{ clear: 'Apagar' }">
        <input slTextFieldInput defaultValue="x" />
      </div>`,
    );

    expect(query(fixture, '[data-part="clear"]').getAttribute('aria-label')).toBe('Apagar');
  });

  /* -------------------------------------------------- inside the frame - */

  it('copies the value, shows a check and reports whether the clipboard took it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
    try {
      const fixture = renderTemplate(
        `<div slTextField copyable (valueCopy)="copies.push($event)">
           <input slTextFieldInput readonly defaultValue="https://slotted.dev/x" />
         </div>`,
      );
      const button = query(fixture, '[data-part="copy"]');
      expect(button.hidden).toBe(false);
      expect(button.getAttribute('aria-label')).toBe('Copy');
      button.dispatchEvent(new MouseEvent('click', { detail: 1 }));
      await vi.waitFor(() => expect(fixture.componentInstance.copies).toHaveLength(1));
      fixture.detectChanges();
      expect(writeText).toHaveBeenCalledWith('https://slotted.dev/x');
      expect(fixture.componentInstance.copies[0]).toMatchObject({
        copied: true,
        reason: 'pointer',
        value: 'https://slotted.dev/x',
      });
      expect(button.hasAttribute('data-complete')).toBe(true);
      expect(button.querySelector('svg')?.getAttribute('data-glyph')).toBe('check');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('hides the copy button while there is nothing to copy', () => {
    const fixture = renderTemplate(`<div slTextField copyable><input slTextFieldInput /></div>`);
    expect(query(fixture, '[data-part="copy"]').hidden).toBe(true);
    type(input(fixture), 'a');
    fixture.detectChanges();
    expect(query(fixture, '[data-part="copy"]').hidden).toBe(false);
  });

  it('marks the control busy and keeps it editable while loading', () => {
    const fixture = renderTemplate(
      `<div slTextField [loading]="loading()"><input slTextFieldInput /></div>`,
    );
    const root = query(fixture, '[data-ui="text-field"]');
    expect(input(fixture).getAttribute('aria-busy')).toBe('true');
    expect(input(fixture).disabled).toBe(false);
    expect(root.hasAttribute('data-loading')).toBe(true);
    expect(query(fixture, '[data-part="busy"][data-ui="spinner"]').hidden).toBe(false);

    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    expect(input(fixture).hasAttribute('aria-busy')).toBe(false);
    expect(root.hasAttribute('data-loading')).toBe(false);
    expect(query(fixture, '[data-part="busy"]').hidden).toBe(true);

    fixture.componentInstance.loading.set(undefined);
    fixture.detectChanges();
    expect(query(fixture, '[data-part="busy"]')).toBeNull();
  });

  it('warns about Caps Lock in a focused password and forgets it on blur', () => {
    const fixture = renderTemplate(
      `<div slTextField><input slTextFieldInput type="password" /></div>`,
    );
    const mark = () => query(fixture, '[data-part="caps-lock"]');
    expect(mark().hidden).toBe(true);

    input(fixture).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', modifierCapsLock: true } as KeyboardEventInit),
    );
    fixture.detectChanges();
    expect(mark().hidden).toBe(false);
    expect(mark().querySelector('svg')?.getAttribute('data-glyph')).toBe('caps-lock');

    input(fixture).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(mark().hidden).toBe(true);
  });

  it('draws no Caps Lock mark outside a password', () => {
    const fixture = renderTemplate(`<div slTextField><input slTextFieldInput /></div>`);
    expect(query(fixture, '[data-part="caps-lock"]')).toBeNull();
  });

  it('puts the consumer’s own button inside the frame as a real button', () => {
    const fixture = renderTemplate(
      `<div slTextField>
         <input slTextFieldInput />
         <span slTextFieldEnd><button slTextFieldAction aria-label="More" (click)="clicks.push($event)">…</button></span>
       </div>`,
    );
    const action = query(fixture, 'button[aria-label="More"]');
    expect(action.getAttribute('data-part')).toBe('action');
    expect(action.getAttribute('type')).toBe('button');
    expect(action.parentElement?.getAttribute('data-part')).toBe('end');
    action.click();
    expect(fixture.componentInstance.clicks).toHaveLength(1);
  });

  it('keeps the frame’s buttons in the order the stylesheet insets', () => {
    const fixture = renderTemplate(
      `<div slTextField clearable copyable revealable [loading]="true">
         <input slTextFieldInput type="password" defaultValue="a" />
       </div>`,
    );
    const parts = [...query(fixture, '[data-ui="text-field"]').children].map((child) =>
      child.getAttribute('data-part'),
    );
    expect(parts).toEqual(['input', 'busy', 'caps-lock', 'clear', 'copy', 'reveal']);
  });
});
