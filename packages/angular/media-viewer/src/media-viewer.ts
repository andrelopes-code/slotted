import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { SlDialog, SlDialogDescription, SlDialogTitle } from '@slotted/angular/dialog';
import type { DialogChangeRequest } from '@slotted/angular/dialog';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { injectMessages } from '@slotted/angular/i18n';
import { mediaViewerMessages } from '@slotted/core/i18n';
import type { MediaViewerMessages, PartialMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { clampZoom, createMediaStage, mediaKind, readableText } from '@slotted/core/media-viewer';
import type { MediaStageHandle, MediaStageStep } from '@slotted/core/media-viewer';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import { fileKind, splitName } from '@slotted/core/upload';
import type { GlyphName } from '@slotted/core/glyph';

import { injectMediaViewerDefaults } from './media-viewer-defaults';
import type { MediaViewerItem, Rotation } from './media-viewer-defaults';

/** The glyph of a kind the viewer cannot draw, as `attachment` marks it. */
const KIND_GLYPH: Readonly<Record<string, GlyphName>> = {
  archive: 'file-archive',
  audio: 'file-audio',
  document: 'file-type',
  image: 'file-image',
  other: 'file',
  pdf: 'file-text',
  presentation: 'presentation',
  spreadsheet: 'file-spreadsheet',
  video: 'file-video',
};

/** A control of the consumer's own, projected into the bar beside the download. */
@Directive({ selector: '[slMediaViewerAction]', standalone: true })
export class SlMediaViewerAction {}

/**
 * A file of a set, full screen: fitted, zoomed, turned and stepped. The layer
 * is `<sl-dialog>` with `fullScreen="always"` and `surface="plain"`; nothing
 * of it is redrawn here. The wheel, the pointers and the keys go through the
 * controller of `@slotted/core/media-viewer`, which asks; this component
 * holds the four values and answers.
 */
@Component({
  selector: 'sl-media-viewer',
  standalone: true,
  exportAs: 'slMediaViewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../../../styles/src/media-viewer/media-viewer.css',
  imports: [SlDialog, SlDialogDescription, SlDialogTitle, SlGlyph, SlIcon],
  host: { style: 'display: contents' },
  template: `
    <sl-dialog
      (openChangeRequest)="onDialogRequest($event)"
      [container]="container()"
      [fullscreenToggle]="fullscreenToggle()"
      [initialFocus]="stageElement()?.nativeElement ?? 'container'"
      [open]="open()"
      back="close"
      fullScreen="always"
      surface="plain"
    >
      @if (item(); as file) {
        <div
          [attr.data-kind]="kind()"
          [attr.data-loading]="kind() === 'image' && status() === 'loading' ? '' : null"
          [attr.data-slotted-scheme]="scheme()"
          [attr.data-zoomed]="kind() === 'image' && zoom() > 1 ? '' : null"
          data-part="root"
          data-part-root=""
          data-ui="media-viewer"
          data-ui-media-viewer=""
        >
          <div data-part="bar" data-part-bar="">
            <div data-part="heading" data-part-heading="">
              <h2 [attr.title]="file.name" dir="auto" slDialogTitle>
                <span>{{ name().stem }}</span>
                @if (name().extension) {
                  <span>{{ name().extension }}</span>
                }
              </h2>
              @if (items().length > 1) {
                <!-- slDialogDescription names the dialog's description; the part is the family's. -->
                <p
                  [attr.data-part-description]="null"
                  [attr.data-part]="'position'"
                  data-part-position=""
                  dir="auto"
                  slDialogDescription
                >
                  {{ position() }}
                </p>
              }
            </div>
            <div data-part="actions" data-part-actions="">
              <ng-content select="[slMediaViewerAction]" />
              @if (file.downloadHref) {
                <a
                  [attr.aria-label]="t('download')"
                  [attr.download]="file.name"
                  [attr.href]="file.downloadHref"
                  data-part="download"
                  data-part-download=""
                >
                  <span slIcon><svg name="download" slGlyph></svg></span>
                </a>
              }
            </div>
            <button
              (click)="requestOpen(false, 'pointer', $event)"
              [attr.aria-label]="t('close')"
              data-part="close"
              data-part-close=""
              type="button"
            >
              <span slIcon><svg name="x" slGlyph></svg></span>
            </button>
          </div>

          <div
            #stage
            [attr.aria-label]="t('label', { name: file.name })"
            [attr.data-error]="status() === 'error' ? '' : null"
            [attr.data-kind]="kind()"
            [attr.data-rotation]="kind() === 'image' ? rotation() : 0"
            data-part="stage"
            data-part-stage=""
            tabindex="0"
          >
            @if (status() === 'error') {
              <div data-error="" data-part="status" data-part-status="" role="status">
                <span aria-hidden="true" data-part="tile" data-part-tile="">
                  <span slIcon
                    ><svg [name]="kind() === 'image' ? 'image-off' : 'cloud-off'" slGlyph></svg
                  ></span>
                </span>
                <h3>{{ t('errorTitle') }}</h3>
                <p>{{ t('error') }}</p>
                <div>
                  <button (click)="retry()" data-part="retry" data-part-retry="" type="button">
                    <span slIcon><svg name="rotate-ccw" slGlyph></svg></span>{{ t('retry') }}
                  </button>
                  @if (file.downloadHref) {
                    <a
                      [attr.download]="file.name"
                      [attr.href]="file.downloadHref"
                      data-part="download"
                      data-part-download=""
                    >
                      <span slIcon><svg name="download" slGlyph></svg></span>{{ t('download') }}
                    </a>
                  }
                </div>
              </div>
            } @else {
              @switch (kind()) {
                @case ('image') {
                  <div
                    [attr.data-loading]="status() === 'loading' ? '' : null"
                    data-part="frame"
                    data-part-frame=""
                  >
                    <img
                      (error)="status.set('error')"
                      (load)="status.set('ready')"
                      [attr.height]="file.height ?? null"
                      [attr.width]="file.width ?? null"
                      [alt]="file.name"
                      [src]="file.src"
                      data-part="media"
                      data-part-media=""
                      draggable="false"
                    />
                    @if (status() === 'loading') {
                      <div data-part="status" data-part-status="" role="status">
                        {{ t('loading', { name: file.name }) }}
                      </div>
                    }
                  </div>
                }
                @case ('pdf') {
                  <!-- No sandbox: Chrome's reader refuses one (upload measured it). -->
                  <iframe
                    [src]="frameUrl()"
                    [title]="file.name"
                    data-part="media"
                    data-part-media=""
                  ></iframe>
                }
                @case ('text') {
                  @if (text(); as content) {
                    <div data-part="text" data-part-text="">
                      <pre data-part="media" data-part-media="" dir="auto">{{ content.text }}</pre>
                      @if (content.truncated) {
                        <p>{{ t('truncated') }}</p>
                      }
                    </div>
                  } @else {
                    <div data-part="status" data-part-status="" role="status">
                      {{ t('loading', { name: file.name }) }}
                    </div>
                  }
                }
                @case ('video') {
                  <video
                    (error)="status.set('error')"
                    [src]="file.src"
                    controls
                    data-part="media"
                    data-part-media=""
                  ></video>
                }
                @case ('audio') {
                  <audio
                    (error)="status.set('error')"
                    [src]="file.src"
                    controls
                    data-part="media"
                    data-part-media=""
                  ></audio>
                }
                @default {
                  <div data-part="unsupported" data-part-unsupported="">
                    <span aria-hidden="true" data-part="tile" data-part-tile="">
                      <span slIcon><svg [name]="unsupportedGlyph()" slGlyph></svg></span>
                      @if (extension()) {
                        <span>{{ extension() }}</span>
                      }
                    </span>
                    <h3>{{ t('unsupportedTitle') }}</h3>
                    <p>{{ t('unsupported', { extension: extension() || '__none' }) }}</p>
                    <div>
                      @if (file.downloadHref) {
                        <a
                          [attr.download]="file.name"
                          [attr.href]="file.downloadHref"
                          data-part="download"
                          data-part-download=""
                        >
                          <span slIcon><svg name="download" slGlyph></svg></span>{{ t('download') }}
                        </a>
                      }
                    </div>
                  </div>
                }
              }
            }
          </div>

          @if (items().length > 1) {
            <button
              (click)="requestStep('previous', 'pointer', $event)"
              [attr.aria-label]="t('previous')"
              [disabled]="index() <= 0 && !resolvedLoop()"
              data-part="previous"
              data-part-previous=""
              type="button"
            >
              <span directional slIcon><svg name="chevron-left" slGlyph></svg></span>
            </button>
            <button
              (click)="requestStep('next', 'pointer', $event)"
              [attr.aria-label]="t('next')"
              [disabled]="index() >= items().length - 1 && !resolvedLoop()"
              data-part="next"
              data-part-next=""
              type="button"
            >
              <span directional slIcon><svg name="chevron-right" slGlyph></svg></span>
            </button>
          }

          @if (kind() === 'image' && status() !== 'error') {
            <div
              [attr.aria-label]="t('zoomLevel', { percent: percent() })"
              data-part="zoom"
              data-part-zoom=""
              role="group"
            >
              <button
                (click)="zoomTo(zoom() - limits().zoomStep, $event)"
                [attr.aria-label]="t('zoomOut')"
                [disabled]="zoom() <= limits().minZoom"
                data-part="zoom-out"
                data-part-zoom-out=""
                type="button"
              >
                <span slIcon><svg name="minus" slGlyph></svg></span>
              </button>
              <output aria-live="off" data-part="zoom-level" data-part-zoom-level="">{{
                t('zoomLevel', { percent: percent() })
              }}</output>
              <button
                (click)="zoomTo(zoom() + limits().zoomStep, $event)"
                [attr.aria-label]="t('zoomIn')"
                [disabled]="zoom() >= limits().maxZoom"
                data-part="zoom-in"
                data-part-zoom-in=""
                type="button"
              >
                <span slIcon><svg name="plus" slGlyph></svg></span>
              </button>
              <button
                (click)="zoomTo(1, $event)"
                [attr.aria-label]="t('fit')"
                [disabled]="zoom() <= limits().minZoom"
                data-part="fit"
                data-part-fit=""
                type="button"
              >
                <span slIcon><svg name="minimize" slGlyph></svg></span>
              </button>
              <button
                (click)="requestRotation(nextRotation(), 'pointer', $event)"
                [attr.aria-label]="t('rotate')"
                data-part="rotate"
                data-part-rotate=""
                type="button"
              >
                <span slIcon><svg name="rotate-cw" slGlyph></svg></span>
              </button>
            </div>
          }

          @if (file.caption) {
            <p data-part="caption" data-part-caption="" dir="auto">{{ file.caption }}</p>
          }

          @if (thumbnails() && items().length > 1) {
            <div
              [attr.aria-label]="thumbnailsLabel()"
              data-part="thumbnails"
              data-part-thumbnails=""
              role="group"
            >
              @for (entry of items(); track entry.id) {
                <button
                  (click)="requestStep(entry.id, 'pointer', $event)"
                  [attr.aria-current]="entry.id === file.id ? 'true' : null"
                  [attr.aria-label]="entry.name"
                  [attr.data-current]="entry.id === file.id ? '' : null"
                  data-part="thumbnail"
                  data-part-thumbnail=""
                  type="button"
                >
                  @if (entry.thumbnail || entry.type.startsWith('image/')) {
                    <img [src]="entry.thumbnail ?? entry.src" alt="" />
                  }
                </button>
              }
            </div>
          }
        </div>
      }
    </sl-dialog>
  `,
})
export class SlMediaViewer {
  readonly items = input<readonly MediaViewerItem[]>([]);
  readonly open = model(false);
  /** The `id` of the item shown; the first item until one is given. */
  readonly value = model<string | undefined>(undefined);
  /** The level, a multiple of the fit: 1 is the whole picture inside the stage. */
  readonly zoom = model(1);
  readonly rotation = model<Rotation>(0);
  readonly minZoom = input<number | undefined>(undefined);
  readonly maxZoom = input<number | undefined>(undefined);
  readonly zoomStep = input<number | undefined>(undefined);
  readonly loop = input<boolean | undefined>(undefined);
  readonly thumbnails = input(false, { transform: booleanAttribute });
  readonly thumbnailsLabel = input<string | undefined>(undefined);
  readonly fullscreenToggle = input(false, { transform: booleanAttribute });
  readonly container = input<Element | null | undefined>(undefined);
  readonly messages = input<PartialMessages<MediaViewerMessages> | undefined>(undefined);

  readonly openChangeRequest = output<ChangeRequest<boolean>>();
  readonly valueChangeRequest = output<ChangeRequest<string>>();
  readonly zoomChangeRequest = output<ChangeRequest<number>>();
  readonly rotationChangeRequest = output<ChangeRequest<Rotation>>();

  private readonly defaults = injectMediaViewerDefaults();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly ownMessages = computed(() => this.messages() ?? this.defaults.messages);
  protected readonly t = injectMessages(mediaViewerMessages, this.ownMessages);
  protected readonly stageElement = viewChild<ElementRef<HTMLDivElement>>('stage');
  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  protected readonly limits = computed(() => ({
    minZoom: this.minZoom() ?? this.defaults.minZoom,
    maxZoom: this.maxZoom() ?? this.defaults.maxZoom,
    zoomStep: this.zoomStep() ?? this.defaults.zoomStep,
  }));
  protected readonly resolvedLoop = computed(() => this.loop() ?? this.defaults.loop);
  protected readonly index = computed(() => {
    const value = this.value() ?? this.items()[0]?.id;

    return this.items().findIndex((item) => item.id === value);
  });
  protected readonly item = computed(() => this.items()[this.index()]);
  protected readonly kind = computed(() => {
    const item = this.item();

    return item === undefined ? 'other' : mediaKind(item.type, item.name);
  });
  protected readonly name = computed(() => splitName(this.item()?.name ?? ''));
  /*
   * The PDF frame's address is the consumer's own item, trusted as a resource
   * the way `upload`'s viewer trusts its object URL. A PDF runs no script, and
   * text never reaches a frame: the family draws it as text.
   */
  protected readonly frameUrl = computed(() => {
    const src = this.item()?.src;

    return src === undefined ? null : this.sanitizer.bypassSecurityTrustResourceUrl(src);
  });
  protected readonly percent = computed(() => Math.round(this.zoom() * 100));
  protected readonly extension = computed(() => this.name().extension.slice(1).toUpperCase());
  protected readonly text = signal<{ text: string; truncated: boolean } | null>(null);
  /** Counts the retries of the shown file: a new element loads it again, and text is fetched again. */
  private readonly attempt = signal(0);
  protected readonly position = computed(() =>
    this.t('position', { index: this.index() + 1, count: this.items().length }),
  );
  protected readonly unsupportedGlyph = computed(() => {
    const item = this.item();

    return KIND_GLYPH[fileKind({ name: item?.name ?? '', type: item?.type ?? '' })] ?? 'file';
  });
  /** Dark on the dark ground in every scheme but high contrast, which the reader asked for. */
  protected readonly scheme = computed(() => {
    this.open();
    const nearest = this.host.nativeElement.closest('[data-slotted-scheme]');

    return nearest?.getAttribute('data-slotted-scheme') === 'high-contrast'
      ? 'high-contrast'
      : 'dark';
  });

  private handle: MediaStageHandle | null = null;

  constructor() {
    this.watchStatus();
    this.watchRemoval();
    this.watchAnnouncement();
    this.watchStage();
    this.watchText();
  }

  requestOpen(next: boolean, reason: ChangeReason, source?: unknown) {
    this.request(this.open, this.openChangeRequest, next, reason, source);
  }

  requestStep(step: MediaStageStep | string, reason: ChangeReason, source?: unknown) {
    const target = this.stepTarget(step);
    if (target === undefined || target.id === this.item()?.id) return;

    if (!this.request(this.value, this.valueChangeRequest, target.id, reason, source)) return;

    this.request(this.zoom, this.zoomChangeRequest, 1, 'select');
    this.request(this.rotation, this.rotationChangeRequest, 0 as Rotation, 'select');
  }

  requestZoom(next: number, reason: ChangeReason, source?: unknown) {
    const { maxZoom, minZoom } = this.limits();
    this.request(
      this.zoom,
      this.zoomChangeRequest,
      clampZoom(next, minZoom, maxZoom),
      reason,
      source,
    );
  }

  requestRotation(next: Rotation, reason: ChangeReason, source?: unknown) {
    this.request(this.rotation, this.rotationChangeRequest, next, reason, source);
  }

  protected retry() {
    this.status.set(this.kind() === 'image' || this.kind() === 'text' ? 'loading' : 'ready');
    this.attempt.update((count) => count + 1);
  }

  protected zoomTo(zoom: number, event: Event) {
    this.handle?.requestZoom(zoom, 'pointer', event);
  }

  protected nextRotation(): Rotation {
    return ((this.rotation() + 90) % 360) as Rotation;
  }

  protected onDialogRequest(request: DialogChangeRequest) {
    if (
      !this.request(
        this.open,
        this.openChangeRequest,
        request.value,
        request.reason,
        request.source,
      )
    ) {
      request.cancel();
    }
  }

  /** A request the consumer may cancel; the model moves only when it is not. */
  private request<T>(
    state: { (): T; set(value: T): void },
    emitter: { emit(request: ChangeRequest<T>): void },
    next: T,
    reason: ChangeReason,
    source?: unknown,
  ): boolean {
    const controllable = createControllable<T>({
      initial: state(),
      onRequest: (request) => emitter.emit(request),
    });
    if (!controllable.request(next, reason, source)) return false;

    state.set(next);

    return true;
  }

  private stepTarget(step: MediaStageStep | string): MediaViewerItem | undefined {
    const items = this.items();
    if (step === 'first') return items[0];
    if (step === 'last') return items.at(-1);
    if (step !== 'next' && step !== 'previous') return items.find((item) => item.id === step);

    const next = this.index() + (step === 'next' ? 1 : -1);
    if (next >= 0 && next < items.length) return items[next];

    return this.resolvedLoop() && items.length > 1
      ? items[(next + items.length) % items.length]
      : undefined;
  }

  /** A new item starts loading; anything but a picture is ready at once. */
  private watchStatus() {
    effect(() => {
      const kind = this.kind();
      this.item();
      untracked(() => {
        this.attempt.set(0);
        this.status.set(kind === 'image' || kind === 'text' ? 'loading' : 'ready');
      });
    });
  }

  /** An item that leaves the set while it is shown passes to its neighbour, with `remove`. */
  private watchRemoval() {
    let previous: readonly MediaViewerItem[] = [];
    effect(() => {
      const items = this.items();
      const value = this.value();
      untracked(() => {
        const before = previous;
        previous = items;
        if (value === undefined || !this.open() || items.some((item) => item.id === value)) return;

        if (items.length === 0) {
          this.requestOpen(false, 'programmatic');
          return;
        }

        const was = before.findIndex((item) => item.id === value);
        const neighbour = items[Math.min(Math.max(was, 0), items.length - 1)];
        if (neighbour !== undefined)
          this.request(this.value, this.valueChangeRequest, neighbour.id, 'remove');
      });
    });
  }

  /** A text file is fetched and drawn as text; it is never executed. */
  private watchText() {
    effect((onCleanup) => {
      const item = this.item();
      const kind = this.kind();
      this.attempt();
      untracked(() => this.text.set(null));
      if (item === undefined || kind !== 'text') return;

      const controller = new AbortController();
      fetch(item.src, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(String(response.status));

          return response.text();
        })
        .then((content) => {
          this.text.set(readableText(content, item.type, item.name));
          this.status.set('ready');
        })
        .catch(() => {
          if (!controller.signal.aborted) this.status.set('error');
        });
      onCleanup(() => controller.abort());
    });
  }

  /** A step says which file and which of how many, politely. */
  private watchAnnouncement() {
    let shown: string | undefined;
    effect(() => {
      const open = this.open();
      const item = this.item();
      untracked(() => {
        if (!open) {
          shown = undefined;
          return;
        }

        if (shown !== undefined && item !== undefined && item.id !== shown) {
          const message = this.t('announce', {
            name: item.name,
            index: this.index() + 1,
            count: this.items().length,
          });
          getLiveAnnouncer().announce(message, { politeness: 'polite' });
        }
        shown = item?.id;
      });
    });
  }

  /** The controller lives as long as the stage does, and sizes the picture after each render. */
  private watchStage() {
    effect((onCleanup) => {
      const stage = this.stageElement()?.nativeElement;
      const keys = stage?.closest<HTMLElement>('[data-ui="media-viewer"]');
      if (stage === undefined || keys === null || keys === undefined) return;

      const handle = createMediaStage({
        stage,
        keys,
        getState: () => ({
          ...this.limits(),
          zoom: this.zoom(),
          rotation: this.rotation(),
          zoomable: this.kind() === 'image' && this.status() === 'ready',
        }),
        onZoomRequest: (zoom, reason, event) => this.requestZoom(zoom, reason, event),
        onRotationRequest: (rotation, reason, event) =>
          this.requestRotation(rotation, reason, event),
        onStepRequest: (step, reason, event) => this.requestStep(step, reason, event),
        onCloseRequest: (reason, event) => this.requestOpen(false, reason, event),
      });
      untracked(() => (this.handle = handle));
      onCleanup(() => {
        handle.destroy();
        this.handle = null;
      });
    });

    afterRenderEffect(() => {
      this.zoom();
      this.rotation();
      this.status();
      this.item();
      this.handle?.update();
    });

    inject(DestroyRef).onDestroy(() => this.handle?.destroy());
  }
}
