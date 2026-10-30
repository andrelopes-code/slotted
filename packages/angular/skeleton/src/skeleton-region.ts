import { type PartialMessages, skeletonMessages, type SkeletonMessages } from '@slotted/core/i18n';
import { initialLoadingVisibility, nextLoadingVisibility } from '@slotted/core/loading';
import type { LoadingVisibilityState } from '@slotted/core/loading';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';

import { injectSkeletonDefaults } from './skeleton-defaults';
import {
  SKELETON_DEFAULT_ANIMATION,
  SKELETON_DEFAULT_LIVE,
  type SkeletonAnimation,
  type SkeletonLive,
} from './skeleton.constants';

/**
 * The thing that is loading, rather than the shapes drawn on it.
 *
 * It owns four facts the boxes inside it cannot own on their own. It carries
 * `aria-busy`, which is the platform's own answer — ARIA 1.2 asks an author to
 * set it "on the container element before the first change" and clear it "when
 * the last change is complete". It holds the one announcement: twelve
 * placeholders are one wait, and PatternFly, the only surveyed library that
 * announces at all, puts the text on each box and then has to warn its readers
 * to give every one of them different words. It takes its whole subtree out of
 * the tab order. And it drives the animation phase every placeholder inside it
 * reads, so a region pulses as one surface instead of as twelve blinks.
 *
 * The selector is a bare attribute, so the element stays the consumer's: a
 * region is whatever already wraps the content — a `section`, a `tbody`, a
 * list item — and wrapping it in a second element would change their layout to
 * carry an attribute.
 *
 * The region itself is never `inert`, and that is deliberate rather than an
 * omission: an inert subtree is not announced, so marking the region would
 * silence the one thing it has to say.
 */
@Component({
  selector: '[slSkeletonRegion]',
  standalone: true,
  template: `@if (liveValue() !== 'off') {
      <span
        data-part="announcement"
        data-part-announcement=""
        data-ui="visually-hidden"
        data-ui-visually-hidden=""
        role="status"
        >{{ announcement() }}</span
      >
    }
    <ng-content />`,
  styleUrls: [
    '../../../styles/src/skeleton/skeleton.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slSkeletonRegion',
  host: {
    'data-ui': 'skeleton',
    'data-ui-skeleton': '',
    'data-part': 'region',
    'data-part-region': '',
    '[attr.data-animation]': 'animationValue()',
    '[attr.data-loading]': 'painted() ? "" : null',
    '[attr.aria-busy]': 'painted() ? "true" : null',
  },
})
export class SlSkeletonRegion {
  readonly loading = input(true, { transform: booleanAttribute });
  readonly animation = input<SkeletonAnimation | undefined>(undefined);
  readonly live = input<SkeletonLive | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: what a
   * screen reader hears once, while the region is waiting (`label`).
   */
  readonly messages = input<PartialMessages<SkeletonMessages> | undefined>(undefined);
  readonly loadedLabel = input<string | undefined>(undefined);
  readonly delay = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly minDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });

  /**
   * The moment the placeholders are actually withdrawn, which is later than
   * `loading` turning false whenever `minDuration` is holding them. An
   * application moving focus on the input alone would move it into
   * placeholders.
   */
  readonly reveal = output<void>();

  private readonly defaults = injectSkeletonDefaults();
  /** The family's words in the language in force, with this region's `messages` laid over them. */
  readonly t = injectMessages(skeletonMessages, this.messages);

  readonly animationValue = computed(
    () => this.animation() ?? this.defaults.animation ?? SKELETON_DEFAULT_ANIMATION,
  );
  readonly liveValue = computed(() => this.live() ?? this.defaults.live ?? SKELETON_DEFAULT_LIVE);
  private readonly delayValue = computed(() => this.delay() ?? this.defaults.delay ?? 0);
  private readonly holdValue = computed(() => this.minDuration() ?? this.defaults.minDuration ?? 0);

  /** Whether the placeholders are painted, which is not the `loading` input. */
  readonly painted = signal(false);

  /**
   * Emptying a live region announces nothing, which is what makes one load one
   * announcement rather than two. A completion message is opt-in for the same
   * reason: a page of six regions would otherwise say six things nobody asked
   * to hear.
   */
  readonly announcement = computed(() =>
    this.painted() ? this.t('label') : (this.loadedLabel() ?? this.defaults.loadedLabel ?? ''),
  );

  private machine: LoadingVisibilityState = initialLoadingVisibility;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));

    effect(() => {
      const request = {
        loading: this.loading(),
        delay: this.delayValue(),
        minDuration: this.holdValue(),
      };
      untracked(() => this.settle(request));
    });
  }

  /**
   * One step of the shared machine, plus at most one timer. The rule lives in
   * `@slotted/core/loading` rather than here so React and Angular cannot
   * disagree about when a placeholder appears — a difference no test that
   * looked at either binding alone would report.
   */
  private settle(request: { loading: boolean; delay: number; minDuration: number }) {
    clearTimeout(this.timer);
    const answer = nextLoadingVisibility({ ...request, now: Date.now(), state: this.machine });
    this.machine = answer.state;

    const was = this.painted();
    this.painted.set(answer.state.visible);
    if (was && !answer.state.visible) this.reveal.emit();

    if (answer.wait === null) return;
    this.timer = setTimeout(() => this.settle(request), answer.wait);
  }
}

/**
 * Absence has to survive the transform. `numberAttribute` maps an unset input
 * to `NaN`, and `NaN` is a value: it would stop the application's own timing
 * decision from ever reaching a region that says nothing.
 */
function optionalNumber(value: unknown): number | undefined {
  return value === undefined || value === null || value === '' ? undefined : numberAttribute(value);
}
