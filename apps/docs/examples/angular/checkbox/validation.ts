import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlField, SlFieldError } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-checkbox-validation',
  imports: [ReactiveFormsModule, SlButton, SlCheckbox, SlField, SlFieldError, SlInline, SlStack],
  template: `
    <form novalidate (submit)="submit($event)">
      <div slStack [gap]="4">
        <div slField required [invalid]="error() !== '' ? true : undefined">
          <div slCheckbox [formControl]="terms" (checkedChange)="placed.set(false)">
            I accept the supplier terms for this purchase order
          </div>
          <span slFieldError live="polite" reserve>{{ error() }}</span>
        </div>
        <div slInline [gap]="3" align="center">
          <button slButton type="submit">Place order</button>
          @if (placed()) {
            <span role="status">Order placed.</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class CheckboxValidation {
  readonly terms = new FormControl(false, {
    nonNullable: true,
    validators: Validators.requiredTrue,
  });
  readonly accepted = toSignal(this.terms.valueChanges, { initialValue: this.terms.value });
  readonly submitted = signal(false);
  readonly placed = signal(false);
  readonly error = computed(() =>
    this.submitted() && !this.accepted() ? 'Accept the supplier terms to place the order.' : '',
  );

  submit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.placed.set(this.terms.valid);
  }
}
