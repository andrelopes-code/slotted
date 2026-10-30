import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import {
  plainDate,
  plainDateTime,
  plainTime,
  toISODateTime,
  type PlainDateTime,
} from '@slotted/core/date';

@Component({
  selector: 'app-datetime-picker-form',
  imports: [
    ReactiveFormsModule,
    SlButton,
    SlDateTimePicker,
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
          <label slFieldLabel>Pickup date and time</label>
          <div
            slDateTimePicker
            formControlName="pickupAt"
            name="pickupAt"
            [min]="earliest"
            [referenceDateTime]="earliest"
          ></div>
          <span slFieldError live="polite" reserve>{{ error() }}</span>
        </div>
        <div slInline align="center" [gap]="3">
          <button slButton type="submit">Book pickup</button>
          <button slButton tone="secondary" type="reset" variant="outline">Reset</button>
          @if (saved(); as message) {
            <span slText size="sm" tone="muted">{{ message }}</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class DateTimePickerForm {
  protected readonly earliest = plainDateTime(plainDate(2026, 10, 1), plainTime(8, 0));
  protected readonly form = new FormGroup({
    pickupAt: new FormControl<PlainDateTime | null>(null, Validators.required),
  });
  private readonly value = toSignal(this.form.controls.pickupAt.valueChanges, {
    initialValue: this.form.controls.pickupAt.value,
  });
  private readonly submitted = signal(false);
  protected readonly saved = signal<string | null>(null);
  protected readonly error = computed(() => {
    this.value();
    const control = this.form.controls.pickupAt;
    if (control.hasError('slottedDateTimeRange')) {
      return 'Choose October 1, 2026 at 8:00 AM or later.';
    }
    if (this.submitted() && control.hasError('required')) return 'Choose a pickup date and time.';
    return '';
  });

  protected submit(): void {
    this.submitted.set(true);
    const pickup = this.form.controls.pickupAt.value;
    this.saved.set(
      this.form.valid && pickup !== null ? `Pickup booked for ${toISODateTime(pickup)}.` : null,
    );
  }

  protected clear(): void {
    this.submitted.set(false);
    this.saved.set(null);
  }
}
