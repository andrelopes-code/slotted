import { Component } from '@angular/core';
import { SlCheckbox, SlCheckboxDescription } from '@slotted/angular/checkbox';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-checkbox-description',
  imports: [SlCheckbox, SlCheckboxDescription, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slCheckbox defaultChecked>
        Email me when a payment fails
        <p slCheckboxDescription>One message per failed payment, sent to the billing contact.</p>
      </div>
      <div slCheckbox>
        Send a daily summary instead
        <p slCheckboxDescription>
          Sent at 08:00 in the account's time zone, and skipped on days with no failures.
        </p>
      </div>
    </div>
  `,
})
export class CheckboxDescription {}
