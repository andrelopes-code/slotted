import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/checkbox/contract.json';
import { SlCheckbox } from './checkbox';
import { provideCheckboxDefaults } from './checkbox-defaults';
import { SlCheckboxDescription } from './checkbox-parts';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlCheckbox,
    SlCheckboxDescription,
    SlCheckboxGroup,
    SlField,
    SlFieldGroup,
    SlFieldGroupLegend,
    SlFieldLabel,
  ],
  template: `<div slCheckbox></div>`,
})
class Host {
  readonly checked = signal<boolean | undefined>(undefined);
  readonly control = new FormControl(false);
  readonly requests: unknown[] = [];
  readonly cancel = vi.fn();
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

const control = (fixture: Fixture) => query(fixture, '[data-part="control"]') as HTMLInputElement;
const root = (fixture: Fixture) => query(fixture, '[data-ui="checkbox"]');

function click(element: HTMLInputElement, detail = 1) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
}

describe('SlCheckbox', () => {
  /**
   * A composite widget — a grid row's selection box — keeps the box out of the
   * tab sequence until its cell is current; React's `tabIndex` reaches the
   * input the same way.
   */
  it('writes tabIndex on the input, and nothing when it is unset', async () => {
    const unset = renderTemplate(`<div slCheckbox>Archive</div>`);
    await unset.whenStable();
    expect(control(unset).hasAttribute('tabindex')).toBe(false);

    const set = renderTemplate(`<div slCheckbox [tabIndex]="-1">Archive</div>`);
    await set.whenStable();
    set.detectChanges();
    expect(control(set).getAttribute('tabindex')).toBe('-1');
    expect(control(set).tabIndex).toBe(-1);
  });

  /**
   * Hidden words are as wide as none: the root says so, and the wash closes
   * around the box. Visible words beside hidden ones are a label.
   */
  it('marks a label whose only content is hidden text', async () => {
    const hidden = renderTemplate(
      `<div slCheckbox><span data-ui="visually-hidden" data-ui-visually-hidden="">Select Acme Logistics</span></div>`,
    );
    await hidden.whenStable();
    hidden.detectChanges();
    expect(root(hidden).hasAttribute('data-label-hidden')).toBe(true);

    const mixed = renderTemplate(
      `<div slCheckbox>Delete <span data-ui="visually-hidden" data-ui-visually-hidden="">invoice 42</span></div>`,
    );
    await mixed.whenStable();
    mixed.detectChanges();
    expect(root(mixed).hasAttribute('data-label-hidden')).toBe(false);

    const empty = renderTemplate(`<div slCheckbox></div>`);
    await empty.whenStable();
    empty.detectChanges();
    expect(root(empty).hasAttribute('data-label-hidden')).toBe(false);
  });

  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(
      `<div slCheckbox>Aceito<p slCheckboxDescription>Enviaremos o recibo.</p></div>`,
    );

    expect(root(fixture).getAttribute('data-ui')).toBe('checkbox');
    expect(root(fixture).getAttribute('data-part')).toBe('root');
    expect(control(fixture).getAttribute('type')).toBe('checkbox');
    expect(
      query(fixture, '[data-part="indicator"] svg[data-glyph]').getAttribute('data-glyph'),
    ).toBe('check');
    expect(query(fixture, '[data-part="label"]').textContent).toContain('Aceito');
    expect(query(fixture, '[data-part="description"]').textContent).toContain(
      'Enviaremos o recibo.',
    );
  });

  it('leaves the root out of the accessibility tree', () => {
    const fixture = renderTemplate(`<div slCheckbox>Aceito</div>`);
    expect(root(fixture).getAttribute('role')).toBeNull();
    expect(contract.rootRole).toBeNull();
  });

  it('names the control from a sibling label and describes it from the description', () => {
    const fixture = renderTemplate(
      `<div slCheckbox>Send receipt<p slCheckboxDescription>By email.</p></div>`,
    );
    const id = control(fixture).getAttribute('id');

    expect(id).not.toBeNull();
    expect(query(fixture, '[data-part="label"]').getAttribute('for')).toBe(id as string);
    expect(control(fixture).getAttribute('aria-describedby')).toBe(
      query(fixture, '[data-part="description"]').getAttribute('id'),
    );
    expect(contract.labelAssociation).toBe('for');
  });

  it('keeps an identifier the consumer wrote as a static attribute', () => {
    const fixture = renderTemplate(`<div slCheckbox id="terms">Aceito</div>`);
    expect(control(fixture).getAttribute('id')).toBe('terms');
    expect(query(fixture, '[data-part="label"]').getAttribute('for')).toBe('terms');
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const fixture = renderTemplate(`<div slCheckbox>Aceito</div>`);
    expect(root(fixture).getAttribute('data-size')).toBe(contract.members.checkbox.defaults.size);
    expect(root(fixture).getAttribute('data-label-placement')).toBe(
      contract.members.checkbox.defaults.labelPlacement,
    );
  });

  it('asks before it moves, and says whether the pointer or the keyboard asked', () => {
    const fixture = renderTemplate(
      `<div slCheckbox (checkedChange)="requests.push($event)">Aceito</div>`,
    );

    click(control(fixture), 1);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({
      previous: false,
      reason: 'pointer',
      value: true,
    });

    click(control(fixture), 0);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({
      previous: true,
      reason: 'keyboard',
      value: false,
    });
  });

  it('keeps the state a controlled box was given until the consumer moves it', () => {
    const fixture = renderTemplate(
      `<div slCheckbox [checked]="false" (checkedChange)="requests.push($event)">Aceito</div>`,
    );

    click(control(fixture));
    fixture.detectChanges();
    expect(fixture.componentInstance.requests).toHaveLength(1);
    expect(control(fixture).checked).toBe(false);
    expect(root(fixture).getAttribute('data-checked')).toBeNull();
  });

  it('moves its own state when nobody owns it, and mirrors it onto the root', () => {
    const fixture = renderTemplate(`<div slCheckbox defaultChecked>Aceito</div>`);
    expect(root(fixture).getAttribute('data-checked')).toBe('');

    click(control(fixture));
    fixture.detectChanges();
    expect(root(fixture).getAttribute('data-checked')).toBeNull();
  });

  it('restores what an uncontrolled box started from when the form resets', () => {
    const fixture = renderTemplate(
      `<form>
         <div slCheckbox defaultChecked name="terms">Aceito</div>
         <div slCheckbox name="news">Novidades</div>
       </form>`,
    );
    const terms = query(fixture, 'input[name="terms"]') as HTMLInputElement;
    const news = query(fixture, 'input[name="news"]') as HTMLInputElement;

    click(terms);
    click(news);
    fixture.detectChanges();
    expect(terms.checked).toBe(false);
    expect(news.checked).toBe(true);

    (terms.form as HTMLFormElement).reset();
    fixture.detectChanges();
    expect(terms.checked).toBe(true);
    expect(terms.closest('[data-ui="checkbox"]')?.getAttribute('data-checked')).toBe('');
    expect(news.checked).toBe(false);
    expect(news.closest('[data-ui="checkbox"]')?.getAttribute('data-checked')).toBeNull();
  });

  /**
   * A native reset puts a box back to its default content attribute. A box
   * whose state belongs to a form control keeps showing that control's value,
   * because nothing resets the control unless a form directive does.
   */
  it('keeps showing its form control’s value when the native form resets', () => {
    const fixture = renderTemplate(
      `<form><div slCheckbox [formControl]="control">Aceito</div></form>`,
    );
    fixture.componentInstance.control.setValue(true);
    fixture.detectChanges();

    (control(fixture).form as HTMLFormElement).reset();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(true);
    expect(control(fixture).checked).toBe(true);
    expect(root(fixture).getAttribute('data-checked')).toBe('');
  });

  it('commits nothing when the request is cancelled', () => {
    const fixture = renderTemplate(`<div slCheckbox (checkedChange)="$event.cancel()">A</div>`);

    click(control(fixture));
    fixture.detectChanges();
    expect(root(fixture).getAttribute('data-checked')).toBeNull();
  });

  it('draws the mixed state without changing what the form submits', () => {
    const fixture = renderTemplate(`<div slCheckbox indeterminate value="all">Todos</div>`);

    expect(control(fixture).indeterminate).toBe(true);
    expect(control(fixture).checked).toBe(false);
    expect(root(fixture).getAttribute('data-indeterminate')).toBe('');
    /* Mixed is the dash, in place of the check. */
    expect(
      query(fixture, '[data-part="indicator"] svg[data-glyph]').getAttribute('data-glyph'),
    ).toBe('minus');
    expect(control(fixture).getAttribute('value')).toBe('all');
  });

  it('refuses every change while it is read-only, and stays reachable', () => {
    const fixture = renderTemplate(
      `<div slCheckbox readOnly (checkedChange)="requests.push($event)">Contratado</div>`,
    );

    click(control(fixture));
    fixture.detectChanges();
    expect(fixture.componentInstance.requests).toHaveLength(0);
    expect(control(fixture).checked).toBe(false);
    expect(control(fixture).getAttribute('aria-readonly')).toBe('true');
    expect(control(fixture).disabled).toBe(false);
  });

  it('disables through the platform rather than through an attribute of its own', () => {
    const fixture = renderTemplate(`<div slCheckbox disabled>Aceito</div>`);
    expect(control(fixture).disabled).toBe(true);
    expect(root(fixture).getAttribute('data-disabled')).toBe('');
    expect(contract.disabledAttribute).toBe('disabled');
  });

  it('takes its state from the field around it and never its identifier', () => {
    const fixture = renderTemplate(
      `<div slField disabled invalid required>
         <label slFieldLabel>Termos</label>
         <div slCheckbox>Aceito</div>
       </div>`,
    );

    expect(control(fixture).disabled).toBe(true);
    expect(control(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(control(fixture).getAttribute('aria-required')).toBe('true');
    expect(control(fixture).getAttribute('id')).toMatch(/^slotted-checkbox-/);
    expect(contract.wiring.id).toBe('never');
  });

  it('describes necessity without engaging constraint validation', () => {
    const fixture = renderTemplate(
      `<div slField required><label slFieldLabel>Termos</label><div slCheckbox>A</div></div>`,
    );

    expect(control(fixture).getAttribute('aria-required')).toBe('true');
    expect(control(fixture).required).toBe(false);
    expect(contract.requiredAttribute).toBe('aria-required');
  });

  it('lets a consumer state the native required when they want the platform’s validation', () => {
    const fixture = renderTemplate(`<div slCheckbox required>Aceito</div>`);
    expect(control(fixture).required).toBe(true);
  });

  it('takes its step from a field group when there is no field between them', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup size="sm">
         <legend slFieldGroupLegend>Avisos</legend>
         <div slCheckbox>Aceito</div>
       </fieldset>`,
    );

    expect(root(fixture).getAttribute('data-size')).toBe('sm');
  });

  it('lets an application decide once what its checkboxes look like', () => {
    const fixture = renderTemplate(`<div slCheckbox>Aceito</div>`, [
      provideCheckboxDefaults({ labelPlacement: 'start', size: 'lg', variant: 'tile' }),
    ]);

    expect(root(fixture).getAttribute('data-size')).toBe('lg');
    expect(root(fixture).getAttribute('data-label-placement')).toBe('start');
    expect(root(fixture).getAttribute('data-variant')).toBe('tile');
    expect(contract.provides.checkboxDefaults).toEqual(['size', 'variant', 'labelPlacement']);
  });

  /**
   * The framed choice resolves one step shorter than `size`: the input, else
   * the group around it, else the injected defaults. It never comes from the
   * field — a field decides how its own row is laid out, and a checkbox drawn
   * as a tile is a decision about the choice.
   */
  it('resolves the framed presentation from the input, then the group, then the token', () => {
    expect(root(renderTemplate(`<div slCheckbox>Sozinho</div>`)).getAttribute('data-variant')).toBe(
      'plain',
    );

    const fromToken = renderTemplate(`<div slCheckbox>Do token</div>`, [
      provideCheckboxDefaults({ variant: 'tile' }),
    ]);
    expect(root(fromToken).getAttribute('data-variant')).toBe('tile');

    const fromGroup = renderTemplate(
      `<div slCheckboxGroup variant="tile">
         <div slCheckbox value="a">Do grupo</div>
       </div>`,
      [provideCheckboxDefaults({ variant: 'plain' })],
    );
    expect(root(fromGroup).getAttribute('data-variant')).toBe('tile');

    const fromInput = renderTemplate(
      `<div slCheckboxGroup variant="tile">
         <div slCheckbox value="a" variant="plain">From the input itself</div>
       </div>`,
    );
    expect(root(fromInput).getAttribute('data-variant')).toBe('plain');
    expect(contract.resolution.variant).toEqual(['prop', 'group', 'defaults', 'plain']);
  });

  it('takes size and placement from the group before the token', () => {
    const fixture = renderTemplate(
      `<div slCheckboxGroup size="sm" labelPlacement="end">
         <div slCheckbox value="a">A</div>
       </div>`,
      [provideCheckboxDefaults({ labelPlacement: 'start', size: 'lg' })],
    );

    expect(root(fixture).getAttribute('data-size')).toBe('sm');
    expect(root(fixture).getAttribute('data-label-placement')).toBe('end');
  });

  /** The integration point React has no equivalent of. */
  it('belongs in a reactive form, and answers a disabled control', () => {
    const fixture = renderTemplate(`<div slCheckbox [formControl]="control">Aceito</div>`);
    const host = fixture.componentInstance;

    click(control(fixture));
    fixture.detectChanges();
    expect(host.control.value).toBe(true);

    host.control.setValue(false);
    fixture.detectChanges();
    expect(control(fixture).checked).toBe(false);

    host.control.disable();
    fixture.detectChanges();
    expect(control(fixture).disabled).toBe(true);
  });

  it('marks a form control touched when the box loses focus', () => {
    const fixture = renderTemplate(`<div slCheckbox [formControl]="control">Aceito</div>`);
    expect(fixture.componentInstance.control.touched).toBe(false);

    control(fixture).dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('reaches the native element through exportAs', () => {
    const fixture = renderTemplate(
      `<div slCheckbox #box="slCheckbox">Aceito</div>
       <button type="button" (click)="box.inputElement.focus()">focar</button>`,
    );

    (query(fixture, 'button') as HTMLButtonElement).click();
    expect(document.activeElement).toBe(control(fixture));
  });
});
