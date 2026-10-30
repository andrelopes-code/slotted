import { Component, signal } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlSwitch, SlSwitchDescription } from '@slotted/angular/switch';

@Component({
  selector: 'app-switch-indicator',
  imports: [SlStack, SlSwitch, SlSwitchDescription],
  template: `
    <div slStack [gap]="5">
      <span slSwitch defaultChecked>Accept backorders</span>
      <span slSwitch [checked]="open()" indicator="none" (checkedChange)="open.set($event.value)">
        Storefront
        <p slSwitchDescription>
          {{
            open()
              ? 'Open: customers can place orders.'
              : 'Closed: customers see a maintenance page.'
          }}
        </p>
      </span>
    </div>
  `,
})
export class SwitchIndicator {
  protected readonly open = signal(true);
}
