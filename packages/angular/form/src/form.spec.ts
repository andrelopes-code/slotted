import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { beforeEach, describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/form/contract.json';
import { SlFormActions, SlFormAside } from './form-actions';
import { provideFormDefaults, provideFormErrorMessages } from './form-defaults';
import { SlForm, SlFormSummary } from './form';

@Component({
  standalone: true,
  imports: [SlForm, SlFormActions, SlFormAside],
  template: `<form
    slForm
    [errors]="errors"
    [validate]="validate"
    [errorFocus]="errorFocus"
    [summary]="summary"
    (formSubmit)="submits.push($event)"
    (errorsChange)="requests.push($event)"
  >
    <label for="name">Nome</label>
    <input id="name" name="name" required />
    <label for="email">E-mail</label>
    <input id="email" name="email" type="email" />
    <div slFormAside>Resumo</div>
    <div slFormActions></div>
  </form>`,
})
class Host {
  errors: Record<string, string> | undefined = undefined;
  validate: 'submit' | 'blur' | 'change' | 'none' | undefined = undefined;
  errorFocus: 'summary' | 'control' | 'none' | undefined = undefined;
  summary: 'auto' | 'none' | undefined = undefined;
  readonly submits: { values: Record<string, unknown> }[] = [];
  readonly requests: unknown[] = [];
}

function mount(patch: Partial<Host> = {}) {
  const fixture = TestBed.createComponent(Host);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  return fixture;
}

const formOf = (fixture: { nativeElement: HTMLElement }) =>
  fixture.nativeElement.querySelector('form') as HTMLFormElement;
const summaryOf = (fixture: { nativeElement: HTMLElement }) =>
  fixture.nativeElement.querySelector('[data-part="summary"]') as HTMLElement | null;
const itemsOf = (fixture: { nativeElement: HTMLElement }) =>
  Array.from(fixture.nativeElement.querySelectorAll<HTMLElement>('[data-part="summary-item"]'));

const submit = (fixture: { nativeElement: HTMLElement; detectChanges: () => void }) => {
  formOf(fixture).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  fixture.detectChanges();
};

describe('SlForm', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
  });

  it('is selected in public by the family identifier and stays a form element', () => {
    const fixture = mount();

    expect(formOf(fixture).getAttribute('data-ui')).toBe('form');
    expect(formOf(fixture).getAttribute('data-part')).toBe('root');
  });

  it('writes novalidate so the browser’s own bubble does not replace the field’s', () => {
    const fixture = mount();

    expect(formOf(fixture).hasAttribute('novalidate')).toBe(true);
    expect(contract.nativeValidation.writtenByDefault).toBe(true);
  });

  it('harvests the platform’s own message at submit and refuses to send', () => {
    const fixture = mount();

    submit(fixture);

    expect(fixture.componentInstance.submits.length).toBe(0);
    expect(summaryOf(fixture)).not.toBeNull();
    expect(itemsOf(fixture).length).toBe(1);
    expect(formOf(fixture).getAttribute('data-invalid')).toBe('');
  });

  it('sends the values when nothing is wrong', () => {
    const fixture = mount({ validate: 'none' });

    submit(fixture);

    expect(fixture.componentInstance.submits.length).toBe(1);
    expect(fixture.componentInstance.submits[0]?.values).toEqual({ name: '', email: '' });
  });

  /** An object's own key order is the server's, and the server does not know the layout. */
  it('lists a server’s errors in document order rather than in the object’s', () => {
    const fixture = mount({ errors: { email: 'Depois', name: 'Antes' } });

    expect(itemsOf(fixture).map((item) => item.textContent?.trim())).toEqual(['Antes', 'Depois']);
  });

  /** A message a reader cannot reach is still a message they have to be given. */
  it('keeps an error naming a control the form does not hold, without a link', () => {
    const fixture = mount({ errors: { coupon: 'O cupom expirou' } });

    expect(itemsOf(fixture).length).toBe(1);
    expect(itemsOf(fixture)[0]?.tagName).toBe('SPAN');
  });

  it('drops a server error when the field it names is edited', () => {
    const fixture = mount();
    submit(fixture);
    expect(itemsOf(fixture).length).toBe(1);

    const input = fixture.nativeElement.querySelector('#name') as HTMLInputElement;
    input.value = 'Ana';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(itemsOf(fixture).length).toBe(0);
  });

  /** The four things the sourced error summary states a summary must do. */
  it('renders a focusable region with a heading and a link per error', () => {
    const fixture = mount({ errors: { name: 'Enter your name' } });
    const region = summaryOf(fixture) as HTMLElement;

    expect(region.getAttribute('role')).toBe('alert');
    expect(region.getAttribute('tabindex')).toBe('-1');
    expect(region.querySelector('[data-part="summary-title"]')?.textContent?.trim()).toBe(
      'There is a problem',
    );
    expect(itemsOf(fixture)[0]?.getAttribute('href')).toBe('#name');
  });

  it('takes focus after a failed submit', () => {
    const fixture = mount();

    submit(fixture);

    expect(document.activeElement).toBe(summaryOf(fixture));
  });

  it('focuses the first invalid control instead when it is asked to', () => {
    const fixture = mount({ errorFocus: 'control' });

    submit(fixture);

    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#name'));
  });

  it('renders no summary at all when there is nothing wrong', () => {
    const fixture = mount();

    expect(summaryOf(fixture)).toBeNull();
    expect(formOf(fixture).hasAttribute('data-invalid')).toBe(false);
  });

  it('does not render its own summary when the consumer places one', () => {
    const fixture = mount({ summary: 'none', errors: { name: 'Enter your name' } });

    expect(summaryOf(fixture)).toBeNull();
  });

  it('clears the errors on a native reset', () => {
    const fixture = mount();
    submit(fixture);
    expect(itemsOf(fixture).length).toBe(1);

    formOf(fixture).dispatchEvent(new Event('reset', { bubbles: true }));
    fixture.detectChanges();

    expect(itemsOf(fixture).length).toBe(0);
  });

  it('carries the reason on every move of the map', () => {
    const fixture = mount();

    submit(fixture);

    expect((fixture.componentInstance.requests[0] as { reason: string }).reason).toBe('submit');
  });

  it('arranges the action row', () => {
    const fixture = mount();
    const actions = fixture.nativeElement.querySelector('[data-part="actions"]') as HTMLElement;

    expect(actions.getAttribute('data-align')).toBe('end');
  });

  it('names the aside by the family, so the stylesheet sets it beside the fields', () => {
    const fixture = mount();
    const aside = fixture.nativeElement.querySelector('[data-part="aside"]') as HTMLElement;

    expect(aside.getAttribute('data-ui')).toBe('form');
    expect(aside.hasAttribute('data-ui-form')).toBe(true);
    expect(aside.hasAttribute('data-part-aside')).toBe(true);
  });

  /**
   * The stylesheet names the two parts by the family's identifier, so a nested
   * family's part of the same name — a table's summary row, a section's
   * actions — is not painted as the form's.
   */
  it('names its summary and its action row by the family, so a nested family’s parts keep their own look', () => {
    const fixture = mount({ errors: { name: 'Enter your name' } });
    expect(summaryOf(fixture)?.getAttribute('data-ui')).toBe(contract.ui);
    const actions = fixture.nativeElement.querySelector('[data-part="actions"]') as HTMLElement;
    expect(actions.getAttribute('data-ui')).toBe(contract.ui);
  });
});

describe('SlForm defaults', () => {
  it('lets an application decide once how its forms behave', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideFormDefaults({ align: 'stretch' })],
    });

    const fixture = mount({ errors: { name: 'Enter your name' } });

    expect(
      (
        (fixture.nativeElement as HTMLElement).querySelector('[data-part="actions"]') as HTMLElement
      ).getAttribute('data-align'),
    ).toBe('stretch');
  });

  it('titles the summary in the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });

    const fixture = mount({ errors: { name: 'Enter your name' } });
    const title = () =>
      (fixture.nativeElement as HTMLElement)
        .querySelector('[data-part="summary-title"]')
        ?.textContent?.trim();

    // language: pt-BR
    expect(title()).toBe('Há um problema');
    // language: en-US
    locale.set('en-US');
    fixture.detectChanges();
    expect(title()).toBe('There is a problem');
  });
});

@Component({
  standalone: true,
  imports: [SlForm, ReactiveFormsModule],
  template: `<form slForm [formGroup]="group" (formSubmit)="sent.set(true)">
    <label for="ra-name">Nome</label>
    <input id="ra-name" name="name" formControlName="name" />
  </form>`,
})
class ReactiveHost {
  readonly group = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly sent = signal(false);
}

describe('SlForm with Reactive Forms', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ReactiveHost] });
  });

  /**
   * Angular reports a key and a shape and never a message. The registry is
   * where an application writes the sentence once.
   */
  it('turns a validator’s key into the sentence the registry names', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    const items = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        '[data-part="summary-item"]',
      ),
    );
    expect(items.length).toBe(1);
    expect(items[0]?.textContent?.trim()).toBe('Please fill in this field.');
    expect(fixture.componentInstance.sent()).toBe(false);
  });

  it('marks every control touched at submit', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();

    expect(fixture.componentInstance.group.controls.name.touched).toBe(false);

    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.group.controls.name.touched).toBe(true);
  });

  it('writes a built-in validator’s sentence in the language in force', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LengthHost],
      providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    });

    const fixture = TestBed.createComponent(LengthHost);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('[data-part="summary-item"]'),
        (item) => item.textContent?.trim(),
      ),
      // language: pt-BR
    ).toEqual(['Use pelo menos 8 caracteres.', 'Invalid EIN.']);
    // language: en-US
  });

  it('lets an application replace the sentence', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ReactiveHost],
      providers: [provideFormErrorMessages({ required: () => 'Required field.' })],
    });

    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('[data-part="summary-item"]')
        ?.textContent?.trim(),
    ).toBe('Required field.');
  });
});

/** A built-in validator with a shape, and one the application adds and names. */
@Component({
  standalone: true,
  imports: [SlForm, ReactiveFormsModule],
  providers: [provideFormErrorMessages({ cnpj: () => 'Invalid EIN.' })],
  template: `<form slForm [formGroup]="group">
    <input id="la-code" name="code" formControlName="code" />
    <input id="la-tax" name="tax" formControlName="tax" />
  </form>`,
})
class LengthHost {
  readonly group = new FormGroup({
    code: new FormControl('abc', { nonNullable: true, validators: [Validators.minLength(8)] }),
    tax: new FormControl('1', { nonNullable: true, validators: [() => ({ cnpj: true })] }),
  });
}

/** Kept so the placed-summary path is exercised as well as the rendered one. */
@Component({
  standalone: true,
  imports: [SlForm, SlFormSummary],
  template: `<form slForm summary="none" [errors]="{ name: 'Enter your name' }">
    <input id="placed-name" name="name" />
    <div slFormSummary data-testid="mine"></div>
  </form>`,
})
class PlacedHost {}

describe('SlForm with a summary the consumer placed', () => {
  it('renders exactly one summary, the consumer’s', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [PlacedHost] });
    const fixture = TestBed.createComponent(PlacedHost);
    fixture.detectChanges();

    const regions = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[data-part="summary"]'),
    );
    expect(regions.length).toBe(1);
    expect(regions[0]?.getAttribute('data-testid')).toBe('mine');
  });
});
