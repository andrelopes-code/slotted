import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-text-field-variants',
  imports: [SlField, SlFieldLabel, SlStack, SlTextField, SlTextFieldInput],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Customer</label>
        <div slTextField variant="outline">
          <input slTextFieldInput defaultValue="Northwind Traders" />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Purchase order</label>
        <div slTextField variant="subtle">
          <input slTextFieldInput defaultValue="PO-2026-0412" />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>SKU</label>
        <div slTextField variant="plain" mono>
          <input slTextFieldInput defaultValue="NW-TEA-1042" />
        </div>
      </div>
    </div>
  `,
})
export class TextFieldVariants {}
