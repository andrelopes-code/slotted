import { Component } from '@angular/core';
import { SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle } from '@slotted/angular/alert';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-alert-variants',
  imports: [SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle, SlStack],
  template: `
    <div slStack [gap]="3">
      <section slAlert tone="warning" variant="soft">
        <div slAlertContent>
          <div slAlertTitle>Soft</div>
          <p slAlertDescription>Inventory sync is 40 minutes behind.</p>
        </div>
      </section>
      <section slAlert tone="warning" variant="outline">
        <div slAlertContent>
          <div slAlertTitle>Outline</div>
          <p slAlertDescription>Inventory sync is 40 minutes behind.</p>
        </div>
      </section>
      <section slAlert tone="warning" variant="solid">
        <div slAlertContent>
          <div slAlertTitle>Solid</div>
          <p slAlertDescription>Inventory sync is 40 minutes behind.</p>
        </div>
      </section>
    </div>
  `,
})
export class AlertVariants {}
