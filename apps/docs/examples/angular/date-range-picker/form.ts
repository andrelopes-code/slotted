import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, type ValidatorFn } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlDateRangePicker, type DateRange } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { toISODate } from '@slotted/core/date';

/** Both ends present: Validators.required accepts a range with one end open. */
const bothEnds: ValidatorFn = (control) => {
  const range = control.value as DateRange | null;
  return range?.start && range.end ? null : { bothEnds: true };
};

@Component({
  selector: 'app-date-range-picker-form',
  imports: [
    ReactiveFormsModule,
    SlButton,
    SlDateRangePicker,
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
          <label slFieldLabel>Code freeze</label>
          <div
            slDateRangePicker
            startName="freezeStart"
            endName="freezeEnd"
            formControlName="freeze"
          ></div>
          <span slFieldError live="polite" reserve>{{ error() }}</span>
        </div>
        <div slInline [gap]="3" align="center">
          <button slButton type="submit">Save freeze</button>
          <button slButton type="reset" tone="secondary" variant="outline">Reset</button>
          @if (saved(); as message) {
            <span slText size="sm" tone="muted">{{ message }}</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class DateRangePickerForm {
  protected readonly form = new FormGroup({
    freeze: new FormControl<DateRange | null>(null, bothEnds),
  });
  private readonly value = toSignal(this.form.controls.freeze.valueChanges, {
    initialValue: this.form.controls.freeze.value,
  });
  private readonly submitted = signal(false);
  protected readonly saved = signal<string | null>(null);
  protected readonly error = computed(() => {
    this.value();
    const control = this.form.controls.freeze;
    if (control.hasError('slottedDateRangeOrder')) {
      return 'The end date must be on or after the start date.';
    }
    if (this.submitted() && control.hasError('bothEnds')) return 'Enter a start and an end date.';
    return '';
  });

  protected submit(): void {
    this.submitted.set(true);
    const range = this.form.controls.freeze.value;
    this.saved.set(
      this.form.valid && range?.start && range.end
        ? `Freeze saved from ${toISODate(range.start)} to ${toISODate(range.end)}.`
        : null,
    );
  }

  protected clear(): void {
    this.submitted.set(false);
    this.saved.set(null);
  }
}
