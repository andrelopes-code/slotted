import { Component, signal } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  SlTextField,
  SlTextFieldAction,
  SlTextFieldEnd,
  SlTextFieldInput,
} from '@slotted/angular/text-field';

@Component({
  selector: 'app-text-field-action',
  imports: [
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlTextField,
    SlTextFieldAction,
    SlTextFieldEnd,
    SlTextFieldInput,
  ],
  template: `
    <form (submit)="apply($event)">
      <div slField>
        <label slFieldLabel>Discount code</label>
        <div slTextField mono>
          <input slTextFieldInput name="code" autocomplete="off" defaultValue="SPRING10" />
          <span slTextFieldEnd><button slTextFieldAction type="submit">Apply</button></span>
        </div>
        <span slFieldDescription>
          {{ applied() === '' ? 'One code per order.' : applied() + ' is applied to this order.' }}
        </span>
      </div>
    </form>
  `,
})
export class TextFieldActionExample {
  protected readonly applied = signal('');

  protected apply(event: SubmitEvent) {
    event.preventDefault();
    const code = new FormData(event.target as HTMLFormElement).get('code');
    this.applied.set(typeof code === 'string' ? code.trim().toUpperCase() : '');
  }
}
