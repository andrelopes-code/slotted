import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-text-field-validation',
  imports: [
    ReactiveFormsModule,
    SlButton,
    SlField,
    SlFieldError,
    SlFieldLabel,
    SlInline,
    SlStack,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <form novalidate (submit)="submit($event)">
      <div slStack [gap]="4">
        <div slField required [invalid]="error() !== '' ? true : undefined">
          <label slFieldLabel>Billing email</label>
          <div slTextField>
            <input
              slTextFieldInput
              type="email"
              autocomplete="email"
              [formControl]="email"
              (valueChange)="sent.set(false)"
            />
          </div>
          <span slFieldError live="polite" reserve>{{ error() }}</span>
        </div>
        <div slInline [gap]="3" align="center">
          <button slButton type="submit">Send invoice</button>
          @if (sent()) {
            <span role="status">Invoice sent.</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class TextFieldValidation {
  readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(EMAIL)],
  });
  readonly value = toSignal(this.email.valueChanges, { initialValue: this.email.value });
  readonly submitted = signal(false);
  readonly sent = signal(false);
  readonly error = computed(() => {
    if (!this.submitted()) return '';
    if (this.value().trim() === '') return 'Enter the address the invoice goes to.';
    return EMAIL.test(this.value()) ? '' : 'Enter an address in the format name@company.com.';
  });

  submit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.sent.set(this.email.valid);
  }
}
