import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlLink } from '@slotted/angular/link';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateFooter,
  SlResultStateTitle,
} from '@slotted/angular/result-state';

@Component({
  selector: 'app-result-state-actions',
  imports: [
    SlButton,
    SlLink,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateFooter,
    SlResultStateTitle,
  ],
  template: `
    <section slResultState status="error">
      <div slResultStateContent>
        <div slResultStateTitle>Carrier rates did not load</div>
        <p slResultStateDescription>
          The rate service timed out, so shipping costs are not shown. Your cart is unchanged.
        </p>
      </div>
      <div slResultStateActions>
        <button slButton>Try again</button>
        <button slButton variant="outline">Use flat rate</button>
      </div>
      <div slResultStateFooter>
        <a slLink href="#retries">How retries are counted</a>
      </div>
    </section>
  `,
})
export class ResultStateActionsExample {}
