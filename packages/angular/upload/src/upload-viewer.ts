import { SlDialog, SlDialogTitle } from '@slotted/angular/dialog';
import type { DialogChangeRequest } from '@slotted/angular/dialog';
import { formatBytes, isViewable } from '@slotted/core/upload';
import type { FileKind, UploadFile } from '@slotted/core/upload';
import { DomSanitizer } from '@angular/platform-browser';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import type { GlyphName } from '@slotted/angular/icon';
import { uploadMessages, type PartialMessages, type UploadMessages } from '@slotted/core/i18n';

import type { UploadSize, UploadViewingReason } from './upload-defaults';

/**
 * What a file is drawn as on its tile: one glyph per kind, the plain file for
 * anything no kind claims. The row's tile and the viewer's stage read the same
 * map, so a kind never has two marks.
 */
export const KIND_GLYPH: Record<FileKind, GlyphName> = {
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

export interface UploadViewingRequest {
  key: string | null;
  reason: UploadViewingReason;
  source: unknown;
}

/**
 * A file, full screen, on a surface of its own.
 *
 * A preview that left the page was the first answer and it was the wrong one:
 * it loses the form the reader was in the middle of filling in. The tab
 * survives as the escape hatch in the header, where a PDF is better read in the
 * browser's own full window.
 *
 * `dialog` owns the layer, the scrim, the focus containment, the scroll lock and
 * Escape, exactly as it does in React; what this owns is the stage, the header
 * and the two controls that move through the set. The first answer drew the
 * surface here instead, on the ground that the Angular dialog is opened through
 * a service — it is not: `sl-dialog` is a component with `open` and projected
 * content, and drawing the surface by hand shipped a panel with no layer, no
 * scrim and no containment, sitting in the page under the family.
 */
@Component({
  selector: 'div[slUploadViewer]',
  standalone: true,
  exportAs: 'slUploadViewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [SlDialog, SlDialogTitle, SlGlyph, SlIcon],
  host: {
    '[attr.hidden]': 'current() ? null : ""',
    '(keydown)': 'onKey($event)',
  },
  template: `
    <!--
      The layer stands whether or not a file is open, and the open input is what
      moves it. Written the other way round — the dialog created by the same
      block that opens it — the presence machine reached open in an effect after
      the view had been made and the layer's own template was never refreshed:
      the component reported itself open and mounted, with nothing in the
      document to show for it.
    -->
    <sl-dialog
      (openChangeRequest)="onDialogRequest($event)"
      [open]="current() !== undefined"
      fullScreen="always"
    >
      @if (current(); as file) {
        <div
          [attr.data-size]="size()"
          data-part="viewer"
          data-part-viewer=""
          data-ui="upload"
          data-ui-upload=""
        >
          <div data-part="viewerHeader" data-part-viewerheader="">
            <div>
              <h2
                data-part="viewerTitle"
                data-part-viewertitle=""
                [attr.data-part-title]="null"
                slDialogTitle
                [textContent]="file.name"
              ></h2>
              <span data-part="viewerMeta" data-part-viewermeta="">{{ metaText() }}</span>
            </div>
            <span data-part="viewerActions" data-part-vieweractions="">
              @if (url()) {
                <button
                  (click)="openExternally()"
                  [attr.aria-label]="t('viewerExternal')"
                  data-part="viewerExternal"
                  data-part-viewerexternal=""
                  type="button"
                >
                  <span slIcon><svg slGlyph name="external"></svg></span>
                </button>
              }
              <button
                (click)="close($event)"
                [attr.aria-label]="t('viewerClose')"
                data-part="viewerClose"
                data-part-viewerclose=""
                type="button"
              >
                <span slIcon><svg slGlyph name="x"></svg></span>
              </button>
            </span>
          </div>

          <div data-part="viewerStage" data-part-viewerstage="">
            @if (shown().length > 1) {
              <button
                (click)="move(-1, $event)"
                [attr.aria-label]="t('viewerPrevious')"
                [disabled]="index() <= 0"
                data-part="viewerPrevious"
                data-part-viewerprevious=""
                type="button"
              >
                <span slIcon directional><svg slGlyph name="chevron-right"></svg></span>
              </button>
            }

            @switch (stage()) {
              @case ('image') {
                <img [alt]="file.name" [src]="url()" />
              }
              @case ('video') {
                <video [src]="url()" controls></video>
              }
              @case ('audio') {
                <audio [src]="url()" controls></audio>
              }
              @case ('pdf') {
                <iframe [src]="frameUrl()" [title]="file.name"></iframe>
              }
              @case ('text') {
                <iframe [src]="frameUrl()" [title]="file.name" sandbox=""></iframe>
              }
              @default {
                <span
                  [attr.data-extension]="extensionLabel()"
                  [attr.data-kind]="file.kind"
                  data-part="preview"
                  data-part-preview=""
                >
                  <span slIcon><svg slGlyph [name]="kindGlyph[file.kind]"></svg></span>
                </span>
                <p>{{ t('viewerUnsupported') }}</p>
              }
            }

            @if (shown().length > 1) {
              <button
                (click)="move(1, $event)"
                [attr.aria-label]="t('viewerNext')"
                [disabled]="index() === -1 || index() >= shown().length - 1"
                data-part="viewerNext"
                data-part-viewernext=""
                type="button"
              >
                <span slIcon directional><svg slGlyph name="chevron-right"></svg></span>
              </button>
            }
          </div>
        </div>
      }
    </sl-dialog>
  `,
})
export class SlUploadViewer {
  readonly files = input<readonly UploadFile[]>([]);
  readonly viewing = input<string | null>(null);
  readonly urls = input<ReadonlyMap<string, string>>(new Map());
  /** The upload's own `messages`, laid over the catalog of the language in force. */
  readonly messages = input<PartialMessages<UploadMessages> | undefined>(undefined);
  /** What the size is written in. Absent, the language in force. */
  readonly locale = input<string | undefined>(undefined);
  /** The family's size, restated on the layer: it is portalled out of the root. */
  readonly size = input<UploadSize>('md');

  readonly viewingChange = output<UploadViewingRequest>();

  protected readonly kindGlyph = KIND_GLYPH;
  private readonly contextLocale = injectLocale();
  /** The family's words in the language in force, with the upload's `messages` laid over them. */
  readonly t = injectMessages(uploadMessages, this.messages);

  /**
   * Only what the viewer can render, so previous and next skip a spreadsheet
   * sitting between two photographs rather than stopping on it.
   */
  readonly shown = computed(() =>
    this.files().filter((file) => file.file !== undefined && isViewable(file)),
  );
  readonly index = computed(() => this.shown().findIndex((file) => file.key === this.viewing()));
  readonly current = computed(() => {
    const key = this.viewing();
    if (key === null) return undefined;
    return this.shown()[this.index()] ?? this.files().find((file) => file.key === key);
  });

  readonly url = computed(() => {
    const file = this.current();
    return file === undefined ? undefined : this.urls().get(file.key);
  });

  /**
   * The frame's source, trusted explicitly. Angular refuses an interpolated
   * resource URL and renders an empty frame instead, which is what a PDF was
   * here until it was measured. What is trusted is not a consumer's string: it
   * is the object URL this family made, with `URL.createObjectURL`, for a file
   * the reader chose in this browser.
   */
  private readonly sanitizer = inject(DomSanitizer);
  readonly frameUrl = computed(() => {
    const url = this.url();
    return url === undefined ? null : this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  readonly stage = computed(() => {
    const file = this.current();
    if (file === undefined || this.url() === undefined) return 'unsupported';
    const type = file.type.split(';')[0] ?? '';
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    /*
     * A PDF is framed without `sandbox` and everything else with it, and the
     * asymmetry is measured rather than assumed. Chrome's PDF viewer is blocked in
     * a sandboxed frame — with `sandbox=""` and with `sandbox="allow-scripts"`
     * alike, both photographed against a one-page document — so the sandbox that
     * protects a dropped `text/html` file is also what made every PDF preview a
     * grey box, which is how a reader met it.
     *
     * What makes the exception safe is the type: the object URL carries the file's
     * own media type, Chrome dispatches `application/pdf` to the PDF viewer by
     * that type and does not sniff HTML out of it — an HTML document served as
     * `application/pdf` in an unsandboxed frame ran no script, measured the same
     * way. Text keeps the sandbox, with neither `allow-scripts` nor
     * `allow-same-origin`, because an object URL inherits this document's origin.
     */
    if (type === 'application/pdf') return 'pdf';
    if (type.startsWith('text/')) return 'text';
    return 'unsupported';
  });

  readonly metaText = computed(() => {
    const file = this.current();
    if (file === undefined) return '';
    const size = formatBytes(file.size, this.locale() ?? this.contextLocale());
    const kind = this.t(file.kind);
    return this.index() === -1
      ? this.t('viewerMeta', { size, kind })
      : this.t('viewerMetaPosition', {
          size,
          kind,
          index: this.index() + 1,
          count: this.shown().length,
        });
  });

  readonly extensionLabel = computed(() => {
    const name = this.current()?.name ?? '';
    const dot = name.lastIndexOf('.');
    return dot <= 0 ? this.t('noExtension') : name.slice(dot + 1).toUpperCase();
  });

  constructor() {
    const onKey = (event: KeyboardEvent) => {
      if (this.current() === undefined) return;
      this.onKey(event);
    };
    document.addEventListener('keydown', onKey);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('keydown', onKey));
  }

  protected onKey(event: KeyboardEvent) {
    if (this.current() === undefined) return;
    const shown = this.shown();

    /* Escape is the dialog's, and it arrives here as a close request instead. */
    if (event.key === 'ArrowLeft') this.move(-1, event);
    else if (event.key === 'ArrowRight') this.move(1, event);
    else if (event.key === 'Home') this.emit(shown[0]?.key ?? null, 'keyboard', event);
    else if (event.key === 'End') this.emit(shown.at(-1)?.key ?? null, 'keyboard', event);
    else return;

    event.preventDefault();
  }

  protected move(step: number, source: Event) {
    const next = this.shown()[this.index() + step];
    if (next !== undefined) this.emit(next.key, 'keyboard', source);
  }

  protected close(source: Event) {
    this.emit(null, 'pointer', source);
  }

  /**
   * The layer closed itself — Escape, the scrim, or the dialog's own control.
   * Only the reasons this family declares survive the translation; the rest is
   * a dismissal, which is what `dismiss` means in every state model here.
   */
  protected onDialogRequest(request: DialogChangeRequest) {
    if (request.value) return;
    const reason =
      request.reason === 'escape' || request.reason === 'outsidePress' ? request.reason : 'dismiss';
    this.emit(null, reason, request.source);
  }

  protected openExternally() {
    const url = this.url();
    if (url !== undefined) window.open(url, '_blank', 'noopener,noreferrer');
  }

  private emit(key: string | null, reason: UploadViewingReason, source: unknown) {
    this.viewingChange.emit({ key, reason, source });
  }
}
