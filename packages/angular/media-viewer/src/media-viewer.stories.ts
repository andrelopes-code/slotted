import { Component, computed, input, signal } from '@angular/core';
import {
  SlAttachment,
  SlAttachmentBody,
  SlAttachmentDetail,
  SlAttachmentGroup,
  SlAttachmentPreview,
  SlAttachmentTrigger,
} from '@slotted/angular/attachment';
import { SlText } from '@slotted/angular/typography';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { ChangeRequest } from '@slotted/core/state';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlMediaViewer, SlMediaViewerAction } from './media-viewer';
import { provideMediaViewerDefaults } from './media-viewer-defaults';
import type { MediaViewerItem, Rotation } from './media-viewer-defaults';
import { ANGULAR_MEDIA_VIEWER_DOCS, ANGULAR_MEDIA_VIEWER_TOKENS } from './media-viewer.docs';

/** A photograph drawn inline at its real size, so the page needs no network. */
const photo = (width: number, height: number, sky: string, ground: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}" viewBox="0 0 ${String(width)} ${String(height)}">` +
      `<rect width="100%" height="100%" fill="${sky}"/>` +
      `<path d="M0 ${String(height * 0.7)} Q ${String(width / 2)} ${String(height * 0.55)} ${String(width)} ${String(height * 0.72)} V ${String(height)} H 0Z" fill="${ground}"/>` +
      `<rect x="${String(width * 0.3)}" y="${String(height * 0.45)}" width="${String(width * 0.4)}" height="${String(height * 0.22)}" rx="${String(height * 0.04)}" fill="#c2410c"/>` +
      '</svg>',
  );

/** A one-page PDF, made in the page: the browser's reader draws it. */
const PDF_SOURCE = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 140>>stream
BT /F1 22 Tf 72 760 Td (Police report 2026-0913) Tj 0 -36 Td /F1 12 Tf (Collision on Rua Augusta 112, Lisbon. Two vehicles.) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;

let reportUrl: string | undefined;
const report = () =>
  (reportUrl ??= URL.createObjectURL(new Blob([PDF_SOURCE], { type: 'application/pdf' })));

const EXPORT = JSON.stringify({
  claim: 'CLM-2026-0914',
  policy: 'AUT-883104',
  incident: { date: '2026-09-13', location: 'Rua Augusta 112, Lisbon', vehicles: 2 },
  estimate: { parts: 1840.5, labour: 960, currency: 'EUR' },
});

const FRONT: MediaViewerItem = {
  id: 'front',
  name: 'damage-front-quarter.jpg',
  type: 'image/jpeg',
  src: photo(2400, 1600, '#bfdbfe', '#4b5563'),
  caption: 'Front quarter, driver side: the bumper and the left headlight.',
  downloadHref: '#damage-front-quarter.jpg',
};
const REAR: MediaViewerItem = {
  id: 'rear',
  name: 'damage-rear.jpg',
  type: 'image/jpeg',
  src: photo(1200, 1600, '#e0e7ff', '#374151'),
  caption: 'Rear, taken from the kerb.',
  downloadHref: '#damage-rear.jpg',
};
const PLATE: MediaViewerItem = {
  id: 'plate',
  name: 'plate.jpg',
  type: 'image/jpeg',
  src: photo(320, 200, '#fde68a', '#78350f'),
  downloadHref: '#plate.jpg',
};

const SETS: Record<string, () => MediaViewerItem[]> = {
  photos: () => [FRONT, REAR, PLATE],
  kinds: () => [
    FRONT,
    { id: 'report', name: 'police-report.pdf', type: 'application/pdf', src: report() },
    {
      id: 'export',
      name: 'claim-0914.json',
      type: 'application/json',
      src: `data:application/json,${encodeURIComponent(EXPORT)}`,
    },
    {
      id: 'estimate',
      name: 'repair-estimate.xlsx',
      type: '',
      src: '#repair-estimate.xlsx',
      downloadHref: '#repair-estimate.xlsx',
    },
  ],
  states: () => [
    FRONT,
    {
      id: 'broken',
      name: 'damage-wheel-arch.jpg',
      type: 'image/jpeg',
      src: 'data:image/jpeg;base64,AAAA',
      downloadHref: '#damage-wheel-arch.jpg',
    },
    REAR,
  ],
  content: () => [
    {
      id: 'scan',
      name: 'scan_2026-09-14_claim-form_insured-party-signature_page-1-of-3_final.png',
      type: 'image/png',
      src: photo(1240, 1754, '#f5f5f4', '#d6d3d1'),
    },
  ],
};

/** A claim's files as a thread shows them; pressing one opens the viewer on it. */
@Component({
  selector: 'sl-media-viewer-claim-demo',
  standalone: true,
  imports: [
    SlAttachment,
    SlAttachmentBody,
    SlAttachmentDetail,
    SlAttachmentGroup,
    SlAttachmentPreview,
    SlAttachmentTrigger,
    SlMediaViewer,
    SlMediaViewerAction,
    SlText,
  ],
  template: `
    <div class="slotted-demo-stack" data-stretch>
      <ul slAttachmentGroup aria-label="Claim CLM-2026-0914" layout="grid" orientation="vertical">
        @for (file of files(); track file.id) {
          <li slAttachment [file]="{ name: file.name, type: file.type }">
            <span
              slAttachmentPreview
              [src]="file.type.startsWith('image/') ? file.src : undefined"
            ></span>
            <div slAttachmentBody>
              <button slAttachmentTrigger (click)="value.set(file.id); open.set(true)"></button>
              <p slAttachmentDetail>{{ file.type || 'Spreadsheet' }}</p>
            </div>
          </li>
        }
      </ul>
      <sl-media-viewer
        (rotationChangeRequest)="recordTurn($event)"
        (zoomChangeRequest)="recordZoom($event)"
        [(open)]="open"
        [(value)]="value"
        [items]="files()"
        [maxZoom]="maxZoom()"
        [thumbnails]="thumbnails()"
        [zoomStep]="zoomStep()"
        thumbnailsLabel="Claim photographs"
      >
        @if (share()) {
          <button
            slMediaViewerAction
            (click)="shared.set('Link to the photograph copied for the adjuster.')"
            type="button"
          >
            Share with adjuster
          </button>
        }
      </sl-media-viewer>
      @if (logged() || share()) {
        <p slText tone="muted">{{ logged() ? lines() : shared() }}</p>
      }
    </div>
  `,
})
class ClaimViewerDemo {
  readonly set = input('photos');
  readonly maxZoom = input<number | undefined>(undefined);
  readonly zoomStep = input<number | undefined>(undefined);
  readonly thumbnails = input(false);
  readonly logged = input(false);
  readonly share = input(false);
  protected readonly files = computed(() => (SETS[this.set()] ?? SETS['photos']!)());
  protected readonly open = signal(false);
  protected readonly value = signal<string | undefined>(undefined);
  protected readonly shared = signal('Nothing shared yet.');
  private readonly log = signal<string[]>([]);
  protected readonly lines = computed(() =>
    this.log().length === 0 ? 'Open a photograph, zoom, turn and step.' : this.log().join(' · '),
  );

  protected record(line: string) {
    this.log.update((lines) => [line, ...lines].slice(0, 4));
  }

  protected recordZoom(request: ChangeRequest<number>) {
    this.record(`level ${String(Math.round(request.value * 100))}% by ${request.reason}`);
  }

  protected recordTurn(request: ChangeRequest<Rotation>) {
    this.record(`turn to ${String(request.value)}° by ${request.reason}`);
  }
}

/** The same claim under a provider that loops the set and allows six times. */
@Component({
  selector: 'sl-media-viewer-provided-demo',
  standalone: true,
  imports: [ClaimViewerDemo],
  providers: [provideMediaViewerDefaults({ loop: true, maxZoom: 6 })],
  template: `<sl-media-viewer-claim-demo [share]="true" />`,
})
class ProvidedViewerDemo {}

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_MEDIA_VIEWER_DOCS.mediaViewer.scenes, {
    images: Images,
    zoom: Zoom,
    kinds: Kinds,
    states: States,
    content: Content,
    thumbnails: Thumbnails,
    composition: Composition,
    controlled: Controlled,
    keyboard: Keyboard,
  });

const meta: Meta = {
  title: 'Components/MediaViewer',
  component: SlMediaViewer,
  decorators: [moduleMetadata({ imports: [ClaimViewerDemo, ProvidedViewerDemo] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'MediaViewer',
        description:
          'The viewer a file opens in: full screen on a dark ground, fitted, zoomed around a point, turned, and stepped through the set it belongs to — a photograph, a PDF, a text file, or the way to a file the browser cannot draw.',
        framework: 'Angular',
        ...ANGULAR_MEDIA_VIEWER_DOCS.mediaViewer,
        tokens: ANGULAR_MEDIA_VIEWER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj;

const story = (id: string, label: string, note: string, body: string): Story => ({
  parameters: scenario(id),
  render: () => ({ template: scene(label, note, body) }),
});

export const Images = story(
  'images',
  'Three photographs of a claim',
  'Open one: it stands whole, never larger than its pixels; the steps walk the set.',
  '<sl-media-viewer-claim-demo />',
);

export const Zoom = story(
  'zoom',
  'Up to eight times, half a step at a time',
  'Wheel, pinch or the pill; the point under the pointer stays where it was.',
  '<sl-media-viewer-claim-demo [maxZoom]="8" [zoomStep]="0.5" />',
);

export const Kinds = story(
  'kinds',
  'Everything a claim collects',
  'A photograph, the police report, the JSON export and a spreadsheet no browser draws.',
  '<sl-media-viewer-claim-demo set="kinds" />',
);

export const States = story(
  'states',
  'A photograph that does not load',
  'The wheel arch’s address no longer answers; try again or download it.',
  '<sl-media-viewer-claim-demo set="states" />',
);

export const Content = story(
  'content',
  'A scanner’s name, alone',
  'The name is cut in the middle so .png stays; no steps and no position for one file.',
  '<sl-media-viewer-claim-demo set="content" />',
);

export const Thumbnails = story(
  'thumbnails',
  'A strip under the photograph',
  'The current one is framed; press another to go straight to it.',
  '<sl-media-viewer-claim-demo [thumbnails]="true" />',
);

export const Composition = story(
  'composition',
  'The product’s own action, and a provider',
  'Share sits beside the download; the provider loops the set and allows six times.',
  '<sl-media-viewer-provided-demo />',
);

export const Controlled = story(
  'controlled',
  'Every request, with its reason',
  'Zoom and turn, then step: the level and the turn come back with select.',
  '<sl-media-viewer-claim-demo [logged]="true" />',
);

export const Keyboard = story(
  'keyboard',
  'Every key of the viewer',
  'Arrows, Home, End, plus, minus, zero, R and Escape, from the stage.',
  '<sl-media-viewer-claim-demo />',
);
