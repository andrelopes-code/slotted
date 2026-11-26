import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlLoadingOverlay } from '@slotted/angular/loading-overlay';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-loading-overlay-content',
  imports: [SlCard, SlCardBody, SlHeading, SlLoadingOverlay, SlText],
  template: `
    <div
      slLoadingOverlay
      cancellable
      description="Stopping now would leave half the period reconciled."
      [messages]="{
        cancel: 'Stop reconciling',
        label: 'Reconciling the period entries against the bank statement',
      }"
    >
      <div slCard>
        <div slCardBody>
          <h3 slHeading size="md">March close</h3>
          <p slText>1 204 entries, 37 without a bank match.</p>
        </div>
      </div>
    </div>
  `,
})
export class LoadingOverlayContent {}
