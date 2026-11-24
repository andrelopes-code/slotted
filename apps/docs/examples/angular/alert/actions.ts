import { Component } from '@angular/core';
import {
  SlAlert,
  SlAlertActions,
  SlAlertContent,
  SlAlertDescription,
  SlAlertTitle,
} from '@slotted/angular/alert';
import { SlButton } from '@slotted/angular/button';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-alert-actions',
  imports: [
    SlAlert,
    SlAlertActions,
    SlAlertContent,
    SlAlertDescription,
    SlAlertTitle,
    SlButton,
    SlStack,
  ],
  template: `
    <div slStack [gap]="4">
      <section slAlert tone="warning">
        <div slAlertContent>
          <div slAlertTitle>Your Northwind plan renews in three days</div>
        </div>
        <div slAlertActions>
          <button slButton type="button">Renew now</button>
          <button slButton variant="ghost" type="button">View plans</button>
        </div>
      </section>
      <section slAlert actionsPlacement="end" tone="info">
        <div slAlertContent>
          <p slAlertDescription>The suggestion changes three lines of purchase order PO-7712.</p>
        </div>
        <div slAlertActions>
          <button slButton type="button">Apply</button>
        </div>
      </section>
      <section slAlert reach="page" tone="danger">
        <div slAlertContent>
          <div slAlertTitle>Payments are paused for the Rotterdam warehouse</div>
        </div>
        <div slAlertActions>
          <button slButton type="button">Resolve</button>
        </div>
      </section>
    </div>
  `,
})
export class AlertActions {}
