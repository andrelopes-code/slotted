import { Component } from '@angular/core';
import { SlSwitch, SlSwitchDescription } from '@slotted/angular/switch';

@Component({
  selector: 'app-switch-basic',
  imports: [SlSwitch, SlSwitchDescription],
  template: `
    <span slSwitch defaultChecked labelPlacement="start" name="lowStockAlerts">
      Low-stock alerts
      <p slSwitchDescription>Email the buyer when a product falls below its reorder point.</p>
    </span>
  `,
})
export class SwitchBasic {}
