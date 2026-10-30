import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlNumberField, SlNumberFieldEnd, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-clamp',
  imports: [
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlNumberField,
    SlNumberFieldEnd,
    SlNumberFieldInput,
    SlStack,
  ],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Line discount</label>
        <div slNumberField>
          <input slNumberFieldInput clamp="blur" defaultValue="10" min="0" max="25" />
          <span slNumberFieldEnd>%</span>
        </div>
        <span slFieldDescription>Type 40 and leave the field: it returns to 25.</span>
      </div>
      <div slField>
        <label slFieldLabel>Order discount</label>
        <div slNumberField>
          <input slNumberFieldInput clamp="strict" defaultValue="10" min="0" max="25" />
          <span slNumberFieldEnd>%</span>
        </div>
        <span slFieldDescription>A keystroke that would pass 25 is refused.</span>
      </div>
      <div slField>
        <label slFieldLabel>Contract discount</label>
        <div slNumberField>
          <input slNumberFieldInput clamp="none" defaultValue="10" min="0" max="25" />
          <span slNumberFieldEnd>%</span>
        </div>
        <span slFieldDescription>40 stays, and the field is marked invalid.</span>
      </div>
    </div>
  `,
})
export class NumberFieldClamp {}
