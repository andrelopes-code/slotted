import { Component } from '@angular/core';
import { SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle } from '@slotted/angular/alert';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-alert-reach',
  imports: [SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle, SlStack],
  template: `
    <div slStack [gap]="4">
      <section slAlert reach="inline" tone="danger">
        <div slAlertContent>
          <p slAlertDescription>Enter a valid EIN, such as 12-3456789.</p>
        </div>
      </section>
      <section slAlert reach="section" tone="warning">
        <div slAlertContent>
          <div slAlertTitle>Billing address is incomplete</div>
          <p slAlertDescription>Add a postal code before Northwind can issue invoices.</p>
        </div>
      </section>
      <section slAlert reach="page" tone="info">
        <div slAlertContent>
          <div slAlertTitle>Scheduled maintenance on Saturday from 1:00 AM to 3:00 AM</div>
        </div>
      </section>
    </div>
  `,
})
export class AlertReach {}
