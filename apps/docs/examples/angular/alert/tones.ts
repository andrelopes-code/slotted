import { Component } from '@angular/core';
import { SlAlert, SlAlertContent, SlAlertTitle } from '@slotted/angular/alert';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-alert-tones',
  imports: [SlAlert, SlAlertContent, SlAlertTitle, SlStack],
  template: `
    <div slStack [gap]="3">
      <section slAlert tone="accent">
        <div slAlertContent>
          <div slAlertTitle>Cycle count starts Monday</div>
        </div>
      </section>
      <section slAlert tone="secondary">
        <div slAlertContent>
          <div slAlertTitle>Carrier rates exclude tax</div>
        </div>
      </section>
      <section slAlert tone="info">
        <div slAlertContent>
          <div slAlertTitle>Reorder points were recalculated</div>
        </div>
      </section>
      <section slAlert tone="success">
        <div slAlertContent>
          <div slAlertTitle>Invoice INV-2041 was sent</div>
        </div>
      </section>
      <section slAlert tone="warning">
        <div slAlertContent>
          <div slAlertTitle>Three shipments miss the pickup window</div>
        </div>
      </section>
      <section slAlert tone="danger">
        <div slAlertContent>
          <div slAlertTitle>Payment to Harbor Freight failed</div>
        </div>
      </section>
    </div>
  `,
})
export class AlertTones {}
