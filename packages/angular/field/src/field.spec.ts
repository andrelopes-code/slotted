import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/field/contract.json';
import { SlField } from './field';
import { provideFieldDefaults } from './field-defaults';
import { SlFieldDescription, SlFieldError } from './field-messages';
import { SlFieldAction, SlFieldControl, SlFieldLabel } from './field-parts';
import { SlFieldCounter } from './field-counter';
import { SlFieldHeader, SlFieldHelp, SlFieldIndicator } from './field-header';

@Component({
  standalone: true,
  imports: [
    SlField,
    SlFieldLabel,
    SlFieldControl,
    SlFieldCounter,
    SlFieldDescription,
    SlFieldError,
    SlFieldHeader,
    SlFieldHelp,
    SlFieldIndicator,
    SlFieldAction,
  ],
  template: `<div slField></div>`,
})
class Host {}

function renderTemplate(template: string, providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  TestBed.overrideComponent(Host, { set: { template } });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

const root = (fixture: ReturnType<typeof renderTemplate>, selector = '[data-ui="field"]') =>
  fixture.nativeElement.querySelector(selector) as HTMLElement;

describe('SlField', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(
      `<div slField>
         <label slFieldLabel>E-mail</label>
         <input slFieldControl />
         <span slFieldCounter>0/64</span>
         <span slFieldDescription>We will use it for billing.</span>
       </div>`,
    );

    const field = root(fixture);
    expect(field.tagName).toBe('DIV');
    expect(field.getAttribute('data-part')).toBe('root');
    expect(field.querySelector('[data-part="label"]')?.tagName).toBe('LABEL');
    expect(field.querySelector('[data-part="control"]')?.tagName).toBe('INPUT');
    expect(field.querySelector('[data-part="counter"]')?.tagName).toBe('SPAN');
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const fixture = renderTemplate(`<div slField><input slFieldControl /></div>`);
    const field = root(fixture);
    const { defaults } = contract.members.field;

    expect(field.getAttribute('data-size')).toBe(defaults.size);
    expect(field.getAttribute('data-label-placement')).toBe(defaults.labelPlacement);
    expect(field.getAttribute('data-necessity')).toBe(defaults.necessity);
    expect(field.getAttribute('data-width')).toBe(defaults.width);
    for (const state of ['data-disabled', 'data-invalid', 'data-required', 'data-readonly']) {
      expect(field.hasAttribute(state)).toBe(false);
    }
  });

  /**
   * Derivation rather than registration: `label[for]` resolves to the
   * identifier the control will use with no ordering dependency between
   * siblings and nothing to coordinate during hydration.
   */
  it('derives every identifier from one base, in the order the contract names', () => {
    const fixture = renderTemplate(
      `<div slField id="ein">
         <label slFieldLabel>EIN</label>
         <input slFieldControl />
         <span slFieldDescription>Numbers only.</span>
         <span slFieldError>Two digits missing.</span>
       </div>`,
    );

    const control = root(fixture).querySelector('input') as HTMLInputElement;
    expect(control.getAttribute('id')).toBe('ein-control');
    expect(root(fixture).querySelector('label')?.getAttribute('for')).toBe('ein-control');
    expect(control.getAttribute('aria-describedby')).toBe('ein-description ein-error');
  });

  it('names only the messages the page actually wrote', () => {
    const fixture = renderTemplate(
      `<div slField id="ein">
         <input slFieldControl />
         <span slFieldDescription>Numbers only.</span>
       </div>`,
    );

    expect(root(fixture).querySelector('input')?.getAttribute('aria-describedby')).toBe(
      'ein-description',
    );
  });

  /**
   * A message is drawn where the page wrote one, as React's `FieldDescription`
   * and `FieldError` are: an unwritten error is no `inline-message` at all,
   * not an empty one the stylesheet hides.
   */
  it('draws only the messages the page actually wrote', () => {
    const fixture = renderTemplate(
      `<div slField id="ein">
         <input slFieldControl />
         <span slFieldDescription>Numbers only.</span>
       </div>`,
    );

    const messages = root(fixture).querySelectorAll('[data-ui="inline-message"]');
    expect([...messages].map((message) => message.id)).toEqual(['ein-description']);

    const bare = renderTemplate(`<div slField><input slFieldControl /></div>`);
    expect(root(bare).querySelector('[data-ui="inline-message"]')).toBeNull();
  });

  /**
   * React's `FieldError` registers only when its children have content: a
   * reserved message with nothing in it keeps its box and describes nothing,
   * until its text arrives.
   */
  it('names a reserved message only while it has something to say', () => {
    const fixture = TestBed.createComponent(Notice);
    fixture.detectChanges();
    const control = root(fixture, 'input');
    expect(root(fixture, '#ein-error').hasAttribute('data-reserve')).toBe(true);
    expect(control.getAttribute('aria-describedby')).toBe('ein-description');

    fixture.componentInstance.notice.set('Two digits missing.');
    fixture.detectChanges();
    expect(control.getAttribute('aria-describedby')).toBe('ein-description ein-error');

    fixture.componentInstance.notice.set('');
    fixture.detectChanges();
    expect(control.getAttribute('aria-describedby')).toBe('ein-description');
  });

  it('merges the field’s description after a value the consumer wrote', () => {
    const fixture = renderTemplate(
      `<div slField id="ein">
         <input slFieldControl aria-describedby="tour-step" />
         <span slFieldDescription>Numbers only.</span>
       </div>`,
    );

    expect(root(fixture).querySelector('input')?.getAttribute('aria-describedby')).toBe(
      'tour-step ein-description',
    );
  });

  /**
   * `aria-required`, never the native `required`: the native attribute engages
   * browser constraint validation and changes submit behavior, which the
   * library must not impose as a side effect of describing a field.
   */
  it('describes the control without taking over its submission', () => {
    const fixture = renderTemplate(
      `<div slField disabled invalid required readOnly><input slFieldControl /></div>`,
    );

    const control = root(fixture).querySelector('input') as HTMLInputElement;
    expect(control.getAttribute('aria-required')).toBe('true');
    expect(control.hasAttribute('required')).toBe(false);
    expect(control.getAttribute('aria-invalid')).toBe('true');
    expect(control.hasAttribute('disabled')).toBe(true);
    expect(control.hasAttribute('readonly')).toBe(true);
  });

  /**
   * A host binding wins over a static attribute in Angular, so each written
   * value is read before the binding is computed rather than after — the
   * asymmetry with React, where a consumer's prop simply spreads over the
   * family's.
   */
  it('never overwrites a value the consumer wrote on the control', () => {
    const fixture = renderTemplate(
      `<div slField disabled invalid>
         <input slFieldControl id="mine" aria-invalid="false" />
       </div>`,
    );

    const control = root(fixture).querySelector('input') as HTMLInputElement;
    expect(control.getAttribute('id')).toBe('mine');
    expect(control.getAttribute('aria-invalid')).toBe('false');
  });

  it('says necessity as a mark, as a word on the optional fields, as words, or not at all', () => {
    const fixture = renderTemplate(
      `<div slField id="a" required><label slFieldLabel>EIN</label></div>
       <div slField id="b" required necessity="words"><label slFieldLabel>EIN</label></div>
       <div slField id="c" necessity="words"><label slFieldLabel>IE</label></div>
       <div slField id="d" required necessity="none"><label slFieldLabel>EIN</label></div>
       <div slField id="e" necessity="optional"><label slFieldLabel>Trade name</label></div>
       <div slField id="f" required necessity="optional"><label slFieldLabel>Legal name</label></div>`,
    );

    const markOf = (id: string) =>
      fixture.nativeElement.querySelector(`#${id} [data-part="mark"]`) as HTMLElement | null;

    expect(markOf('a')?.textContent).toBe('*');
    expect(markOf('a')?.getAttribute('aria-hidden')).toBe('true');
    expect(markOf('b')?.textContent).toBe('(required)');
    expect(markOf('b')?.hasAttribute('aria-hidden')).toBe(false);
    expect(markOf('c')?.textContent).toBe('(optional)');
    expect(markOf('d')).toBeNull();
    expect(markOf('e')?.textContent).toBe('(optional)');
    expect(markOf('e')?.hasAttribute('aria-hidden')).toBe(false);
    expect(markOf('f')).toBeNull();
  });

  /**
   * The gap on screen is CSS, and an accessible name is computed from text: with
   * no space in the DOM the control read as `Note(optional)`.
   */
  it('separates the necessity word from the label in the accessible name', () => {
    const fixture = renderTemplate(
      `<div slField necessity="optional"><label slFieldLabel>Note</label></div>`,
    );

    expect(root(fixture, 'label').textContent?.trim()).toBe('Note (optional)');
  });

  it('speaks the necessity words of the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(
      `<div slField id="a" necessity="words"><label slFieldLabel>IE</label></div>
       <div slField id="b" necessity="words" required [messages]="{ required: '(exigido)' }">
         <label slFieldLabel>EIN</label></div>`,
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );
    const mark = (id: string) => root(fixture, `#${id} [data-part="mark"]`).textContent;

    // language: pt-BR
    expect(mark('a')).toBe('(opcional)');
    expect(mark('b')).toBe('(exigido)');
    // language: en-US

    locale.set('en-US');
    fixture.detectChanges();
    expect(mark('a')).toBe('(optional)');
  });

  it('lets an application set the family’s appearance once, and a field override it', () => {
    const fixture = renderTemplate(
      `<div slField id="inherited"></div><div slField id="own" size="lg"></div>`,
      [provideFieldDefaults({ labelPlacement: 'side', size: 'sm' })],
    );

    const inherited = root(fixture, '#inherited');
    expect(inherited.getAttribute('data-size')).toBe('sm');
    expect(inherited.getAttribute('data-label-placement')).toBe('side');
    expect(root(fixture, '#own').getAttribute('data-size')).toBe('lg');
  });

  /**
   * The description and the error are `inline-message` roots, which is what
   * `docs/process/build-order.md` states as the reason that family was built in wave
   * 2: a field error arrives with the clipped severity word an application
   * translates once, and the field draws none of it.
   */
  it('speaks through the message family in the two tones the contract names', () => {
    const fixture = renderTemplate(
      `<div slField id="ein">
         <span slFieldDescription>Numbers only.</span>
         <span slFieldError>Two digits missing.</span>
       </div>`,
    );

    const description = root(fixture, '#ein-description');
    const error = root(fixture, '#ein-error');
    expect(description.getAttribute('data-ui')).toBe(contract.messageFamily);
    expect(description.getAttribute('data-tone')).toBe(contract.messageTones.description);
    expect(error.getAttribute('data-tone')).toBe(contract.messageTones.error);
    expect(error.querySelector('[data-part="prefix"]')?.textContent).toBe('Error:');
  });

  it('lets the error speak in a tone that is not an error', () => {
    const fixture = renderTemplate(
      `<div slField id="pw">
         <span slFieldError tone="warning" live="polite">Easy to guess.</span>
       </div>`,
    );

    const error = root(fixture, '#pw-error');
    expect(error.getAttribute('data-tone')).toBe('warning');
    expect(error.getAttribute('role')).toBe('status');
  });

  it('hands its messages the field’s own step and its disabled state', () => {
    const fixture = renderTemplate(
      `<div slField id="ein" size="lg" disabled>
         <span slFieldDescription>Numbers only.</span>
       </div>`,
    );

    const description = root(fixture, '#ein-description');
    expect(description.getAttribute('data-size')).toBe('md');
    expect(description.hasAttribute('data-disabled')).toBe(true);
  });

  it('lets the counter go over its limit before the field is in error', () => {
    const fixture = renderTemplate(
      `<div slField id="bio"><span slFieldCounter invalid>148/140</span></div>`,
    );

    expect(root(fixture, '#bio [data-part="counter"]').hasAttribute('data-invalid')).toBe(true);
    expect(root(fixture, '#bio').hasAttribute('data-invalid')).toBe(false);
  });

  /**
   * The reach an Angular template has and a React one answers with a hook:
   * `exportAs` hands the instance back, so a page can point its own element at
   * the identifier the field derived.
   */
  it('hands its identifiers back to the template', () => {
    const fixture = renderTemplate(
      `<div slField #field="slField" id="ein"></div>
       <a [attr.href]="'#' + field.ids().control">Ir para o campo</a>`,
    );

    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('#ein-control');
  });

  it('passes native attributes through to the element that owns them', () => {
    const fixture = renderTemplate(
      `<div slField>
         <input slFieldControl type="email" name="email" autocomplete="email" maxlength="64" />
       </div>`,
    );

    const control = root(fixture).querySelector('input') as HTMLInputElement;
    expect(control.getAttribute('type')).toBe('email');
    expect(control.getAttribute('name')).toBe('email');
    expect(control.getAttribute('autocomplete')).toBe('email');
    expect(control.getAttribute('maxlength')).toBe('64');
  });

  /**
   * The property server and client rendering rely on. Two applications in one
   * server process must not produce colliding sequences, which is why the
   * factory is application-scoped rather than a module-level counter.
   */
  it('mints the same sequence for two independently created applications', () => {
    const first = renderTemplate(`<div slField><input slFieldControl /></div>`);
    const second = renderTemplate(`<div slField><input slFieldControl /></div>`);

    expect(first.nativeElement.querySelector('input').id).toBe(
      second.nativeElement.querySelector('input').id,
    );
  });

  /**
   * The help, the indicator and the action are siblings of the label in the
   * header, never inside it: a `button` inside a `label` is invalid HTML, and a
   * press on it would reach the label and move focus to the control.
   */
  it('keeps every control of the label row beside the label, never inside it', () => {
    const fixture = renderTemplate(
      `<div slField id="senha">
         <div slFieldHeader>
           <label slFieldLabel>Password</label>
           <button slFieldHelp="At least eight characters."></button>
           <span slFieldIndicator>Beta</span>
           <a slFieldAction href="/recuperar">Forgot your password?</a>
         </div>
         <input slFieldControl />
       </div>`,
    );

    const header = root(fixture, '[data-part="header"]');
    const label = root(fixture, '[data-part="label"]');
    for (const part of ['help', 'indicator', 'action']) {
      const element = header.querySelector(`[data-part="${part}"]`);
      expect(element?.parentElement).toBe(header);
      expect(label.contains(element)).toBe(false);
    }
    expect(root(fixture, '[data-part="help"]').getAttribute('type')).toBe('button');
    expect(root(fixture, 'a[data-part="action"]').hasAttribute('type')).toBe(false);
  });

  it('describes the control with the indicator, the help, the description, the count and the error', () => {
    const fixture = renderTemplate(
      `<div slField id="bio">
         <div slFieldHeader>
           <label slFieldLabel>Introduction</label>
           <button slFieldHelp="Appears on the public profile."></button>
           <span slFieldIndicator>Beta</span>
           <span slFieldCounter>24/160</span>
         </div>
         <input slFieldControl />
         <span slFieldError>Longa demais.</span>
         <span slFieldDescription>Uma frase.</span>
       </div>`,
    );

    expect(root(fixture, '[data-part="control"]').getAttribute('aria-describedby')).toBe(
      'bio-indicator bio-help bio-description bio-counter bio-error',
    );
    expect(root(fixture, '[data-part="counter"]').id).toBe('bio-counter');
    expect(root(fixture, '[data-part="indicator"]').id).toBe('bio-indicator');
  });

  /**
   * The tooltip's layer exists only while it is open, so the button and the
   * control are described by a hidden node carrying the same text.
   */
  it('describes the help button with the help text while the hint is closed', () => {
    const fixture = renderTemplate(
      `<div slField id="prazo">
         <div slFieldHeader>
           <label slFieldLabel>Prazo</label>
           <button slFieldHelp="Dias corridos."></button>
         </div>
       </div>`,
    );

    const help = root(fixture, '[data-part="help"]');
    const text = fixture.nativeElement.querySelector('#prazo-help') as HTMLElement;
    expect(help.getAttribute('aria-label')).toBe('More information');
    expect(help.getAttribute('aria-describedby')).toBe('prazo-help');
    expect(text.textContent?.trim()).toBe('Dias corridos.');
    expect(text.hidden).toBe(true);
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('opens and closes the hint on a press, as a request with its reason', () => {
    const fixture = renderTemplate(
      `<div slField>
         <div slFieldHeader>
           <label slFieldLabel>Prazo</label>
           <button slFieldHelp="Dias corridos."></button>
         </div>
       </div>`,
    );

    const help = root(fixture, '[data-part="help"]');
    help.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
    expect(help.hasAttribute('data-open')).toBe(true);

    help.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    fixture.detectChanges();
    expect(help.hasAttribute('data-open')).toBe(false);
  });

  it('names the help control in the language in force, and lets a page name one of its own', () => {
    const fixture = renderTemplate(
      `<div slField id="a"><div slFieldHeader><label slFieldLabel>Prazo</label>
         <button slFieldHelp="Calendar days."></button></div></div>
       <div slField id="b"><div slFieldHeader><label slFieldLabel>Interest</label>
         <button slFieldHelp="Per month." aria-label="How interest is calculated"></button></div></div>`,
      [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    );

    expect(root(fixture, '#a [data-part="help"]').getAttribute('aria-label')).toBe(
      // language: pt-BR
      'Mais informações',
      // language: en-US
    );
    expect(root(fixture, '#b [data-part="help"]').getAttribute('aria-label')).toBe(
      'How interest is calculated',
    );
  });

  it('leaves the help and the action operable on a disabled field', () => {
    const fixture = renderTemplate(
      `<div slField disabled>
         <div slFieldHeader>
           <label slFieldLabel>Centro de custo</label>
           <button slFieldHelp="Liberado depois da unidade."></button>
           <button slFieldAction>Escolher unidade</button>
         </div>
         <input slFieldControl />
       </div>`,
    );

    expect(root(fixture, '[data-part="control"]').hasAttribute('disabled')).toBe(true);
    expect(root(fixture, '[data-part="help"]').hasAttribute('disabled')).toBe(false);
    expect(root(fixture, '[data-part="action"]').hasAttribute('disabled')).toBe(false);
    expect(root(fixture, '[data-part="action"]').getAttribute('type')).toBe('button');
  });

  it('draws the published count in the header when there is one', () => {
    const fixture = renderTemplate(
      `<div slField id="nif" #field="slField">
         <div slFieldHeader><label slFieldLabel>NIF</label></div>
       </div>`,
    );
    const field = fixture.debugElement
      .query((node) => node.nativeElement?.hasAttribute?.('slField'))
      .injector.get(SlField);
    field.setCount({ length: 3, max: 14 });
    fixture.detectChanges();

    const counters = fixture.nativeElement.querySelectorAll('[data-part="counter"]');
    expect(counters).toHaveLength(1);
    expect(counters[0].parentElement).toBe(root(fixture, '[data-part="header"]'));
    expect(counters[0].id).toBe('nif-counter');
    expect(counters[0].textContent?.trim()).toBe('3/14');
  });
});

@Component({
  standalone: true,
  imports: [SlField, SlFieldControl, SlFieldDescription, SlFieldError],
  template: `<div slField id="ein">
    <input slFieldControl />
    <span slFieldDescription>Numbers only.</span>
    <span slFieldError reserve>{{ notice() }}</span>
  </div>`,
})
class Notice {
  readonly notice = signal('');
}
