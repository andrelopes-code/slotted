import { Component } from '@angular/core';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlDivider } from '@slotted/angular/divider';
import { SlStack } from '@slotted/angular/stack';
import { provideSwitchDefaults, SlSwitch, SlSwitchDescription } from '@slotted/angular/switch';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-switch-settings',
  imports: [
    SlCard,
    SlCardBody,
    SlCardHeader,
    SlDivider,
    SlHeading,
    SlStack,
    SlSwitch,
    SlSwitchDescription,
    SlText,
  ],
  providers: [provideSwitchDefaults({ labelPlacement: 'start' })],
  template: `
    <div slCard>
      <div slCardHeader>
        <h3 slHeading size="md">Warehouse notifications</h3>
        <p slText size="sm" tone="muted">Sent to ops&#64;northwind.example.</p>
      </div>
      <div slCardBody>
        <div slStack [gap]="4">
          <span slSwitch defaultChecked>
            Low stock
            <p slSwitchDescription>When a product falls below its reorder point.</p>
          </span>
          <hr slDivider />
          <span slSwitch defaultChecked>
            Late pickups
            <p slSwitchDescription>When a carrier misses its pickup window.</p>
          </span>
          <hr slDivider />
          <span slSwitch>
            Cycle count variances
            <p slSwitchDescription>When a count differs from the system by more than 2%.</p>
          </span>
        </div>
      </div>
    </div>
  `,
})
export class SwitchSettings {}
