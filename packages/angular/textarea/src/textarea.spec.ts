import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/textarea/contract.json';
import { SlTextarea } from './textarea';
import { provideTextareaDefaults } from './textarea-defaults';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SlField, SlFieldLabel, SlTextarea],
  template: `<textarea slTextarea></textarea>`,
})
class Host {
  readonly value = signal<string | undefined>(undefined);
  readonly control = new FormControl('Ada');
  readonly limit = signal(140);
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

const control = (fixture: ReturnType<typeof renderTemplate>) =>
  query(fixture, '[data-ui="textarea"]') as HTMLTextAreaElement;

function type(element: HTMLTextAreaElement, value: string) {
  element.value = value;
  element.dispatchEvent(new Event('input'));
}

describe('SlTextarea', () => {
  it('is the control itself, with no frame around it', () => {
    const fixture = renderTemplate(`<textarea slTextarea></textarea>`);

    expect(control(fixture).tagName).toBe('TEXTAREA');
    expect(control(fixture).getAttribute('data-part')).toBe('root');
    expect(contract.members.textarea.parts).toEqual(['root']);
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const fixture = renderTemplate(`<textarea slTextarea></textarea>`);
    const defaults = contract.members.textarea.defaults;

    expect(control(fixture).getAttribute('data-size')).toBe(defaults.size);
    expect(control(fixture).getAttribute('data-variant')).toBe(defaults.variant);
    expect(control(fixture).getAttribute('data-resize')).toBe(defaults.resize);
    expect(control(fixture).getAttribute('rows')).toBe(String(defaults.rows));
    expect(control(fixture).hasAttribute('data-auto-size')).toBe(false);
  });

  it('leaves every native attribute the consumer wrote on the element', () => {
    const fixture = renderTemplate(
      `<textarea slTextarea maxlength="280" name="notes" wrap="soft" spellcheck="true"></textarea>`,
    );

    expect(control(fixture).getAttribute('maxlength')).toBe('280');
    expect(control(fixture).getAttribute('name')).toBe('notes');
    expect(control(fixture).getAttribute('wrap')).toBe('soft');
    expect(control(fixture).getAttribute('spellcheck')).toBe('true');
  });

  /* --------------------------------------------------------- auto-size - */

  it('hands the stylesheet the two row counts it cannot read from the attribute', () => {
    const fixture = renderTemplate(
      `<textarea slTextarea autoSize [rows]="2" [maxRows]="6"></textarea>`,
    );

    expect(control(fixture).hasAttribute('data-auto-size')).toBe(true);
    expect(control(fixture).style.getPropertyValue('--slotted-textarea-rows')).toBe('2');
    expect(control(fixture).style.getPropertyValue('--slotted-textarea-max-rows')).toBe('6');
    expect(control(fixture).getAttribute('rows')).toBe('2');
  });

  it('withdraws the manual handle from a control that sizes itself', () => {
    const fixture = renderTemplate(`<textarea slTextarea autoSize resize="both"></textarea>`);
    expect(control(fixture).getAttribute('data-resize')).toBe('none');
  });

  it('ships a ceiling that cannot be forgotten', () => {
    const fixture = renderTemplate(`<textarea slTextarea autoSize></textarea>`);
    expect(control(fixture).style.getPropertyValue('--slotted-textarea-max-rows')).toBe(
      String(contract.members.textarea.defaults.maxRows),
    );
  });

  /* ------------------------------------------------------------- value - */

  it('asks to move rather than announcing that it moved, with a reason', () => {
    const requests: { value: string; reason: string }[] = [];
    const fixture = renderTemplate(`<textarea slTextarea></textarea>`);
    const directive = fixture.debugElement
      .query((node: { nativeElement: Element }) => node.nativeElement.matches?.('textarea'))
      .injector.get(SlTextarea);
    directive.valueChange.subscribe((request) =>
      requests.push({ value: request.value, reason: request.reason }),
    );

    type(control(fixture), 'a note');
    fixture.detectChanges();

    expect(requests).toEqual([{ value: 'a note', reason: 'keyboard' }]);
    expect(contract.stateModel.value.reasons).toEqual(['keyboard']);
  });

  it('starts an uncontrolled control from the value it was given', () => {
    const fixture = renderTemplate(`<textarea slTextarea defaultValue="Ada"></textarea>`);
    expect(control(fixture).value).toBe('Ada');
  });

  it('belongs in a reactive form, and reports touched on blur', () => {
    const fixture = renderTemplate(`<textarea slTextarea [formControl]="control"></textarea>`);
    const element = control(fixture);
    expect(element.value).toBe('Ada');

    type(element, 'Ada Lovelace');
    expect(fixture.componentInstance.control.value).toBe('Ada Lovelace');

    element.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);

    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(element.hasAttribute('disabled')).toBe(true);
  });

  /* -------------------------------------------------------------- field - */

  it('takes its identifier and its state from the field around it', () => {
    const fixture = renderTemplate(
      `<div slField invalid required>
         <label slFieldLabel>Notes</label>
         <textarea slTextarea></textarea>
       </div>`,
    );

    expect(query(fixture, 'label').getAttribute('for')).toBe(control(fixture).getAttribute('id'));
    expect(control(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(control(fixture).getAttribute('aria-required')).toBe('true');
    expect(control(fixture).hasAttribute('required')).toBe(false);
    expect(control(fixture).hasAttribute('data-invalid')).toBe(true);
  });

  it('takes its step from the field rather than from the token', () => {
    const fixture = renderTemplate(
      `<div slField size="sm"><textarea slTextarea></textarea></div>`,
      [provideTextareaDefaults({ size: 'lg', variant: 'subtle' })],
    );

    expect(control(fixture).getAttribute('data-size')).toBe('sm');
    expect(control(fixture).getAttribute('data-variant')).toBe('subtle');
  });

  /* -------------------------------------------------------------- count - */

  it('publishes its count and lets the field draw it', () => {
    const fixture = renderTemplate(
      `<div slField>
         <textarea slTextarea showCount maxlength="280" defaultValue="oi"></textarea>
       </div>`,
    );

    expect(query(fixture, '[data-part="counter"]').textContent?.trim()).toBe('2/280');

    type(control(fixture), 'oi tudo bem');
    fixture.detectChanges();
    expect(query(fixture, '[data-part="counter"]').textContent?.trim()).toBe('11/280');
  });

  it('counts against a bound maxLength, and the element enforces it', () => {
    const fixture = renderTemplate(
      `<div slField>
         <textarea slTextarea showCount [maxLength]="limit()" defaultValue="oi"></textarea>
       </div>`,
    );
    const host = fixture.componentInstance;

    expect(query(fixture, '[data-part="counter"]').textContent?.trim()).toBe('2/140');
    expect(control(fixture).maxLength).toBe(140);

    host.limit.set(60);
    fixture.detectChanges();
    expect(query(fixture, '[data-part="counter"]').textContent?.trim()).toBe('2/60');
    expect(control(fixture).getAttribute('maxlength')).toBe('60');
  });
});
