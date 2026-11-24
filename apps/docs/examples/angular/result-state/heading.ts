import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';

@Component({
  selector: 'app-result-state-heading',
  imports: [
    SlButton,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
  ],
  template: `
    <section slResultState reach="page" status="not-found">
      <div slResultStateContent>
        <h1 slResultStateTitle>Order not found</h1>
        <p slResultStateDescription>
          Nothing exists at /orders/SO-10492-REV3. The order may have been deleted or merged.
        </p>
      </div>
      <div slResultStateActions>
        <button slButton>Back to orders</button>
      </div>
    </section>
  `,
})
export class ResultStateHeading {}
