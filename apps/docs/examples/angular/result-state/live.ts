import { Component } from '@angular/core';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-result-state-live',
  imports: [
    SlResultState,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="6">
      <div slStack [gap]="1">
        <p slText size="sm" tone="muted">polite: role status</p>
        <section slResultState align="start" live="polite" reach="inline" status="no-results">
          <div slResultStateContent>
            <div slResultStateTitle>No orders match this search</div>
            <p slResultStateDescription>Check the spelling or search by order number.</p>
          </div>
        </section>
      </div>

      <div slStack [gap]="1">
        <p slText size="sm" tone="muted">assertive: role alert</p>
        <section slResultState align="start" live="assertive" reach="inline" status="error">
          <div slResultStateContent>
            <div slResultStateTitle>Payment was declined</div>
            <p slResultStateDescription>Use another card to complete the order.</p>
          </div>
        </section>
      </div>

      <div slStack [gap]="1">
        <p slText size="sm" tone="muted">off: no role</p>
        <section slResultState align="start" live="off" reach="inline">
          <div slResultStateContent>
            <div slResultStateTitle>No drafts</div>
            <p slResultStateDescription>A live region on this screen announces changes.</p>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class ResultStateLive {}
