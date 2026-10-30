import { Component, signal } from '@angular/core';
import { SlButton, SlButtonStart } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-button-loading',
  imports: [SlButton, SlButtonStart, SlGlyph, SlInline],
  template: `
    <div slInline [gap]="2">
      <button
        slButton
        tone="secondary"
        variant="outline"
        [loading]="syncing()"
        [messages]="{ loading: 'Syncing' }"
        (click)="sync()"
      >
        <span slButtonStart><svg slGlyph name="rotate-ccw"></svg></span>
        Sync inventory
      </button>
      <button
        slButton
        [loading]="sending()"
        [loadingDelay]="300"
        [messages]="{ loading: 'Sending' }"
        (click)="send()"
      >
        Send invoice
      </button>
    </div>
  `,
})
export class ButtonLoading {
  readonly syncing = signal(false);
  readonly sending = signal(false);

  sync(): void {
    this.syncing.set(true);
    setTimeout(() => this.syncing.set(false), 2000);
  }

  send(): void {
    this.sending.set(true);
    setTimeout(() => this.sending.set(false), 2000);
  }
}
