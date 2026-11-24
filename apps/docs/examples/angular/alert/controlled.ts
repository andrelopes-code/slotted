import { Component, signal } from '@angular/core';
import { SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle } from '@slotted/angular/alert';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-alert-controlled',
  imports: [SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle, SlButton, SlInline, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slInline>
        <button
          slButton
          variant="outline"
          type="button"
          [disabled]="open()"
          (click)="open.set(true)"
        >
          Show import summary
        </button>
      </div>
      <section
        slAlert
        dismissible
        tone="success"
        [open]="open()"
        (openChange)="open.set($event.value)"
      >
        <div slAlertContent>
          <div slAlertTitle>Import finished</div>
          <p slAlertDescription>412 of 415 rows were added to the catalog.</p>
        </div>
      </section>
    </div>
  `,
})
export class AlertControlled {
  protected readonly open = signal(true);
}
