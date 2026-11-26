import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlInline } from '@slotted/angular/inline';
import { SlLoadingOverlay, SlLoadingOverlayCancel } from '@slotted/angular/loading-overlay';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-loading-overlay-compose',
  imports: [
    SlButton,
    SlCard,
    SlCardBody,
    SlHeading,
    SlInline,
    SlLoadingOverlay,
    SlLoadingOverlayCancel,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="4">
      <div slInline>
        <button slButton variant="outline" (click)="syncing.set(true)">Sync again</button>
      </div>
      <section
        slLoadingOverlay
        cancellable
        [loading]="syncing()"
        [messages]="{ label: 'Syncing the warehouse feed' }"
        (cancel)="syncing.set(false)"
      >
        <button slButton slLoadingOverlayCancel size="sm" type="button" variant="outline">
          Cancel
        </button>
        <div slCard>
          <div slCardBody>
            <h3 slHeading size="md">Warehouse feed</h3>
            <p slText>Lisbon and Rotterdam, 6 docks.</p>
            <p slText>Last sync at 09:40, 212 pallets received.</p>
            <p slText>Next sync at 10:10.</p>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class LoadingOverlayCompose {
  protected readonly syncing = signal(true);
}
