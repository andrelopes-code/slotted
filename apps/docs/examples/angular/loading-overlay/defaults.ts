import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { provideLoadingOverlayDefaults, SlLoadingOverlay } from '@slotted/angular/loading-overlay';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-loading-overlay-defaults',
  imports: [SlCard, SlCardBody, SlHeading, SlLoadingOverlay, SlStack, SlText],
  providers: [
    provideLoadingOverlayDefaults({ delay: 200, minDuration: 400, size: 'sm', veil: 'blur' }),
  ],
  template: `
    <div slStack [gap]="4">
      <div slLoadingOverlay [messages]="{ label: 'Loading orders' }">
        <div slCard>
          <div slCardBody>
            <h3 slHeading size="md">Open orders</h3>
            <p slText>Takes the blur and the small step from the provider.</p>
          </div>
        </div>
      </div>
      <div slLoadingOverlay veil="wash" [messages]="{ label: 'Loading returns' }">
        <div slCard>
          <div slCardBody>
            <h3 slHeading size="md">Returns</h3>
            <p slText>Keeps the small step and sets its own veil.</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoadingOverlayDefaults {}
