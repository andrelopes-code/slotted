import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { SlToastRegion } from './toast';
import { SlToastService } from './toast-defaults';
import type {
  ToastInput,
  ToastPlacement,
  ToastPromiseInput,
  ToastStacking,
} from './toast-defaults';

/**
 * A region of its own per demonstration, inside a box that stands in for the
 * screen.
 *
 * Two things a reference page has to solve that an application does not. A
 * toast is transient, so a page whose messages have all expired shows an empty
 * canvas — the seeded messages are given no duration, and the caption of every
 * scene says the timer is what an application would use. And a page holds
 * thirteen demonstrations at once, so each takes a service of its own through a
 * component-level provider rather than thirteen scenes writing into one corner
 * of the screen.
 *
 * `.slotted-demo-viewport` is the workbench's own box: positioned, so
 * `attach="inline"` has something to resolve against, and clipping, so the
 * region is inside the scene rather than over the page.
 */
@Component({
  selector: 'sl-toast-demo',
  standalone: true,
  exportAs: 'slToastDemo',
  imports: [SlToastRegion],
  providers: [SlToastService],
  template: `<div class="slotted-demo-viewport" [attr.data-size]="size()">
      <sl-toast-region
        attach="inline"
        [limit]="limit()"
        [placement]="placement()"
        [stacking]="stacking()"
        [swipe]="swipe()"
      />
    </div>
    <div class="slotted-demo-row"><ng-content /></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
})
export class SlToastDemo {
  readonly seed = input<readonly ToastInput[]>([]);
  readonly size = input<'layer' | 'tall'>('layer');
  readonly placement = input<ToastPlacement | undefined>(undefined);
  readonly stacking = input<ToastStacking | undefined>(undefined);
  readonly limit = input<number | undefined>(undefined);
  readonly swipe = input<boolean | undefined>(undefined);

  constructor(private readonly toasts: SlToastService) {
    let seeded = false;
    effect(() => {
      if (seeded) return;
      seeded = true;
      for (const message of this.seed()) this.toasts.show({ duration: 0, ...message });
    });
  }

  /** What a trigger inside the demonstration calls. */
  show(input: ToastInput): string {
    return this.toasts.show(input);
  }

  dismiss(id: string): void {
    this.toasts.dismiss(id, 'pointer');
  }

  promise<Value>(promise: Promise<Value>, input: ToastPromiseInput<Value>): void {
    void this.toasts.promise(promise, input).catch(() => undefined);
  }
}
