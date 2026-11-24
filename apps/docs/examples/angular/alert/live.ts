import { Component, signal } from '@angular/core';
import { SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle } from '@slotted/angular/alert';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';

type Status = 'failed' | 'idle' | 'saved';

@Component({
  selector: 'app-alert-live',
  imports: [SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle, SlButton, SlInline, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slInline [gap]="2">
        <button slButton variant="outline" type="button" (click)="status.set('saved')">
          Save prices
        </button>
        <button slButton variant="outline" type="button" (click)="status.set('failed')">
          Lose connection
        </button>
      </div>
      @if (status() === 'saved') {
        <section slAlert live="polite" tone="success">
          <div slAlertContent>
            <div slAlertTitle>Prices saved</div>
            <p slAlertDescription>Changes to 214 products are live.</p>
          </div>
        </section>
      }
      @if (status() === 'failed') {
        <section slAlert live="assertive" tone="danger">
          <div slAlertContent>
            <div slAlertTitle>Connection lost</div>
            <p slAlertDescription>Price changes are not being saved.</p>
          </div>
        </section>
      }
    </div>
  `,
})
export class AlertLive {
  protected readonly status = signal<Status>('idle');
}
