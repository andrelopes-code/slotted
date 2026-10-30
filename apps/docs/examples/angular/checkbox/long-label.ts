import { Component } from '@angular/core';
import { SlCheckbox, SlCheckboxDescription } from '@slotted/angular/checkbox';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-checkbox-long-label',
  imports: [SlCheckbox, SlCheckboxDescription, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slCheckbox defaultChecked>
        Send notices about contract changes, delivery deadlines and changes to the return policy for
        this store and every other store in the group
        <p slCheckboxDescription>Notices go to the billing contact on the account.</p>
      </div>
      <div slCheckbox>
        Forward order events to https://hooks.northwind.example/orders/fulfilment-updates
      </div>
    </div>
  `,
})
export class CheckboxLongLabel {}
