import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-locale',
  imports: [SlField, SlFieldLabel, SlNumberField, SlNumberFieldInput, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Invoice total, United States</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            defaultValue="14800.5"
            locale="en-US"
            [format]="{ currency: 'USD', style: 'currency' }"
          />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Invoice total, Germany</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            defaultValue="14800.5"
            locale="de-DE"
            [format]="{ currency: 'EUR', style: 'currency' }"
          />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Invoice total, Egypt</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            defaultValue="14800.5"
            locale="ar-EG"
            [format]="{ currency: 'EGP', style: 'currency' }"
          />
        </div>
      </div>
    </div>
  `,
})
export class NumberFieldLocale {}
