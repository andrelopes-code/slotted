import { Component, signal } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlSwitch, SlSwitchDescription } from '@slotted/angular/switch';

@Component({
  selector: 'app-switch-controlled',
  imports: [SlStack, SlSwitch, SlSwitchDescription],
  template: `
    <div slStack [gap]="5">
      <span
        slSwitch
        [checked]="paused()"
        labelPlacement="start"
        (checkedChange)="paused.set($event.value)"
      >
        Pause all alerts
        <p slSwitchDescription>Turns off the alerts below until you resume.</p>
      </span>
      <div slStack [gap]="4">
        <span slSwitch defaultChecked [disabled]="paused()" labelPlacement="start">New orders</span>
        <span slSwitch defaultChecked [disabled]="paused()" labelPlacement="start">
          Failed payments
        </span>
        <span slSwitch [disabled]="paused()" labelPlacement="start">Return requests</span>
      </div>
    </div>
  `,
})
export class SwitchControlled {
  protected readonly paused = signal(false);
}
