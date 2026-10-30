import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

function emailError(value: string): string {
  if (value.trim() === '') return 'Enter the address invoices are sent to.';
  if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter an address like billing@company.com.';
  return '';
}

@Component({
  selector: 'app-field-validation',
  imports: [
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
              [value]="email()"
              (valueChange)="edit($event.value)"
            />
          </div>
          <span slFieldError live="polite" reserve>{{ error() }}</span>
        </div>
        <div slInline [gap]="3" align="center">
          <button slButton type="submit">Save billing details</button>
          @if (saved()) {
            <span role="status">Saved.</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class FieldValidation {
  readonly email = signal('');
  readonly submitted = signal(false);
  readonly saved = signal(false);
  readonly error = computed(() => (this.submitted() ? emailError(this.email()) : ''));

  edit(value: string): void {
    this.email.set(value);
    this.saved.set(false);
  }

  submit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.saved.set(emailError(this.email()) === '');
  }
}
