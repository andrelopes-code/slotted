import { Component, DestroyRef, inject, signal } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlTextField, SlTextFieldInput, SlTextFieldStart } from '@slotted/angular/text-field';

/** Stands in for the request that checks whether a handle is free. */
const TAKEN = new Set(['admin', 'northwind', 'support']);

@Component({
  selector: 'app-text-field-loading',
  imports: [
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlTextField,
    SlTextFieldInput,
    SlTextFieldStart,
  ],
  template: `
    <div slField [invalid]="taken() ? true : undefined">
      <label slFieldLabel>Handle</label>
      <div slTextField clearable [loading]="checking()">
        <span slTextFieldStart>&#64;</span>
        <input
          slTextFieldInput
          autocomplete="username"
          spellcheck="false"
          [value]="handle()"
          (valueChange)="change($event.value)"
        />
      </div>
      <span slFieldDescription>Lowercase letters, digits and hyphens.</span>
      <span slFieldError live="polite" reserve>
        {{ taken() ? '@' + handle() + ' is already taken.' : '' }}
      </span>
    </div>
  `,
})
export class TextFieldLoading {
  protected readonly handle = signal('northwind-ops');
  protected readonly checking = signal(false);
  protected readonly taken = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected change(next: string) {
    this.handle.set(next);
    this.taken.set(false);
    clearTimeout(this.timer);
    this.checking.set(next !== '');
    if (next === '') return;
    this.timer = setTimeout(() => {
      this.checking.set(false);
      this.taken.set(TAKEN.has(next));
    }, 900);
  }
}
