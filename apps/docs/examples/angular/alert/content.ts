import { Component } from '@angular/core';
import { SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle } from '@slotted/angular/alert';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-alert-content',
  imports: [SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle, SlStack],
  template: `
    <div slStack [gap]="3">
      <section slAlert tone="danger">
        <div slAlertContent>
          <div slAlertTitle>Deploy failed</div>
          <p slAlertDescription>
            Image sha256:9f2c1ab4e0d37c58b1e6a7d94f03c2b85a1d6e7f4039bc82e15d7a60f3b9c418 was not
            found in the registry.
          </p>
        </div>
      </section>
      <section slAlert hideIcon tone="warning">
        <div slAlertContent>
          <div slAlertTitle>Recount required</div>
          <p slAlertDescription>Aisle 14 differs from the system by 3.2%.</p>
        </div>
      </section>
      <section slAlert tone="success">
        <div slAlertContent>
          <div slAlertTitle>Pickup confirmed</div>
        </div>
      </section>
      <section slAlert tone="info">
        <div slAlertContent>
          <p slAlertDescription>Rates were updated this morning.</p>
        </div>
      </section>
    </div>
  `,
})
export class AlertContentExample {}
