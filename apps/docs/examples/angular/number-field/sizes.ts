import { Component } from '@angular/core';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-sizes',
  imports: [SlNumberField, SlNumberFieldInput, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slNumberField size="sm">
        <input slNumberFieldInput aria-label="Units per case" defaultValue="24" min="1" />
      </div>
      <div slNumberField size="md">
        <input slNumberFieldInput aria-label="Cases ordered" defaultValue="12" min="1" />
      </div>
      <div slNumberField size="lg">
        <input slNumberFieldInput aria-label="Pallets ordered" defaultValue="2" min="1" />
      </div>
    </div>
  `,
})
export class NumberFieldSizes {}
