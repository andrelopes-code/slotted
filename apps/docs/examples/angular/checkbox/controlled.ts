import { Component, signal } from '@angular/core';
import { SlCheckbox, SlCheckboxDescription } from '@slotted/angular/checkbox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-checkbox-controlled',
  imports: [
    SlCheckbox,
    SlCheckboxDescription,
    SlField,
    SlFieldLabel,
    SlStack,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slStack [gap]="4">
      <div slCheckbox [checked]="sameAddress()" (checkedChange)="sameAddress.set($event.value)">
        Bill to the shipping address
        <p slCheckboxDescription>Ships to 12 Orchestra Terrace, Walla Walla, WA 99362.</p>
      </div>
      @if (!sameAddress()) {
        <div slField required>
          <label slFieldLabel>Billing address</label>
          <div slTextField>
            <input slTextFieldInput autocomplete="billing street-address" />
          </div>
        </div>
      }
    </div>
  `,
})
export class CheckboxControlled {
  readonly sameAddress = signal(true);
}
