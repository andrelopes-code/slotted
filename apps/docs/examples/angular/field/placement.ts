import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-field-placement',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlStack, SlTextField, SlTextFieldInput],
  template: `
    <div slStack [gap]="4">
      <div slField labelPlacement="side" required>
        <label slFieldLabel>Legal name</label>
        <div slTextField><input slTextFieldInput defaultValue="Northwind Traders Ltd." /></div>
      </div>
      <div slField labelPlacement="side" required>
        <label slFieldLabel>Billing email</label>
        <div slTextField>
          <input slTextFieldInput type="email" defaultValue="billing@northwind.example" />
        </div>
        <span slFieldDescription>Invoices and payment receipts are sent here.</span>
      </div>
      <div slField labelPlacement="side">
        <label slFieldLabel>VAT number</label>
        <div slTextField><input slTextFieldInput defaultValue="GB 284 9113 07" /></div>
      </div>
    </div>
  `,
})
export class FieldPlacement {}
