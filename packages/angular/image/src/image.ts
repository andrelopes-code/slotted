import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  forwardRef,
  input,
  linkedSignal,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlAspectRatio } from '@slotted/angular/aspect-ratio';
import type { AspectRatioValue } from '@slotted/angular/aspect-ratio';

import {
  injectImageDefaults,
  type ImageDecoding,
  type ImageFit,
  type ImageLayout,
  type ImageLoading,
  type ImagePlaceholder,
  type ImagePosition,
  type ImagePositionAttribute,
  type ImageRadius,
  type ImageSource,
  type ImageStatus,
} from './image-defaults';
import { IMAGE_MEDIA_HOST } from './image-media-host';
import { SlImageMedia } from './image-media';

export type {
  ImageDecoding,
  ImageDefaults,
  ImageFit,
  ImageLayout,
  ImageLoading,
  ImagePlaceholder,
  ImagePosition,
  ImagePositionAttribute,
  ImageRadius,
  ImageSource,
  ImageStatus,
} from './image-defaults';

const POSITIONS = new Set(['center', 'top', 'bottom', 'start', 'end']);

/** Which of the two URLs the element is showing, and what it said about it. */
interface Derived {
  attempt: 'primary' | 'fallback';
  status: ImageStatus;
}

/**
 * A picture, and what stands in for it before it arrives and after it fails.
 * The `<img>` is the platform's and keeps every attribute the platform gives
 * it; the family adds the two layers under it, a fit, a focal point, a
 * corner and an edge, and composes the frame from `slAspectRatio` when a
 * ratio was decided.
 *
 * The component is written on the element the page chose — a `div`, a
 * `figure`, an `a` that opens a page, a `button` that opens a dialog. The
 * picture is either the `<img>` the component renders for its `src`, or the
 * `<img slImageMedia>` the consumer projects, which is the one `ngSrc` and
 * `NgOptimizedImage` belong on.
 *
 * `status` is an input with an output beside it rather than a `model()`. A
 * `model()` promises a two-way binding for a value the browser owns: the
 * component would write over whatever the consumer passed the first time a
 * picture loaded. Here the consumer's value simply wins, and the output
 * reports the derivation — a load event is a fact rather than a request, so
 * there is nothing to cancel and no reason from the closed vocabulary fits.
 * `fallbackSrc` is tried before `error` is reported, on the component's own
 * `<img>`; a projected picture is the consumer's to retry.
 */
@Component({
  selector: '[slImage]',
  standalone: true,
  exportAs: 'slImage',
  imports: [NgTemplateOutlet, SlAspectRatio, SlGlyph, SlIcon, SlImageMedia],
  providers: [
    /* The component is its own media host, and a decorator is evaluated before
       the class it decorates exists. */
    { provide: IMAGE_MEDIA_HOST, useExisting: forwardRef(() => SlImage) },
  ],
  template: `@if (ratio(); as decided) {
      <div slAspectRatio [ratio]="decided">
        <ng-container *ngTemplateOutlet="layers"></ng-container>
      </div>
    } @else {
      <ng-container *ngTemplateOutlet="layers"></ng-container>
    }
    <ng-template #layers>
      @if (projected() === undefined && src() !== undefined) {
        @if (sources().length > 0) {
          <picture data-part="picture" data-part-picture="">
            @for (source of sources(); track $index) {
              <source
                [attr.srcset]="source.srcSet"
                [attr.media]="source.media ?? null"
                [attr.sizes]="source.sizes ?? null"
                [attr.type]="source.type ?? null"
              />
            }
            <ng-container *ngTemplateOutlet="own"></ng-container>
          </picture>
        } @else {
          <ng-container *ngTemplateOutlet="own"></ng-container>
        }
      }
      <ng-content select="img[slImageMedia]"></ng-content
      ><span data-part="placeholder" data-part-placeholder="" aria-hidden="true">
        @if (resolvedPlaceholder() === 'blur' && placeholderSrc(); as preview) {
          <img alt="" [src]="preview" />
        }
        <ng-content select="[slImagePlaceholder]"></ng-content></span
      ><span data-part="fallback" data-part-fallback=""
        ><ng-content select="[slImageFallback]"
          ><span slIcon><svg slGlyph name="image-off"></svg></span></ng-content
      ></span>
    </ng-template>
    <ng-template #own>
      <img
        slImageMedia
        [src]="shownSrc()"
        [attr.srcset]="srcset() ?? null"
        [attr.sizes]="sizes() ?? null"
        [attr.alt]="alt() ?? ''"
        [attr.width]="width() ?? null"
        [attr.height]="height() ?? null"
        [attr.loading]="resolvedLoading()"
        [attr.decoding]="resolvedDecoding()"
        [attr.fetchpriority]="resolvedFetchPriority()"
        [attr.crossorigin]="crossOrigin() ?? null"
        [attr.referrerpolicy]="referrerPolicy() ?? null"
      />
    </ng-template>`,
  styleUrl: '../../../styles/src/image/image.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'image',
    'data-ui-image': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-layout]': 'resolvedLayout()',
    '[attr.data-fit]': 'resolvedFit()',
    '[attr.data-position]': 'positionAttribute()',
    '[attr.data-radius]': 'resolvedRadius()',
    '[attr.data-placeholder]': 'resolvedPlaceholder()',
    '[attr.data-status]': 'resolvedStatus()',
    '[attr.data-bordered]': "resolvedBordered() ? '' : null",
    '[style.--slotted-image-position]': 'positionToken()',
  },
})
export class SlImage {
  /** The picture. Absent, the component renders no `<img>` of its own and is idle. */
  readonly src = input<string | undefined>(undefined);
  /** The candidates for the component's own `<img>`, as the platform's `srcset`. */
  readonly srcset = input<string | undefined>(undefined);
  /** The platform's `sizes`, beside `srcset`. */
  readonly sizes = input<string | undefined>(undefined);
  /**
   * What the picture shows, or `""` for a picture that is decoration beside
   * its own text. Written on the component's own `<img>`; a projected
   * picture carries its own.
   */
  readonly alt = input<string | undefined>(undefined);
  /** The intrinsic width, which with `height` reserves the ratio before the picture loads. */
  readonly width = input<number | string | undefined>(undefined);
  readonly height = input<number | string | undefined>(undefined);
  readonly crossOrigin = input<'anonymous' | 'use-credentials' | undefined>(undefined);
  readonly referrerPolicy = input<string | undefined>(undefined);
  /**
   * The proportion the box holds before the picture arrives. Renders an
   * `slAspectRatio` inside the host and lays the picture out `framed`.
   */
  readonly ratio = input<AspectRatioValue | undefined>(undefined);
  /** Defaults to the provider, then to `intrinsic`; a `ratio` implies `framed` unless one is stated. */
  readonly layout = input<ImageLayout | undefined>(undefined);
  /** Defaults to the provider, then to `cover`. */
  readonly fit = input<ImageFit | undefined>(undefined);
  /**
   * A focal point: one of the five names, or any `object-position` value,
   * written on the instance. Defaults to the provider, then to `center`.
   */
  readonly position = input<ImagePosition | (string & {}) | undefined>(undefined);
  /** Defaults to the provider, then to `none`. */
  readonly radius = input<ImageRadius | undefined>(undefined);
  /** A subtle inset edge, for a photograph of a white wall on a white page. */
  readonly bordered = input<boolean | undefined, unknown>(undefined, {
    transform: (value: unknown) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Defaults to the provider, then to `surface`. */
  readonly placeholder = input<ImagePlaceholder | undefined>(undefined);
  /** The small picture `placeholder="blur"` scales and blurs. A data URI, usually. */
  readonly placeholderSrc = input<string | undefined>(undefined);
  /**
   * A second URL to try when `src` fails. The status stays `loading` while
   * it is tried, and `error` is reached only if it fails too.
   */
  readonly fallbackSrc = input<string | undefined>(undefined);
  /** The `<source>`s of a `<picture>`, in order. The `<img>` is written last. */
  readonly sources = input<readonly ImageSource[]>([]);
  /** The platform's `loading`. Defaults to the provider, then to `lazy`; `priority` makes it `eager`. */
  readonly loading = input<ImageLoading | undefined>(undefined);
  /** The platform's `decoding`. Defaults to the provider, then to `async`. */
  readonly decoding = input<ImageDecoding | undefined>(undefined);
  /** The platform's `fetchpriority`. `priority` writes `high` unless one is stated. */
  readonly fetchPriority = input<'high' | 'low' | 'auto' | undefined>(undefined);
  /**
   * The picture the page is waiting for: `loading="eager"` and
   * `fetchpriority="high"`, unless either is stated.
   */
  readonly priority = input(false, { transform: booleanAttribute });
  /**
   * Where the picture is. Supplied, it wins over what the component derives
   * from the element — for a server that already knows, or a loader the
   * family cannot see.
   */
  readonly status = input<ImageStatus | undefined>(undefined);

  /** Reports the derived status. Never emits for a status passed in. */
  readonly statusChange = output<ImageStatus>();

  private readonly defaults = injectImageDefaults();

  protected readonly projected = contentChild(SlImageMedia);

  protected readonly resolvedLayout = computed<ImageLayout>(
    () => this.layout() ?? (this.ratio() === undefined ? this.defaults.layout : 'framed'),
  );
  protected readonly resolvedFit = computed(() => this.fit() ?? this.defaults.fit);
  protected readonly resolvedRadius = computed(() => this.radius() ?? this.defaults.radius);
  protected readonly resolvedBordered = computed(() => this.bordered() ?? this.defaults.bordered);
  protected readonly resolvedPlaceholder = computed(
    () => this.placeholder() ?? this.defaults.placeholder,
  );
  protected readonly resolvedLoading = computed(
    () => this.loading() ?? (this.priority() ? 'eager' : this.defaults.loading),
  );
  protected readonly resolvedDecoding = computed(() => this.decoding() ?? this.defaults.decoding);
  protected readonly resolvedFetchPriority = computed(
    () => this.fetchPriority() ?? (this.priority() ? 'high' : null),
  );

  private readonly resolvedPosition = computed(() => this.position() ?? this.defaults.position);
  protected readonly positionAttribute = computed<ImagePositionAttribute>(() =>
    POSITIONS.has(this.resolvedPosition())
      ? (this.resolvedPosition() as ImagePositionAttribute)
      : 'custom',
  );
  protected readonly positionToken = computed(() =>
    this.positionAttribute() === 'custom' ? this.resolvedPosition() : null,
  );

  /**
   * The derivation, and the picture it belongs to. A new request makes the
   * previous answer describe nothing, so the status starts again from what
   * the inputs alone can say — which is also what a server render and the
   * hydration after it both compute, so nothing flashes between them.
   */
  private readonly derived = linkedSignal<string, Derived>({
    source: () => `${this.src() ?? ''}|${this.projected() === undefined ? '' : 'projected'}`,
    computation: (request) => ({
      attempt: 'primary',
      status: request === '|' ? 'idle' : 'loading',
    }),
  });

  protected readonly resolvedStatus = computed(() => this.status() ?? this.derived().status);

  /** The URL the component's own `<img>` is showing: `src`, or `fallbackSrc` after `src` failed. */
  protected readonly shownSrc = computed(() =>
    this.derived().attempt === 'fallback' ? (this.fallbackSrc() ?? this.src()) : this.src(),
  );

  /** Called by the picture, whichever of the two elements it turned out to be. */
  reportLoaded() {
    if (this.derived().status === 'loaded') return;
    this.derived.set({ attempt: this.derived().attempt, status: 'loaded' });
    this.statusChange.emit('loaded');
  }

  /**
   * The first failure is answered with the second URL when there is one, and
   * the status stays `loading` while it is tried; `error` is what is left
   * when nothing could be shown. Only the component's own `<img>` can be
   * re-pointed: a projected picture belongs to the consumer.
   */
  reportError() {
    const { attempt } = this.derived();
    if (
      attempt === 'primary' &&
      this.fallbackSrc() !== undefined &&
      this.projected() === undefined
    ) {
      this.derived.set({ attempt: 'fallback', status: 'loading' });
      return;
    }
    this.derived.set({ attempt, status: 'error' });
    this.statusChange.emit('error');
  }
}
