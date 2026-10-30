import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { ChangeRequest } from '@slotted/core/state';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/otp-input/contract.json';
import { SlOtpInput } from './otp-input';
import { SlOtpInputControl } from './otp-input-control';
import type { OtpInputRejection } from './otp-input-control';
import { provideOtpInputDefaults } from './otp-input-defaults';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlField,
    SlFieldError,
    SlFieldLabel,
    SlOtpInput,
    SlOtpInputControl,
  ],
  template: `<div slOtpInput></div>`,
})
class Host {
  readonly value = signal<string | undefined>(undefined);
  readonly control = new FormControl('482915');
  readonly requests: ChangeRequest<string>[] = [];
  readonly completed: string[] = [];
  readonly rejections: OtpInputRejection[] = [];
  readonly submitted = vi.fn((event: Event) => event.preventDefault());
  readonly upper = (text: string) => text.replace(/^g-/i, '').toUpperCase();
  readonly letters = /[A-Z]/;
  cancelNext = false;

  record(request: ChangeRequest<string>) {
    this.requests.push(request);
    if (this.cancelNext) request.cancel();
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
const root = (fixture: Fixture) => query(fixture, '[data-ui="otp-input"]');
const input = (fixture: Fixture) => query(fixture, '[data-part="input"]') as HTMLInputElement;
const slots = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="slot"]')] as HTMLElement[];
const painted = (fixture: Fixture) => slots(fixture).map((slot) => slot.textContent);

function type(fixture: Fixture, value: string) {
  const element = input(fixture);
  element.value = value;
  element.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

describe('SlOtpInput', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(
      `<div slOtpInput [groups]="[3, 3]"><input slOtpInputControl defaultValue="48" /></div>`,
    );
    expect(root(fixture).tagName).toBe('DIV');
    expect(root(fixture).getAttribute('data-part')).toBe('root');
    expect(root(fixture).getAttribute('role')).toBeNull();
    expect(input(fixture).getAttribute('data-part')).toBe('input');
    expect(fixture.nativeElement.querySelectorAll('[data-part="group"]')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('[data-part="separator"]')).toHaveLength(1);
    expect(slots(fixture)).toHaveLength(6);
    expect(painted(fixture)).toEqual(['4', '8', '', '', '', '']);
    for (const group of fixture.nativeElement.querySelectorAll('[data-part="group"]')) {
      expect((group as HTMLElement).getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const fixture = renderTemplate(`<div slOtpInput><input slOtpInputControl /></div>`);
    const defaults = contract.members.otpInput.defaults;
    expect(root(fixture).getAttribute('data-size')).toBe(defaults.size);
    expect(root(fixture).getAttribute('data-variant')).toBe(defaults.variant);
    expect(root(fixture).hasAttribute('data-attached')).toBe(false);
    expect(root(fixture).hasAttribute('data-mask')).toBe(false);
    expect(slots(fixture)).toHaveLength(defaults.length);
    expect(input(fixture).getAttribute('maxlength')).toBe(String(defaults.length));
    expect(input(fixture).getAttribute('autocomplete')).toBe(contract.autocomplete);
    expect(input(fixture).getAttribute('inputmode')).toBe(contract.inputMode.numeric);
    expect(input(fixture).getAttribute('type')).toBe('text');
    expect(input(fixture).getAttribute('spellcheck')).toBe('false');
  });

  it('leaves every native attribute the consumer wrote on the element', () => {
    const fixture = renderTemplate(
      `<div slOtpInput>
         <input slOtpInputControl name="code" form="verify" autocomplete="off" inputmode="tel" id="own" />
       </div>`,
    );
    const element = input(fixture);
    expect(element.getAttribute('name')).toBe('code');
    expect(element.getAttribute('form')).toBe('verify');
    expect(element.getAttribute('autocomplete')).toBe('off');
    expect(element.getAttribute('inputmode')).toBe('tel');
    expect(element.getAttribute('id')).toBe('own');
  });

  it('derives the keyboard from the type', () => {
    const fixture = renderTemplate(
      `<div slOtpInput><input slOtpInputControl type="alphanumeric" /></div>`,
    );
    expect(input(fixture).getAttribute('inputmode')).toBe(contract.inputMode.alphanumeric);
  });

  it('fails at construction without the frame', () => {
    expect(() => renderTemplate(`<input slOtpInputControl />`)).toThrow();
  });

  /* ------------------------------------------------------------- value - */

  it('asks to move with reason keyboard and paints the value', () => {
    const fixture = renderTemplate(
      `<div slOtpInput><input slOtpInputControl (valueChange)="record($event)" /></div>`,
    );
    type(fixture, '4');
    expect(fixture.componentInstance.requests[0]).toMatchObject({
      value: '4',
      previous: '',
      reason: 'keyboard',
    });
    expect(painted(fixture)).toEqual(['4', '', '', '', '', '']);
  });

  it('puts the element back when the request is cancelled', () => {
    const fixture = renderTemplate(
      `<div slOtpInput><input slOtpInputControl (valueChange)="record($event)" /></div>`,
    );
    fixture.componentInstance.cancelNext = true;
    type(fixture, '4');
    expect(input(fixture).value).toBe('');
    expect(painted(fixture)).toEqual(['', '', '', '', '', '']);
  });

  it('writes a bound value into the element, cut to the code', () => {
    const fixture = renderTemplate(
      `<div slOtpInput><input slOtpInputControl [value]="value()" /></div>`,
    );
    fixture.componentInstance.value.set('12-3456789');
    fixture.detectChanges();
    expect(input(fixture).value).toBe('123456');
    expect(painted(fixture)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('belongs in a reactive form', () => {
    const fixture = renderTemplate(
      `<div slOtpInput><input slOtpInputControl [formControl]="control" /></div>`,
    );
    expect(input(fixture).value).toBe('482915');
    expect(painted(fixture)).toEqual(['4', '8', '2', '9', '1', '5']);
    type(fixture, '48');
    expect(fixture.componentInstance.control.value).toBe('48');
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(input(fixture).disabled).toBe(true);
    expect(root(fixture).hasAttribute('data-disabled')).toBe(true);
    input(fixture).dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  /* ------------------------------------------------------------ filter - */

  it('drops what the type refuses, reports it, and keeps the rest', () => {
    const fixture = renderTemplate(
      `<div slOtpInput><input slOtpInputControl (rejected)="rejections.push($event)" /></div>`,
    );
    type(fixture, '48-29 15');
    expect(input(fixture).value).toBe('482915');
    expect(fixture.componentInstance.rejections[0]?.text).toBe('- ');
  });

  it('runs the transform before the filter and lets a pattern outrank the type', () => {
    const fixture = renderTemplate(
      `<div slOtpInput [length]="4">
         <input slOtpInputControl type="alphanumeric" [pattern]="letters" [transform]="upper" />
       </div>`,
    );
    type(fixture, 'g-x7kq');
    expect(input(fixture).value).toBe('XKQ');
    expect(painted(fixture)).toEqual(['X', 'K', 'Q', '']);
  });

  /* -------------------------------------------------------- completion - */

  it('marks the root and reports the value once it is whole', () => {
    const fixture = renderTemplate(
      `<div slOtpInput [length]="4"><input slOtpInputControl (complete)="completed.push($event)" /></div>`,
    );
    type(fixture, '123');
    expect(root(fixture).hasAttribute('data-complete')).toBe(false);
    expect(fixture.componentInstance.completed).toEqual([]);
    type(fixture, '1234');
    expect(root(fixture).hasAttribute('data-complete')).toBe(true);
    type(fixture, '1235');
    type(fixture, '');
    type(fixture, '1234');
    expect(fixture.componentInstance.completed).toEqual(['1234', '1235', '1234']);
  });

  it('submits the owning form when asked', () => {
    const fixture = renderTemplate(
      `<form (submit)="submitted($event)">
         <div slOtpInput [length]="2"><input slOtpInputControl autoSubmit /></div>
       </form>`,
    );
    const form = input(fixture).form as HTMLFormElement;
    form.requestSubmit = vi.fn(() =>
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    );
    type(fixture, '12');
    expect(form.requestSubmit).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.submitted).toHaveBeenCalledTimes(1);
  });

  /* ------------------------------------------------------------- paint - */

  it('spreads the placeholder, masks through the platform, and joins when attached', () => {
    const fixture = renderTemplate(
      `<div slOtpInput placeholder="○" mask attached><input slOtpInputControl defaultValue="5391" /></div>`,
    );
    expect(input(fixture).getAttribute('type')).toBe(contract.maskType);
    expect(root(fixture).hasAttribute('data-mask')).toBe(true);
    expect(root(fixture).hasAttribute('data-attached')).toBe(true);
    expect(painted(fixture)).toEqual(['•', '•', '•', '•', '', '']);
    expect(slots(fixture).map((slot) => slot.getAttribute('data-placeholder'))).toEqual([
      null,
      null,
      null,
      null,
      '○',
      '○',
    ]);
  });

  it('draws one group when the partition does not add up', () => {
    const fixture = renderTemplate(
      `<div slOtpInput [groups]="[2, 2]"><input slOtpInputControl /></div>`,
    );
    expect(fixture.nativeElement.querySelectorAll('[data-part="group"]')).toHaveLength(1);
    expect(slots(fixture)).toHaveLength(6);
  });

  /* --------------------------------------------------------- selection - */

  it('marks the box the cursor is in while focused, selecting the last of a full code', () => {
    const fixture = renderTemplate(
      `<div slOtpInput><input slOtpInputControl defaultValue="482915" /></div>`,
    );
    expect(fixture.nativeElement.querySelector('[data-current]')).toBeNull();
    input(fixture).focus();
    input(fixture).dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect([input(fixture).selectionStart, input(fixture).selectionEnd]).toEqual([5, 6]);
    expect(slots(fixture)[5]?.hasAttribute('data-current')).toBe(true);
    input(fixture).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-current]')).toBeNull();
  });

  it('selects the character in front of a cursor placed inside the value', () => {
    const fixture = renderTemplate(
      `<div slOtpInput><input slOtpInputControl defaultValue="4829" /></div>`,
    );
    input(fixture).focus();
    input(fixture).dispatchEvent(new Event('focus'));
    input(fixture).setSelectionRange(1, 1);
    document.dispatchEvent(new Event('selectionchange'));
    fixture.detectChanges();
    expect([input(fixture).selectionStart, input(fixture).selectionEnd]).toEqual([1, 2]);
    expect(slots(fixture)[1]?.hasAttribute('data-current')).toBe(true);
  });

  it('puts the cursor in the box under the pointer', () => {
    const fixture = renderTemplate(
      `<div slOtpInput><input slOtpInputControl defaultValue="4829" /></div>`,
    );
    const target = slots(fixture)[1] as HTMLElement;
    document.elementsFromPoint = vi.fn(() => [input(fixture), target, root(fixture)]);
    root(fixture).dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: 10,
        clientY: 10,
      }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(input(fixture));
    expect([input(fixture).selectionStart, input(fixture).selectionEnd]).toEqual([1, 2]);
    expect(target.hasAttribute('data-current')).toBe(true);
  });

  it('refuses to drag the selected character', () => {
    const fixture = renderTemplate(
      `<div slOtpInput><input slOtpInputControl defaultValue="482915" /></div>`,
    );
    const event = new Event('dragstart', { bubbles: true, cancelable: true });
    input(fixture).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  /* ------------------------------------------------------------- field - */

  it('takes its identity, its description and its state from the field', () => {
    const fixture = renderTemplate(
      `<div slField invalid required size="sm">
         <label slFieldLabel>Verification code</label>
         <div slOtpInput><input slOtpInputControl /></div>
         <p slFieldError>Incorrect code.</p>
       </div>`,
    );
    const label = query(fixture, 'label');
    expect(label.getAttribute('for')).toBe(input(fixture).id);
    expect(input(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(input(fixture).getAttribute('aria-required')).toBe('true');
    expect(input(fixture).hasAttribute('required')).toBe(false);
    expect(input(fixture).getAttribute('aria-describedby')).toContain(
      query(fixture, '[slFieldError]').id,
    );
    expect(root(fixture).hasAttribute('data-invalid')).toBe(true);
    expect(root(fixture).getAttribute('data-size')).toBe('sm');
  });

  it('lets an application decide once, and an instance still win', () => {
    const fixture = renderTemplate(
      `<div slOtpInput><input slOtpInputControl /></div>
       <div slOtpInput [length]="8" size="sm"><input slOtpInputControl /></div>`,
      [
        provideOtpInputDefaults({
          attached: true,
          length: 4,
          placeholder: '○',
          size: 'lg',
          type: 'alphanumeric',
          variant: 'subtle',
        }),
      ],
    );
    const [first, second] = fixture.nativeElement.querySelectorAll('[data-ui="otp-input"]');
    expect(first.getAttribute('data-size')).toBe('lg');
    expect(first.getAttribute('data-variant')).toBe('subtle');
    expect(first.hasAttribute('data-attached')).toBe(true);
    expect(first.querySelectorAll('[data-part="slot"]')).toHaveLength(4);
    expect(first.querySelector('[data-part="input"]').getAttribute('inputmode')).toBe('text');
    expect(second.getAttribute('data-size')).toBe('sm');
    expect(second.querySelectorAll('[data-part="slot"]')).toHaveLength(8);
  });

  /* ------------------------------------------------------------ WebOTP - */

  it('asks the platform for the code, fills it with reason programmatic, and lets go on destroy', async () => {
    const abort = vi.fn();
    const get = vi.fn(({ signal }: { signal: AbortSignal }) => {
      signal.addEventListener('abort', abort);
      return Promise.resolve({ code: '48-2915' });
    });
    Object.defineProperty(window, 'OTPCredential', { configurable: true, value: class {} });
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get } });
    const fixture = renderTemplate(
      `<div slOtpInput><input slOtpInputControl webOtp (valueChange)="record($event)" /></div>`,
    );
    expect(get).toHaveBeenCalledWith(expect.objectContaining({ otp: { transport: ['sms'] } }));
    await Promise.resolve();
    fixture.detectChanges();
    expect(input(fixture).value).toBe('482915');
    expect(fixture.componentInstance.requests[0]).toMatchObject({
      value: '482915',
      reason: 'programmatic',
    });
    fixture.destroy();
    expect(abort).toHaveBeenCalled();
    delete (window as { OTPCredential?: unknown }).OTPCredential;
  });
});
