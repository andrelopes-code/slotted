import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTextarea } from '@slotted/angular/textarea';

const MIN_LENGTH = 20;

@Component({
  selector: 'app-textarea-validation',
  imports: [
    ReactiveFormsModule,
    SlButton,
    SlField,
    SlFieldError,
    SlFieldLabel,
    SlInline,
    SlStack,
    SlTextarea,
  ],
  template: `
    <form novalidate (submit)="submit($event)">
      <div slStack [gap]="4">
        <div slField required [invalid]="error() !== '' ? true : undefined">
          <label slFieldLabel>What is wrong with the item?</label>
          <textarea slTextarea [formControl]="details" (valueChange)="sent.set(false)"></textarea>
          <span slFieldError live="polite" reserve>{{ error() }}</span>
        </div>
        <div slInline [gap]="3" align="center">
          <button slButton type="submit">Request a return</button>
          @if (sent()) {
            <span role="status">Return requested.</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class TextareaValidation {
  readonly details = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(MIN_LENGTH)],
  });
  readonly value = toSignal(this.details.valueChanges, { initialValue: this.details.value });
  readonly submitted = signal(false);
  readonly sent = signal(false);
  readonly error = computed(() => {
    this.value();
    if (!this.submitted()) return '';
    if (this.details.hasError('required')) return 'Describe what is wrong with the item.';
    if (this.details.hasError('minlength')) {
      return `Add more detail: at least ${MIN_LENGTH} characters.`;
    }
    return '';
  });

  submit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.sent.set(this.details.valid);
  }
}
