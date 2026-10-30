import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlSwitch } from '@slotted/angular/switch';

@Component({
  selector: 'app-switch-sizes',
  imports: [SlStack, SlSwitch],
  template: `
    <div slStack [gap]="4">
      <span slSwitch size="sm" defaultChecked>Show archived orders</span>
      <span slSwitch size="md" defaultChecked>Group orders by warehouse</span>
      <span slSwitch size="lg" defaultChecked>Print packing slips</span>
    </div>
  `,
})
export class SwitchSizes {}
