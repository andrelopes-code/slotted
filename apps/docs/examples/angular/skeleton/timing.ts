import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { provideSkeletonDefaults, SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-skeleton-timing',
  imports: [SlButton, SlInline, SlSkeleton, SlSkeletonRegion, SlStack, SlText],
  providers: [provideSkeletonDefaults({ delay: 200, minDuration: 400 })],
  template: `
    <div slStack [gap]="4">
      <div slInline [gap]="2">
        <button slButton size="sm" variant="outline" [disabled]="loading()" (click)="load(80)">
          Respond in 80 ms
        </button>
        <button slButton size="sm" variant="outline" [disabled]="loading()" (click)="load(250)">
          Respond in 250 ms
        </button>
        <button slButton size="sm" variant="outline" [disabled]="loading()" (click)="load(1500)">
          Respond in 1.5 s
        </button>
      </div>
      <div
        slSkeletonRegion
        [loading]="loading()"
        [messages]="{ label: 'Loading the shipment' }"
        (reveal)="countWithdrawn()"
      >
        <span slSkeleton>
          <span slText>Pallet PL-4821 left dock 6 at 14:05.</span>
        </span>
      </div>
      <span slText size="sm" tone="muted">Placeholders withdrawn: {{ withdrawn() }}</span>
    </div>
  `,
})
export class SkeletonTiming {
  protected readonly loading = signal(false);
  protected readonly withdrawn = signal(0);

  protected load(duration: number): void {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), duration);
  }

  protected countWithdrawn(): void {
    this.withdrawn.update((count) => count + 1);
  }
}
