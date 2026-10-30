import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/switch/contract.json';
import { activationReason, SlSwitch } from './switch';
import { provideSwitchDefaults } from './switch-defaults';
import { SlSwitchDescription } from './switch-parts';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlField,
    SlFieldError,
    SlFieldLabel,
    SlSwitch,
    SlSwitchDescription,
  ],
  template: `<span slSwitch></span>`,
})
class Host {
  readonly checked = signal<boolean | undefined>(undefined);
  readonly loading = signal(false);
  readonly seen = signal<string[]>([]);
  readonly cancel = signal(false);
  readonly control = new FormControl(true);
  readonly group = new FormGroup({ alerts: new FormControl(true, { nonNullable: true }) });

  record(reason: string, cancelled: () => void) {
    this.seen.update((all) => [...all, reason]);
    if (this.cancel()) cancelled();
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

const query = (fixture: ReturnType<typeof renderTemplate>, selector: string) =>
  fixture.nativeElement.querySelector(selector) as HTMLElement;

const control = (fixture: ReturnType<typeof renderTemplate>) =>
  query(fixture, '[data-part="control"]') as HTMLInputElement;

const root = (fixture: ReturnType<typeof renderTemplate>) => query(fixture, '[data-ui="switch"]');

/** A pointer press, a key press and a script, told apart by the event alone. */
function press(element: HTMLInputElement, detail = 1) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
}

describe('SlSwitch', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(
      `<span slSwitch>Email alerts<p slSwitchDescription>One notice per order.</p></span>`,
    );

    expect(root(fixture)).toHaveProperty('tagName', 'SPAN');
    expect(root(fixture).getAttribute('data-part')).toBe('root');
    expect(control(fixture)).toHaveProperty('tagName', 'INPUT');
    expect(control(fixture).getAttribute('type')).toBe('checkbox');
    expect(control(fixture).getAttribute('role')).toBe('switch');
    expect(query(fixture, '[data-part="track"]')).not.toBeNull();
    expect(query(fixture, '[data-part="thumb"] svg[data-glyph]').getAttribute('data-glyph')).toBe(
      'check',
    );
    expect(query(fixture, '[data-part="label"]').textContent?.trim()).toBe('Email alerts');
    expect(query(fixture, '[data-part="description"]').textContent?.trim()).toBe(
      'One notice per order.',
    );
    expect(query(fixture, '[data-part="label"]').getAttribute('for')).toBe(control(fixture).id);
  });

  /**
   * ARIA 1.2 declares the `switch` role Children Presentational, so the role
   * belongs on the void `input` rather than on the box beside the status word.
   */
  it('leaves the box out of the accessibility tree', () => {
    const fixture = renderTemplate(`<span slSwitch>Alertas</span>`);

    expect(root(fixture).hasAttribute('role')).toBe(false);
    expect(contract.rootRole).toBeNull();
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const fixture = renderTemplate(`<span slSwitch>Alertas</span>`);

    expect(root(fixture).getAttribute('data-size')).toBe(contract.members.switch.defaults.size);
    expect(root(fixture).getAttribute('data-indicator')).toBe(
      contract.members.switch.defaults.indicator,
    );
    expect(root(fixture).getAttribute('data-label-placement')).toBe(
      contract.members.switch.defaults.labelPlacement,
    );
    expect(root(fixture).hasAttribute('data-loading')).toBe(false);
  });

  it('starts an uncontrolled switch where it was told to, and moves its own state', () => {
    const fixture = renderTemplate(
      `<span slSwitch defaultChecked (checkedChange)="record($event.reason, $event.cancel)">Alertas</span>`,
    );

    expect(control(fixture).checked).toBe(true);
    expect(root(fixture).getAttribute('data-checked')).toBe('');

    press(control(fixture));
    fixture.detectChanges();

    expect(control(fixture).checked).toBe(false);
    expect(root(fixture).hasAttribute('data-checked')).toBe(false);
    expect(fixture.componentInstance.seen()).toEqual(['pointer']);
  });

  /**
   * `isTrusted` is read-only and false for every event a test dispatches, so
   * the rule is exercised where its two facts are readable.
   */
  it('separates a key press from a pointer press and from a script', () => {
    expect(activationReason({ detail: 1, isTrusted: true })).toBe('pointer');
    expect(activationReason({ detail: 0, isTrusted: true })).toBe('keyboard');
    expect(activationReason({ detail: 0, isTrusted: false })).toBe('programmatic');

    const fixture = renderTemplate(
      `<span slSwitch (checkedChange)="record($event.reason, $event.cancel)">Alertas</span>`,
    );

    control(fixture).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.seen()).toEqual(['programmatic']);
    expect(control(fixture).checked).toBe(true);
  });

  it('never moves state the consumer owns', async () => {
    const fixture = renderTemplate(
      `<span slSwitch [checked]="checked()" (checkedChange)="record($event.reason, $event.cancel)">Alertas</span>`,
    );
    fixture.componentInstance.checked.set(false);
    fixture.detectChanges();

    press(control(fixture));
    fixture.detectChanges();

    expect(fixture.componentInstance.seen()).toEqual(['pointer']);
    await Promise.resolve();
    expect(control(fixture).checked).toBe(false);
  });

  it('commits nothing when the request is cancelled', async () => {
    const fixture = renderTemplate(
      `<span slSwitch (checkedChange)="record($event.reason, $event.cancel)">Alertas</span>`,
    );
    fixture.componentInstance.cancel.set(true);

    press(control(fixture));
    fixture.detectChanges();

    expect(root(fixture).hasAttribute('data-checked')).toBe(false);
    await Promise.resolve();
    expect(control(fixture).checked).toBe(false);
  });

  /**
   * The native `readonly` attribute does nothing on a checkbox, so read-only
   * is implemented: announced, focusable, submitted, and refused.
   */
  it('implements read-only rather than declaring it unsupported', () => {
    const fixture = renderTemplate(
      `<span slSwitch defaultChecked readOnly (checkedChange)="record($event.reason, $event.cancel)">Production key</span>`,
    );

    press(control(fixture));
    fixture.detectChanges();

    expect(control(fixture).getAttribute('aria-readonly')).toBe('true');
    expect(control(fixture).disabled).toBe(false);
    expect(control(fixture).checked).toBe(true);
    expect(fixture.componentInstance.seen()).toEqual([]);
    expect(root(fixture).getAttribute('data-readonly')).toBe('');
  });

  it('refuses a second toggle while the first is in flight', () => {
    const fixture = renderTemplate(
      `<span slSwitch [loading]="loading()" (checkedChange)="record($event.reason, $event.cancel)">Daily backup</span>`,
    );
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();

    press(control(fixture));
    fixture.detectChanges();

    expect(fixture.componentInstance.seen()).toEqual([]);
    expect(control(fixture).getAttribute('aria-busy')).toBe('true');
    expect(root(fixture).getAttribute('data-loading')).toBe('');
    expect(control(fixture).getAttribute('aria-describedby')).toContain('-pending');
  });

  it('announces the pending word of the language in force, and follows a change of it in place', () => {
    vi.useFakeTimers();
    try {
      const locale = signal('pt-BR');
      const fixture = renderTemplate(`<span slSwitch [loading]="loading()">Daily backup</span>`, [
        provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
      ]);
      fixture.componentInstance.loading.set(true);
      fixture.detectChanges();
      vi.advanceTimersByTime(2000);
      fixture.detectChanges();
      const status = () => query(fixture, '[role="status"]').textContent?.trim();

      expect(status()).toBe('Salvando');

      locale.set('en-US');
      fixture.detectChanges();
      expect(status()).toBe('Saving');
    } finally {
      vi.useRealTimers();
    }
  });

  it('is disabled natively, and answers nothing when it is', () => {
    const fixture = renderTemplate(
      `<span slSwitch disabled (checkedChange)="record($event.reason, $event.cancel)">Unavailable</span>`,
    );

    press(control(fixture));
    fixture.detectChanges();

    expect(control(fixture).disabled).toBe(true);
    expect(fixture.componentInstance.seen()).toEqual([]);
    expect(root(fixture).getAttribute('data-disabled')).toBe('');
  });

  /**
   * The mechanism the field-aware controls design fixed: unset means ask the
   * field, and `aria-required` never becomes the native attribute.
   */
  it('takes its identity and its state from the field around it', () => {
    const fixture = renderTemplate(
      `<div slField disabled invalid required>
         <label slFieldLabel>Automatic billing</label>
         <span slSwitch></span>
         <p slFieldError>Choose a billing method.</p>
       </div>`,
    );

    const element = control(fixture);
    expect(element.disabled).toBe(true);
    expect(element.getAttribute('aria-invalid')).toBe('true');
    expect(element.getAttribute('aria-required')).toBe('true');
    expect(element.hasAttribute('required')).toBe(false);
    expect(element.id).not.toBe('');
    expect(query(fixture, 'label[slFieldLabel]').getAttribute('for')).toBe(element.id);
    expect(element.getAttribute('aria-describedby')).toContain(
      query(fixture, '[data-ui="inline-message"][id$="-error"]').id,
    );
    expect(root(fixture).getAttribute('data-disabled')).toBe('');
    expect(root(fixture).getAttribute('data-invalid')).toBe('');
  });

  it('lets what the consumer stated win over the field', () => {
    const fixture = renderTemplate(
      `<div slField disabled size="sm">
         <label slFieldLabel>Alertas</label>
         <span slSwitch size="lg" [disabled]="false"></span>
       </div>`,
    );

    expect(control(fixture).disabled).toBe(false);
    expect(root(fixture).getAttribute('data-size')).toBe('lg');
  });

  it('lets an application decide once what its switches look like', () => {
    const fixture = renderTemplate(`<span slSwitch defaultChecked>Alertas</span>`, [
      provideSwitchDefaults({ indicator: 'none', labelPlacement: 'start', size: 'sm' }),
    ]);

    expect(root(fixture).getAttribute('data-size')).toBe('sm');
    expect(root(fixture).getAttribute('data-indicator')).toBe('none');
    expect(query(fixture, '[data-part="thumb"] svg[data-glyph]')).toBeNull();
    expect(root(fixture).getAttribute('data-label-placement')).toBe('start');
  });

  /**
   * The integration point React has no equivalent of. `formControlName` sits
   * on the host, where a consumer expects it, and validity stays the form's:
   * `Validators.requiredTrue` is the one line that makes a switch mandatory.
   */
  it('belongs in a reactive form, and reports itself as touched', () => {
    const fixture = renderTemplate(`<span slSwitch [formControl]="control">Alertas</span>`);

    expect(control(fixture).checked).toBe(true);

    fixture.componentInstance.control.setValue(false);
    fixture.detectChanges();
    expect(control(fixture).checked).toBe(false);

    press(control(fixture));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(true);

    expect(fixture.componentInstance.control.touched).toBe(false);
    control(fixture).dispatchEvent(new FocusEvent('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);

    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(control(fixture).disabled).toBe(true);
  });

  it('restores what an uncontrolled switch started from when the form resets', async () => {
    const fixture = renderTemplate(
      `<form><span slSwitch defaultChecked name="alerts">Alertas</span></form>`,
    );

    press(control(fixture));
    fixture.detectChanges();
    expect(root(fixture).hasAttribute('data-checked')).toBe(false);

    (control(fixture).form as HTMLFormElement).reset();
    fixture.detectChanges();

    expect(root(fixture).getAttribute('data-checked')).toBe('');
    // The form resets the element to a default no attribute wrote; the switch puts it back.
    await new Promise((resolve) => setTimeout(resolve));
    expect(control(fixture).checked).toBe(true);
  });

  /**
   * In a form bound to a model the reset value is the model's, written through
   * the value accessor, and the switch's own default does not apply.
   */
  it('shows the form model’s value after the form resets', async () => {
    const fixture = renderTemplate(
      `<form [formGroup]="group"><span slSwitch formControlName="alerts">Alertas</span></form>`,
    );

    press(control(fixture));
    fixture.detectChanges();
    expect(fixture.componentInstance.group.value.alerts).toBe(false);

    (control(fixture).form as HTMLFormElement).reset();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(fixture.componentInstance.group.value.alerts).toBe(true);
    expect(root(fixture).getAttribute('data-checked')).toBe('');
    expect(control(fixture).checked).toBe(true);
  });

  it('reaches the instance, the element and the imperative toggle from a template', () => {
    const fixture = renderTemplate(
      `<span slSwitch (checkedChange)="record($event.reason, $event.cancel)">Alertas</span>`,
    );
    const directive = fixture.debugElement
      .query((node) => node.attributes['slSwitch'] !== undefined)
      .injector.get(SlSwitch);

    expect(directive.inputElement).toBe(control(fixture));

    directive.toggle();
    fixture.detectChanges();

    expect(control(fixture).checked).toBe(true);
    expect(fixture.componentInstance.seen()).toEqual(['programmatic']);
  });
});
