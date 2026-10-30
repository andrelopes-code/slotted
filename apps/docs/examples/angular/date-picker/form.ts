import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { plainDate, toISODate, type PlainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-form',
  imports: [
    ReactiveFormsModule,
    SlButton,
    SlDatePicker,
    SlField,
    SlFieldError,
    SlFieldLabel,
    SlInline,
    SlStack,
    SlText,
  ],
  template: `
    <form novalidate [formGroup]="form" (ngSubmit)="submit()" (reset)="clear()">
      <div slStack [gap]="5">
        <div slField required [invalid]="error() === '' ? undefined : true">
          <label slFieldLabel>Delivery date</label>
          <div
            slDatePicker
            name="deliveryDate"
            formControlName="deliveryDate"
            [min]="earliest"
          ></div>
          <span slFieldError live="polite" reserve>{{ error() }}</span>
        </div>
        <div slInline [gap]="3" align="center">
          <button slButton type="submit">Book delivery</button>
          <button slButton type="reset" tone="secondary" variant="outline">Reset</button>
          @if (saved(); as message) {
            <span slText size="sm" tone="muted">{{ message }}</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class DatePickerForm {
  protected readonly earliest = plainDate(2026, 10, 1);
  protected readonly form = new FormGroup({
    deliveryDate: new FormControl<PlainDate | null>(null, Validators.required),
  });
  private readonly value = toSignal(this.form.controls.deliveryDate.valueChanges, {
    initialValue: this.form.controls.deliveryDate.value,
  });
  private readonly submitted = signal(false);
  protected readonly saved = signal<string | null>(null);
  protected readonly error = computed(() => {
    this.value();
    const control = this.form.controls.deliveryDate;
    if (control.hasError('slottedDateRange')) return 'Choose October 1, 2026 or later.';
    if (this.submitted() && control.hasError('required')) return 'Choose a delivery date.';
    return '';
  });

  protected submit(): void {
    this.submitted.set(true);
    const date = this.form.controls.deliveryDate.value;
    this.saved.set(
      this.form.valid && date !== null ? `Delivery booked for ${toISODate(date)}.` : null,
    );
  }

  protected clear(): void {
    this.submitted.set(false);
    this.saved.set(null);
  }
}
