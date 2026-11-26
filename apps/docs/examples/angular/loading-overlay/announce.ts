import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlInline } from '@slotted/angular/inline';
import { SlLoadingOverlay } from '@slotted/angular/loading-overlay';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-loading-overlay-announce',
  imports: [SlButton, SlCard, SlCardBody, SlHeading, SlInline, SlLoadingOverlay, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slInline [gap]="2">
        <button slButton (click)="save()">Save prices</button>
        <button slButton variant="outline" (click)="refresh()">Refresh stock</button>
      </div>
      <div
        slLoadingOverlay
        loadedLabel="Prices saved"
        [loading]="saving()"
        [messages]="{ label: 'Saving prices' }"
      >
        <div slCard>
          <div slCardBody>
            <h3 slHeading size="md">Price list</h3>
            <p slText>Announces the wait and the result.</p>
          </div>
        </div>
      </div>
      <div
        slLoadingOverlay
        live="off"
        [loading]="refreshing()"
        [messages]="{ label: 'Refreshing stock' }"
      >
        <div slCard>
          <div slCardBody>
            <h3 slHeading size="md">Stock levels</h3>
            <p slText>Announces nothing: the page says it elsewhere.</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoadingOverlayAnnounce {
  protected readonly saving = signal(false);
  protected readonly refreshing = signal(false);

  protected save() {
    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 2500);
  }

  protected refresh() {
    this.refreshing.set(true);
    setTimeout(() => this.refreshing.set(false), 2500);
  }
}
