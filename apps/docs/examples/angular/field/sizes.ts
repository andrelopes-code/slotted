import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-field-sizes',
  imports: [SlField, SlFieldLabel, SlStack, SlTextField, SlTextFieldInput],
  template: `
    <div slStack [gap]="5">
      <div slField size="sm">
        <label slFieldLabel>SKU</label>
        <div slTextField><input slTextFieldInput defaultValue="NW-CHAI-24" /></div>
      </div>
      <div slField size="md">
        <label slFieldLabel>Product name</label>
        <div slTextField><input slTextFieldInput defaultValue="Chai tea, 24 bags" /></div>
      </div>
      <div slField size="lg">
        <label slFieldLabel>Shelf label</label>
        <div slTextField><input slTextFieldInput defaultValue="Chai — spiced black tea" /></div>
      </div>
    </div>
  `,
})
export class FieldSizes {}
