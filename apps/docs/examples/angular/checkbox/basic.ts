import { Component } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-checkbox-basic',
  imports: [SlCheckbox, SlStack],
  template: `
    <div slStack [gap]="3">
      <div slCheckbox defaultChecked>Email the invoice to the customer</div>
      <div slCheckbox defaultChecked>Include a packing slip</div>
      <div slCheckbox>Gift-wrap the order</div>
    </div>
  `,
})
export class CheckboxBasic {}
