import { Component } from '@angular/core';
import { SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle } from '@slotted/angular/alert';

@Component({
  selector: 'app-alert-basic',
  imports: [SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle],
  template: `
    <section slAlert>
      <div slAlertContent>
        <div slAlertTitle>Spring price list is live</div>
        <p slAlertDescription>The new prices took effect for 1,240 products at 6:00 AM.</p>
      </div>
    </section>
  `,
})
export class AlertBasic {}
