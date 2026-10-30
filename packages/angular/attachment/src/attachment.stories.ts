import { Component, signal } from '@angular/core';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlAttachment, SlAttachmentGroup } from './attachment';
import type {
  AttachmentFile,
  AttachmentOrientation,
  AttachmentRemoveRequest,
  AttachmentSize,
} from './attachment-defaults';
import {
  SlAttachmentAction,
  SlAttachmentActions,
  SlAttachmentBody,
  SlAttachmentDetail,
  SlAttachmentFilename,
  SlAttachmentMessage,
  SlAttachmentPreview,
  SlAttachmentProgress,
  SlAttachmentRemove,
  SlAttachmentTrigger,
} from './attachment-parts';
import { ANGULAR_ATTACHMENT_DOCS, ANGULAR_ATTACHMENT_TOKENS } from './attachment.docs';

interface AttachmentStoryArgs {
  disabled: boolean;
  invalid: boolean;
  loading: boolean;
  orientation: AttachmentOrientation;
  size: AttachmentSize;
}

const PARTS = [
  SlAttachment,
  SlAttachmentAction,
  SlAttachmentActions,
  SlAttachmentBody,
  SlAttachmentDetail,
  SlAttachmentFilename,
  SlAttachmentGroup,
  SlAttachmentMessage,
  SlAttachmentPreview,
  SlAttachmentProgress,
  SlAttachmentRemove,
  SlAttachmentTrigger,
];

/** Two photographs, drawn inline so the page needs no network. */
const PHOTO_FRONT =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%230f766e'/%3E%3Cstop offset='1' stop-color='%2384cc16'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' fill='url(%23a)'/%3E%3C/svg%3E";
const PHOTO_REAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%231e3a8a'/%3E%3Cstop offset='1' stop-color='%2360a5fa'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' fill='url(%23a)'/%3E%3C/svg%3E";

const CLAIM: AttachmentFile = {
  name: 'claim-form-2026-0914.pdf',
  type: 'application/pdf',
  size: 248_000,
};
const ESTIMATE: AttachmentFile = { name: 'repair-estimate.xlsx', size: 86_000 };
const FRONT: AttachmentFile = {
  name: 'damage-front-quarter.jpg',
  type: 'image/jpeg',
  size: 4_100_000,
};
const REAR: AttachmentFile = { name: 'damage-rear.jpg', type: 'image/jpeg', size: 3_600_000 };
const REPORT: AttachmentFile = {
  name: 'police-report.pdf',
  type: 'application/pdf',
  size: 1_200_000,
};
const DASHCAM: AttachmentFile = { name: 'dashcam-0913.mp4', type: 'video/mp4', size: 84_000_000 };

const KINDS: AttachmentFile[] = [
  { name: 'policy.pdf', size: 312_000 },
  { name: 'statement.docx', size: 41_000 },
  { name: 'line-items.csv', size: 9_400 },
  { name: 'walkthrough.pptx', size: 6_800_000 },
  { name: 'rear-bumper.heic', size: 2_900_000 },
  { name: 'dashcam-0913.mp4', size: 84_000_000 },
  { name: 'voicemail-0912.m4a', size: 1_800_000 },
  { name: 'photos-batch.zip', size: 38_000_000 },
  { name: 'VIN-LOG', size: 12_000 },
];

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

/** One file as a thread shows it: tile, link, size, download and remove. */
const row = (file: string, extra = '', src = '') => `
  <li slAttachment [file]="${file}" removable ${extra}>
    <span slAttachmentPreview ${src === '' ? '' : `[src]="${src}"`}></span>
    <div slAttachmentBody>
      <a slAttachmentTrigger [href]="'#' + ${file}.name"></a>
      <p slAttachmentDetail></p>
    </div>
    <div slAttachmentActions>
      <a slAttachmentAction [href]="'#' + ${file}.name" download [attr.aria-label]="'Download ' + ${file}.name">
        <span slIcon><svg slGlyph name="external"></svg></span>
      </a>
      <button slAttachmentRemove></button>
    </div>
  </li>`;

/** A button trigger that opens the page's own viewer, and says what it opened. */
@Component({
  selector: 'sl-attachment-viewer-demo',
  imports: [
    SlAttachment,
    SlAttachmentBody,
    SlAttachmentDetail,
    SlAttachmentGroup,
    SlAttachmentPreview,
    SlAttachmentTrigger,
    SlText,
  ],
  template: `
    <div class="slotted-demo-stack">
      <ul slAttachmentGroup aria-label="Evidence">
        <li slAttachment [file]="report">
          <span slAttachmentPreview></span>
          <div slAttachmentBody>
            <a slAttachmentTrigger href="#police-report.pdf"></a>
            <p slAttachmentDetail>A link: follows, downloads, opens in a new tab</p>
          </div>
        </li>
        <li slAttachment [file]="front">
          <span slAttachmentPreview [src]="photo"></span>
          <div slAttachmentBody>
            <button slAttachmentTrigger (click)="opened.set(front.name)"></button>
            <p slAttachmentDetail>A button: the page opens its own viewer</p>
          </div>
        </li>
      </ul>
      <p slText tone="muted">Opened: {{ opened() }}</p>
    </div>
  `,
})
class ViewerDemo {
  readonly report = REPORT;
  readonly front = FRONT;
  readonly photo = PHOTO_FRONT;
  readonly opened = signal('nothing yet');
}

/** A tray whose files leave on Delete, and where focus goes after each. */
@Component({
  selector: 'sl-attachment-tray-demo',
  imports: [
    SlAttachment,
    SlAttachmentActions,
    SlAttachmentBody,
    SlAttachmentDetail,
    SlAttachmentGroup,
    SlAttachmentPreview,
    SlAttachmentRemove,
    SlAttachmentTrigger,
    SlText,
  ],
  template: `
    <div class="slotted-demo-stack">
      <ul slAttachmentGroup aria-label="Attached to your reply">
        @for (file of files(); track file.name) {
          <li slAttachment [file]="file" removable (remove)="drop($event)">
            <span slAttachmentPreview></span>
            <div slAttachmentBody>
              <button slAttachmentTrigger></button>
              <p slAttachmentDetail></p>
            </div>
            <div slAttachmentActions><button slAttachmentRemove></button></div>
          </li>
        }
      </ul>
      <p slText tone="muted">{{ said() }}</p>
    </div>
  `,
})
class TrayDemo {
  readonly files = signal([CLAIM, FRONT, REAR, REPORT]);
  readonly said = signal('Tab to a file, then press Delete.');

  drop(request: AttachmentRemoveRequest) {
    this.files.update((all) => all.filter((each) => each !== request.file));
    this.said.set(
      `${request.file.name} removed by ${request.reason === 'keyboard' ? 'the keyboard' : 'the remove control'}.`,
    );
  }
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_ATTACHMENT_DOCS.attachment.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    sizes: Sizes,
    orientation: Orientation,
    layout: Layout,
    kinds: Kinds,
    trigger: Trigger,
    actions: Actions,
    states: States,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta: Meta<AttachmentStoryArgs> = {
  title: 'Components/Attachment',
  component: SlAttachment,
  decorators: [
    moduleMetadata({ imports: [...PARTS, SlGlyph, SlIcon, SlText, TrayDemo, ViewerDemo] }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Attachment',
        description:
          'A file that already belongs to something — a message, a record, a tray: the kind’s tile, the name, a line of detail, a target that opens it and the actions the application offers on it.',
        framework: 'Angular',
        ...ANGULAR_ATTACHMENT_DOCS.attachment,
        tokens: ANGULAR_ATTACHMENT_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<AttachmentStoryArgs>;

const FILES = { CLAIM, DASHCAM, ESTIMATE, FRONT, KINDS, PHOTO_FRONT, PHOTO_REAR, REAR, REPORT };

export const Playground: Story = {
  args: { disabled: false, invalid: false, loading: false, orientation: 'horizontal', size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, ...FILES },
    template: `
<ul slAttachmentGroup aria-label="Attachments">
  ${row('CLAIM', '[size]="size" [orientation]="orientation" [invalid]="invalid" [loading]="loading" [disabled]="disabled"')}
</ul>`,
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    props: FILES,
    template: `
<div class="slotted-demo-grid">
${scene(
  'Every part',
  'Tile, trigger, detail, message, progress, an action and remove: the whole anatomy on one file that is still sending and has already been flagged.',
  `<ul slAttachmentGroup aria-label="Every part">
    <li slAttachment [file]="DASHCAM" invalid loading removable>
      <span slAttachmentPreview></span>
      <div slAttachmentBody>
        <button slAttachmentTrigger></button>
        <p slAttachmentDetail>Uploading · 62% of 84 MB</p>
      </div>
      <p slAttachmentMessage>The file is larger than the 50 MB this claim accepts.</p>
      <div slAttachmentProgress [value]="62"></div>
      <div slAttachmentActions>
        <button slAttachmentAction [attr.aria-label]="'Share ' + DASHCAM.name">
          <span slIcon><svg slGlyph name="external"></svg></span>
        </button>
        <button slAttachmentRemove></button>
      </div>
    </li>
  </ul>`,
)}
${scene(
  'A name and nothing else',
  'No tile, no trigger, no actions: the name takes the width they held, and a file nobody can open writes its name without a control.',
  `<div slAttachment [file]="{ name: 'VIN_WVWZZZ1JZXW000001_TELEMATICS_EXPORT' }">
    <div slAttachmentBody>
      <span slAttachmentFilename></span>
      <p slAttachmentDetail>No preview available</p>
    </div>
  </div>`,
)}
</div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: FILES,
    template: `
<div class="slotted-demo-grid">
${(['sm', 'md', 'lg'] as const)
  .map((size) =>
    scene(
      size,
      `size="${size}": the tile is the height of the two lines beside it, and the insets step with the size.`,
      `<ul slAttachmentGroup aria-label="Size ${size}" size="${size}">${row('ESTIMATE')}</ul>`,
    ),
  )
  .join('')}
</div>`,
  }),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => ({
    props: FILES,
    template: `
<div class="slotted-demo-grid">
${scene(
  'horizontal',
  'The row: tile at the start, actions at the end, both centred on the name and its detail.',
  `<ul slAttachmentGroup aria-label="Photo">${row('FRONT', '', 'PHOTO_FRONT')}</ul>`,
)}
${scene(
  'vertical',
  'The card: three tiles wide, the picture square, the actions on a plate over the picture, the extension under the mark when there is no picture.',
  `<ul slAttachmentGroup aria-label="Photos and reports" layout="grid" orientation="vertical">
    ${row('FRONT', '', 'PHOTO_FRONT')}${row('REPORT')}
  </ul>`,
)}
</div>`,
  }),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => ({
    props: FILES,
    template: `
<div class="slotted-demo-grid">
${scene(
  'list',
  'A column, eight pixels between files: the default, and what a thread shows under a message.',
  `<ul slAttachmentGroup aria-label="Claim documents">${row('CLAIM')}${row('ESTIMATE')}</ul>`,
)}
${scene(
  'grid',
  'Rows share the width and never go narrower than 16rem; cards keep their own width so each stays a whole pixel.',
  `<ul slAttachmentGroup aria-label="Claim documents" layout="grid">${row('CLAIM')}${row('ESTIMATE')}${row('REPORT')}</ul>`,
)}
${scene(
  'strip',
  'One line that scrolls and snaps to each file — a composer’s tray. A focused file at either end keeps its whole ring.',
  `<ul slAttachmentGroup aria-label="Attached to your reply" layout="strip" size="sm">
    @for (file of [CLAIM, FRONT, REAR, REPORT, ESTIMATE]; track file.name) {
      <li slAttachment [file]="file" removable>
        <span slAttachmentPreview></span>
        <div slAttachmentBody>
          <span slAttachmentFilename></span>
          <p slAttachmentDetail></p>
        </div>
        <div slAttachmentActions><button slAttachmentRemove></button></div>
      </li>
    }
  </ul>`,
)}
</div>`,
  }),
};

export const Kinds: Story = {
  parameters: scenario('kinds'),
  render: () => ({
    props: FILES,
    template: `
<div class="slotted-demo-grid">
${scene(
  'Nine kinds',
  'Each kind reads the tile upload reads, so a PDF is the same red in both families. The kind comes from the media type first and the extension second.',
  `<ul slAttachmentGroup aria-label="Every kind" layout="grid">
    @for (file of KINDS; track file.name) {
      <li slAttachment [file]="file">
        <span slAttachmentPreview></span>
        <div slAttachmentBody>
          <span slAttachmentFilename></span>
          <p slAttachmentDetail></p>
        </div>
      </li>
    }
  </ul>`,
)}
${scene(
  'Thumbnails, and one that fails',
  'A picture replaces the tile. The second source does not exist, so the thumbnail falls back to the image tile rather than to a broken picture.',
  `<ul slAttachmentGroup aria-label="Photos" layout="grid" orientation="vertical">
    ${row('FRONT', '', 'PHOTO_FRONT')}${row('REAR', '', "'missing-thumbnail.jpg'")}${row("{ name: 'damage-side.jpg', size: 3100000 }", '', 'PHOTO_REAR')}
  </ul>`,
)}
</div>`,
  }),
};

export const Trigger: Story = {
  parameters: scenario('trigger'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
${scene(
  'A link and a button',
  'Point anywhere on either attachment: the whole of it answers and the name underlines. Tab to it: the ring goes round the attachment, not the words.',
  '<sl-attachment-viewer-demo></sl-attachment-viewer-demo>',
)}
</div>`,
  }),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => ({
    props: FILES,
    template: `
<div class="slotted-demo-grid">
${scene(
  'Download, share, remove',
  'Inner controls: no frame at rest, an 8% state layer on hover and 14% on press, the ring inside the box. A read-only thread leaves removable off and shows no remove.',
  `<ul slAttachmentGroup aria-label="Claim documents">
    ${row('CLAIM')}
    <li slAttachment [file]="ESTIMATE">
      <span slAttachmentPreview></span>
      <div slAttachmentBody>
        <a slAttachmentTrigger href="#estimate"></a>
        <p slAttachmentDetail>Read-only: shared by the garage</p>
      </div>
      <div slAttachmentActions><button slAttachmentRemove></button></div>
    </li>
  </ul>`,
)}
</div>`,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: FILES,
    template: `
<div class="slotted-demo-grid">
${scene(
  'invalid, loading, disabled',
  'The failed file tints, doubles its edge and says why; its tile keeps the kind. The sending file refuses its trigger and keeps remove. The expired link keeps its destination and refuses it.',
  `<ul slAttachmentGroup aria-label="States">
    <li slAttachment [file]="{ name: 'photos-batch.zip', size: 38000000 }" invalid removable>
      <span slAttachmentPreview></span>
      <div slAttachmentBody>
        <button slAttachmentTrigger></button>
        <p slAttachmentDetail>38 MB · Not sent</p>
      </div>
      <p slAttachmentMessage>Archives are not accepted on this claim. Attach the photos one by one, up to 25 MB each.</p>
      <div slAttachmentActions><button slAttachmentRemove></button></div>
    </li>
    <li slAttachment [file]="DASHCAM" loading removable>
      <span slAttachmentPreview></span>
      <div slAttachmentBody>
        <button slAttachmentTrigger></button>
        <p slAttachmentDetail>Uploading · 62% of 84 MB</p>
      </div>
      <div slAttachmentProgress [value]="62"></div>
      <div slAttachmentActions><button slAttachmentRemove></button></div>
    </li>
    <li slAttachment [file]="{ name: 'witness-statement.docx', size: 41000 }" loading>
      <span slAttachmentPreview></span>
      <div slAttachmentBody>
        <button slAttachmentTrigger></button>
        <p slAttachmentDetail>Scanning for viruses</p>
      </div>
      <div slAttachmentProgress></div>
    </li>
    ${row("{ name: 'quote-expired.pdf', size: 190000 }", 'disabled')}
  </ul>`,
)}
</div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: FILES,
    template: `
<div class="slotted-demo-grid">
${scene(
  'Long, right-to-left, no extension',
  'The stem shrinks and .pdf stays; the full name is the trigger title. The Arabic name keeps its own direction, and a name with no dot is one run.',
  `<div class="slotted-demo-measure">
    <ul slAttachmentGroup aria-label="Awkward names">
      ${row("{ name: 'quarterly-loss-adjustment-report-consolidated-final-v7-signed.pdf', size: 3400000 }")}
      ${row("{ name: 'صورة-الضرر-الأمامي.png', size: 2200000 }")}
      ${row("{ name: 'VIN_WVWZZZ1JZXW000001_TELEMATICS_EXPORT_RAW', size: 12000 }")}
    </ul>
  </div>`,
)}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: FILES,
    template: `
<div class="slotted-demo-grid">
${scene(
  'A claim thread',
  'A message from the adjuster with its files under the text: links that download, one photo still sending. The size is set once on the group for the whole message.',
  `<div class="slotted-demo-stack">
    <p slText>Maria Okafor · 14 Sep, 09:12</p>
    <p slText tone="muted">Here is the signed claim form and the garage estimate. The rear photo is still uploading.</p>
    <ul slAttachmentGroup aria-label="Attached to Maria Okafor’s message" layout="grid" size="sm">
      ${row('CLAIM')}${row('ESTIMATE')}
      <li slAttachment [file]="REAR" loading>
        <span slAttachmentPreview [src]="PHOTO_REAR"></span>
        <div slAttachmentBody>
          <button slAttachmentTrigger></button>
          <p slAttachmentDetail>Uploading · 40%</p>
        </div>
        <div slAttachmentProgress [value]="40"></div>
      </li>
    </ul>
  </div>`,
)}
</div>`,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
${scene(
  'Remove, and keep the keyboard',
  'Delete or Backspace on a file asks to remove it; focus moves to the file that took its place, then the last one, then the list.',
  '<sl-attachment-tray-demo></sl-attachment-tray-demo>',
)}
</div>`,
  }),
};
