import { Component } from '@angular/core';
import { SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle } from '@slotted/angular/alert';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-alert-dismissible',
  imports: [SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle, SlButton, SlInline, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slInline><button slButton variant="outline" type="button">Export report</button></div>
      <section slAlert dismissible tone="info">
        <div slAlertContent>
          <div slAlertTitle>Carrier tracking links expire in 14 days</div>
          <p slAlertDescription>Download the shipment manifests you still need.</p>
        </div>
      </section>
    </div>
  `,
})
export class AlertDismissible {}
