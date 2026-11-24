import { Component, signal } from '@angular/core';
import { SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle } from '@slotted/angular/alert';
import { SlStack } from '@slotted/angular/stack';
import { SlSwitch } from '@slotted/angular/switch';

@Component({
  selector: 'app-alert-refusal',
  imports: [SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle, SlStack, SlSwitch],
  template: `
    <div slStack [gap]="4">
      <span slSwitch [checked]="reviewed()" (checkedChange)="reviewed.set($event.value)">
        I reviewed the 12 price changes
      </span>
      <section
        slAlert
        dismissible
        tone="warning"
        (openChange)="reviewed() ? null : $event.cancel()"
      >
        <div slAlertContent>
          <div slAlertTitle>12 price changes are waiting for approval</div>
          <p slAlertDescription>The message stays until the changes are reviewed.</p>
        </div>
      </section>
    </div>
  `,
})
export class AlertRefusal {
  protected readonly reviewed = signal(false);
}
