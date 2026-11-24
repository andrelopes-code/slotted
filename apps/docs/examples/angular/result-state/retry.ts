import { Component, DestroyRef, inject, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';

type Phase = 'failed' | 'retrying' | 'loaded';

@Component({
  selector: 'app-result-state-retry',
  imports: [
    SlButton,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
  ],
  template: `
    <section slResultState [status]="phase() === 'loaded' ? 'success' : 'error'">
      <div slResultStateContent>
        <div slResultStateTitle>
          {{ phase() === 'loaded' ? 'Carrier rates loaded' : 'Carrier rates did not load' }}
        </div>
        <p slResultStateDescription>
          {{
            phase() === 'loaded'
              ? 'Showing 14 shipping options for 3 packages.'
              : 'The rate service timed out. Your cart is unchanged.'
          }}
        </p>
      </div>
      @if (phase() !== 'loaded') {
        <div slResultStateActions>
          <button slButton [loading]="phase() === 'retrying'" (click)="retry()">Try again</button>
        </div>
      }
    </section>
  `,
})
export class ResultStateRetry {
  protected readonly phase = signal<Phase>('failed');

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected retry() {
    this.phase.set('retrying');
    this.timer = setTimeout(() => this.phase.set('loaded'), 1500);
  }
}
