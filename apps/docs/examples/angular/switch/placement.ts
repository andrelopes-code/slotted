import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlSwitch, SlSwitchDescription } from '@slotted/angular/switch';

@Component({
  selector: 'app-switch-placement',
  imports: [SlStack, SlSwitch, SlSwitchDescription],
  template: `
    <div slStack [gap]="5">
      <span slSwitch defaultChecked>
        Email me a copy of each invoice
        <p slSwitchDescription>Paid invoices arrive as PDF attachments.</p>
      </span>
      <span slSwitch labelPlacement="start">
        Overdue reminders
        <p slSwitchDescription>Unpaid invoices are flagged on the 5th day.</p>
      </span>
    </div>
  `,
})
export class SwitchPlacement {}
