import { Component } from '@angular/core';
import {
  provideAlertDefaults,
  SlAlert,
  SlAlertContent,
  SlAlertTitle,
} from '@slotted/angular/alert';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-alert-defaults',
  imports: [SlAlert, SlAlertContent, SlAlertTitle, SlStack],
  providers: [provideAlertDefaults({ reach: 'inline', tone: 'warning', variant: 'outline' })],
  template: `
    <div slStack [gap]="3">
      <section slAlert>
        <div slAlertContent>
          <div slAlertTitle>Low stock: Oak desk, 4 left</div>
        </div>
      </section>
      <section slAlert>
        <div slAlertContent>
          <div slAlertTitle>Low stock: Desk lamp, 7 left</div>
        </div>
      </section>
      <section slAlert tone="danger">
        <div slAlertContent>
          <div slAlertTitle>Out of stock: Task chair</div>
        </div>
      </section>
    </div>
  `,
})
export class AlertDefaults {}
