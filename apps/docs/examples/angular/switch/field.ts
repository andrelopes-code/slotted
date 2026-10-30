import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlSwitch } from '@slotted/angular/switch';

@Component({
  selector: 'app-switch-field',
  imports: [SlField, SlFieldDescription, SlFieldError, SlFieldLabel, SlStack, SlSwitch],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Backorders</label>
        <span slSwitch>Accept orders when an item is out of stock</span>
        <span slFieldDescription>Customers see the restock date at checkout.</span>
      </div>
      <div slField invalid>
        <label slFieldLabel>Sales tax</label>
        <span slSwitch defaultChecked>Collect tax on orders shipped to Nevada</span>
        <span slFieldError>Add a Nevada tax ID before collecting tax there.</span>
      </div>
    </div>
  `,
})
export class SwitchField {}
