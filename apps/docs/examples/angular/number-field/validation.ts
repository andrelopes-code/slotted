import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-validation',
  imports: [
    ReactiveFormsModule,
    SlButton,
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlInline,
    SlNumberField,
    SlNumberFieldInput,
    SlStack,
  ],
  template: `
    <form novalidate (submit)="submit($event)">
      <div slStack [gap]="4">
        <div slField required [invalid]="error() !== '' ? true : undefined">
          <label slFieldLabel>Units of Chai to ship</label>
          <div slNumberField>
            <input
              slNumberFieldInput
              name="quantity"
              min="1"
              max="39"
              [formControl]="quantity"
              (valueChange)="sent.set('')"
            />
          </div>
          <span slFieldDescription>39 units in stock.</span>
          <span slFieldError live="polite" reserve>{{ error() }}</span>
        </div>
        <div slInline [gap]="3">
          <button slButton type="submit">Create shipment</button>
          @if (sent() !== '') {
            <span role="status">{{ sent() }}</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class NumberFieldValidation {
  readonly quantity = new FormControl<number | null>(null, Validators.required);
  readonly value = toSignal(this.quantity.valueChanges, { initialValue: this.quantity.value });
  readonly submitted = signal(false);
  readonly sent = signal('');
  readonly error = computed(() =>
    this.submitted() && this.value() === null ? 'Enter how many units to ship.' : '',
  );

  submit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    const data = new FormData(event.target as HTMLFormElement);
    this.sent.set(this.quantity.valid ? `Sent quantity=${String(data.get('quantity'))}` : '');
  }
}
