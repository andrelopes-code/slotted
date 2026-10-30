import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlSwitch, SlSwitchDescription } from '@slotted/angular/switch';

@Component({
  selector: 'app-switch-states',
  imports: [SlStack, SlSwitch, SlSwitchDescription],
  template: `
    <div slStack [gap]="5">
      <span slSwitch defaultChecked readOnly>
        Two-step sign-in
        <p slSwitchDescription>Your organization's security policy sets this.</p>
      </span>
      <span slSwitch defaultChecked disabled>
        Audit log
        <p slSwitchDescription>Included in the Business plan.</p>
      </span>
      <span slSwitch disabled>
        Single sign-on
        <p slSwitchDescription>Available on the Enterprise plan.</p>
      </span>
    </div>
  `,
})
export class SwitchStates {}
