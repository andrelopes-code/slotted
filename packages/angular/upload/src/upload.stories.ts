import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlButton } from '@slotted/angular/button';
import { SlText } from '@slotted/angular/typography';

import { SlUpload } from './upload';
import { CLAIM, demoAdapter, SlUploadDemo } from './upload.demo';
import { ANGULAR_UPLOAD_DOCS, ANGULAR_UPLOAD_TOKENS } from './upload.docs';

interface UploadStoryArgs {
  accept: string;
  description: string;
  label: string;
  layout: 'list' | 'grid';
  maxFiles: number;
  maxSize: number;
  multiple: boolean;
  size: 'sm' | 'md' | 'lg';
  variant: 'dropzone' | 'button' | 'field';
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_UPLOAD_DOCS.upload.scenes, {
    playground: Playground,
    variants: Variants,
    layout: Layout,
    sizes: Sizes,
    restrictions: Restrictions,
    duplicates: Duplicates,
    directory: Directory,
    capture: Capture,
    paste: Paste,
    'drag-verdict': DragVerdict,
    transfer: Transfer,
    'manual-start': ManualStart,
    queue: Queue,
    retry: Retry,
    pause: Pause,
    cancel: Cancel,
    stalled: Stalled,
    previews: Previews,
    viewer: Viewer,
    kinds: Kinds,
    content: Content,
    'in-a-form': InAForm,
    states: States,
    keyboard: Keyboard,
    composition: Composition,
    defaults: Defaults,
    adapter: Adapter,
  }) as never;

const meta: Meta<UploadStoryArgs> = {
  title: 'Components/Upload',
  component: SlUpload,
  decorators: [moduleMetadata({ imports: [SlButton, SlText, SlUpload, SlUploadDemo] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Upload',
        description:
          'A drop region, a file input and the manager that shows what is being sent — one family, because they are one job. Every demonstration below is a live upload against a sender that moves bytes at a stated rate: drop a file on any of them, or press Browse files. The claim they are all about is CLM-2026-0914, a car accident with photographs, a police report and a garage estimate.',
        framework: 'Angular',
        ...ANGULAR_UPLOAD_DOCS.upload,
        tokens: ANGULAR_UPLOAD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<UploadStoryArgs>;

/** The stage every story stands on, so no story reaches for an inline style. */
const stage = (body: string) => `<div class="slotted-demo-stage" data-layout="block">${body}</div>`;

export const Playground: Story = {
  args: {
    accept: 'application/pdf,image/*',
    description: 'PDF, JPEG or PNG, up to 10 MB each. Ten files at most.',
    label: 'Supporting documents',
    layout: 'list',
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024,
    multiple: true,
    size: 'md',
    variant: 'dropzone',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, seed: [CLAIM.form, CLAIM.front] },
    template: stage(`
      <div
        slUploadDemo
        [accept]="accept"
        [description]="description"
        [label]="label"
        [layout]="layout"
        [maxFiles]="maxFiles"
        [maxSize]="maxSize"
        [multiple]="multiple"
        [seed]="seed"
        [size]="size"
        [variant]="variant"
      ></div>
    `),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: {
      one: [CLAIM.form],
      logbook: [CLAIM.logbook],
      none: [],
    },
    template: stage(`
      <div
        slUploadDemo
        description="The shape for a page that expects several attachments."
        label="Supporting documents"
        variant="dropzone"
        [multiple]="true"
        [seed]="one"
      ></div>
      <div slUploadDemo label="Attach a file" variant="button" [seed]="none"></div>
      <div slUploadDemo label="Proof of ownership" variant="field" [seed]="logbook"></div>
    `),
  }),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => ({
    props: { seed: [CLAIM.front, CLAIM.rear, CLAIM.airbag, CLAIM.archive] },
    template: stage(`
      <div
        slUploadDemo
        accept="image/*"
        label="Photographs of the damage"
        layout="grid"
        [multiple]="true"
        [seed]="seed"
      ></div>
    `),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { one: [CLAIM.form], photo: [CLAIM.front] },
    template: stage(`
      <div slUploadDemo label="sm" size="sm" variant="field" [seed]="one"></div>
      <div slUploadDemo label="md" size="md" variant="field" [seed]="one"></div>
      <div slUploadDemo label="lg" size="lg" variant="field" [seed]="one"></div>
      <div slUploadDemo label="lg, on a page of its own" size="lg" [seed]="photo"></div>
    `),
  }),
};

export const Restrictions: Story = {
  parameters: scenario('restrictions'),
  render: () => ({
    props: {
      seed: [
        CLAIM.form,
        { ...CLAIM.archive, status: 'rejected', reason: 'type' },
        { ...CLAIM.dashcam, status: 'rejected', reason: 'size' },
        { ...CLAIM.unnamed, status: 'rejected', reason: 'totalSize' },
      ],
    },
    template: stage(`
      <div
        slUploadDemo
        accept="application/pdf,image/*"
        description="PDF, JPEG or PNG. Nothing over 5 MB, and no more than four."
        label="Supporting documents"
        [maxFiles]="4"
        [maxSize]="5242880"
        [multiple]="true"
        [seed]="seed"
      ></div>
    `),
  }),
};

export const Duplicates: Story = {
  parameters: scenario('duplicates'),
  render: () => ({
    props: {
      refused: [CLAIM.form, { ...CLAIM.form, status: 'rejected', reason: 'duplicate' }],
      both: [CLAIM.police, CLAIM.police],
    },
    template: stage(`
      <div
        slUploadDemo
        label="reject — the second copy is refused"
        [multiple]="true"
        [seed]="refused"
      ></div>
      <div slUploadDemo label="allow — both are kept" [multiple]="true" [seed]="both"></div>
    `),
  }),
};

export const Directory: Story = {
  parameters: scenario('directory'),
  render: () => ({
    props: {
      seed: [CLAIM.form, CLAIM.police, CLAIM.witness, CLAIM.garage, CLAIM.medical],
    },
    template: stage(`
      <div
        slUploadDemo
        description="Choose the folder the scanner wrote to. Every file keeps the path it had inside it."
        label="Scanned case file"
        [directory]="true"
        [maxFiles]="400"
        [maxRows]="4"
        [multiple]="true"
        [seed]="seed"
      ></div>
    `),
  }),
};

export const Capture: Story = {
  parameters: scenario('capture'),
  render: () => ({
    props: { seed: [CLAIM.front] },
    template: stage(`
      <div
        slUploadDemo
        accept="image/*"
        description="On a phone this opens the camera rather than a file browser."
        label="Photograph the damage"
        variant="button"
        [seed]="seed"
      ></div>
    `),
  }),
};

export const Paste: Story = {
  parameters: scenario('paste'),
  render: () => ({
    props: { none: [] },
    template: stage(`
      <div
        slUploadDemo
        description="Focus this region and press ⌘V or Ctrl+V. A screenshot on the clipboard is a file."
        label="Paste a screenshot"
        [multiple]="true"
        [seed]="none"
      ></div>
    `),
  }),
};

export const DragVerdict: Story = {
  parameters: scenario('drag-verdict'),
  render: () => ({
    props: { none: [] },
    template: stage(`
      <p slText size="sm" tone="muted">
        Drag a PDF over the first and a spreadsheet over the second, and let go of neither.
      </p>
      <div
        slUploadDemo
        accept="application/pdf"
        label="Only a PDF is taken here"
        [seed]="none"
      ></div>
      <div
        slUploadDemo
        accept="image/*"
        label="Only a picture is taken here"
        [multiple]="true"
        [seed]="none"
      ></div>
    `),
  }),
};

export const Transfer: Story = {
  parameters: scenario('transfer'),
  render: () => ({
    props: { adapter: demoAdapter({ bytesPerSecond: 1_400_000 }), seed: [CLAIM.form] },
    template: stage(`
      <div
        slUploadDemo
        description="Drop a file, or press Browse files: it is sent at about 1.4 MB a second."
        label="Supporting documents"
        [adapter]="adapter"
        [multiple]="true"
        [seed]="seed"
      ></div>
    `),
  }),
};

export const ManualStart: Story = {
  parameters: scenario('manual-start'),
  render: () => ({
    props: {
      adapter: demoAdapter(),
      seed: [CLAIM.witness, CLAIM.garage, CLAIM.medical],
    },
    template: stage(`
      <div
        #demo="slUploadDemo"
        slUploadDemo
        description="Nothing leaves until the button below is pressed, or a row's own play control is."
        label="Supporting documents"
        [adapter]="adapter"
        [autoUpload]="false"
        [multiple]="true"
        [seed]="seed"
      ></div>
    `),
  }),
};

export const Queue: Story = {
  parameters: scenario('queue'),
  render: () => ({
    props: {
      adapter: demoAdapter({ bytesPerSecond: 700_000 }),
      seed: [
        CLAIM.form,
        CLAIM.notes,
        CLAIM.estimate,
        CLAIM.witness,
        CLAIM.garage,
        CLAIM.medical,
        CLAIM.police,
        CLAIM.front,
        CLAIM.rear,
      ].map((file) => ({ ...file, status: 'ready' })),
    },
    template: stage(`
      <div
        slUploadDemo
        description="Nine files, three at a time. What is waiting says Queued; the summary carries the count and the time left."
        label="The whole case file"
        [adapter]="adapter"
        [concurrency]="3"
        [maxRows]="5"
        [multiple]="true"
        [seed]="seed"
      ></div>
    `),
  }),
};

export const Retry: Story = {
  parameters: scenario('retry'),
  render: () => ({
    props: {
      adapter: demoAdapter({ fails: true }),
      seed: [
        { ...CLAIM.medical, status: 'error' },
        { ...CLAIM.garage, status: 'error' },
        CLAIM.form,
      ],
    },
    template: stage(`
      <div
        slUploadDemo
        label="Two failures, and what each row offers"
        [adapter]="adapter"
        [multiple]="true"
        [seed]="seed"
      ></div>
    `),
  }),
};

export const Pause: Story = {
  parameters: scenario('pause'),
  render: () => ({
    props: {
      resumable: demoAdapter({ bytesPerSecond: 2_000_000, pausable: true }),
      plain: demoAdapter({ bytesPerSecond: 2_000_000 }),
      video: [{ ...CLAIM.dashcam, status: 'ready' }],
      audio: [{ ...CLAIM.call, status: 'ready' }],
    },
    template: stage(`
      <div
        slUploadDemo
        description="This sender declares pausable, so the row draws a pause."
        label="A resumable sender"
        [adapter]="resumable"
        [seed]="video"
      ></div>
      <div
        slUploadDemo
        description="This one does not, so the row draws none — a control that cannot be honoured is a control that lies."
        label="A sender that cannot suspend"
        [adapter]="plain"
        [seed]="audio"
      ></div>
    `),
  }),
};

export const Cancel: Story = {
  parameters: scenario('cancel'),
  render: () => ({
    props: {
      adapter: demoAdapter({ bytesPerSecond: 500_000 }),
      seed: [
        { ...CLAIM.dashcam, status: 'ready' },
        { ...CLAIM.call, status: 'canceled', loaded: 3_100_000 },
      ],
    },
    template: stage(`
      <div
        slUploadDemo
        description="Cancel stops the run and keeps the file; remove takes the row away. Stop the first and start it again."
        label="Two different actions"
        [adapter]="adapter"
        [multiple]="true"
        [seed]="seed"
      ></div>
    `),
  }),
};

export const Stalled: Story = {
  parameters: scenario('stalled'),
  render: () => ({
    props: {
      adapter: demoAdapter({ bytesPerSecond: 3_000_000, stalls: true }),
      seed: [{ ...CLAIM.police, status: 'ready' }],
    },
    template: stage(`
      <div
        slUploadDemo
        description="This sender stops reporting at 43% and never fails. After ten seconds the row says so."
        label="A transfer that stops without failing"
        [adapter]="adapter"
        [seed]="seed"
        [stallAfter]="10000"
      ></div>
    `),
  }),
};

export const Previews: Story = {
  parameters: scenario('previews'),
  render: () => ({
    props: {
      pictures: [CLAIM.front, CLAIM.rear, CLAIM.estimate],
      contracts: [CLAIM.form, CLAIM.witness, CLAIM.garage],
    },
    template: stage(`
      <div
        slUploadDemo
        label="preview auto — an image gets a thumbnail"
        layout="grid"
        preview="auto"
        [multiple]="true"
        [seed]="pictures"
      ></div>
      <div
        slUploadDemo
        label="preview none — a dense list of contracts"
        preview="none"
        [multiple]="true"
        [seed]="contracts"
      ></div>
    `),
  }),
};

export const Viewer: Story = {
  parameters: scenario('viewer'),
  render: () => ({
    props: {
      seed: [CLAIM.front, CLAIM.form, CLAIM.estimate, CLAIM.rear, CLAIM.call],
    },
    template: stage(`
      <div
        slUploadDemo
        description="Click a name. Arrows move through the set, Home and End jump to its ends, Escape closes it — and the spreadsheet is skipped, because a browser cannot draw one."
        label="Everything attached to the claim"
        [maxRows]="5"
        [multiple]="true"
        [seed]="seed"
      ></div>
    `),
  }),
};

export const Kinds: Story = {
  parameters: scenario('kinds'),
  render: () => ({
    props: {
      seed: [
        CLAIM.form,
        CLAIM.notes,
        CLAIM.estimate,
        CLAIM.review,
        CLAIM.front,
        CLAIM.dashcam,
        CLAIM.call,
        CLAIM.archive,
        CLAIM.unnamed,
      ],
    },
    template: stage(`
      <div
        slUploadDemo
        label="Nine kinds, read against each other"
        variant="button"
        [maxRows]="9"
        [multiple]="true"
        [seed]="seed"
      ></div>
    `),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: {
      seed: [CLAIM.long, CLAIM.arabic, { ...CLAIM.unnamed, status: 'rejected', reason: 'size' }],
      narrow: [CLAIM.long, CLAIM.arabic, CLAIM.form],
    },
    template: stage(`
      <div
        slUploadDemo
        label="Names the family did not choose"
        variant="button"
        [multiple]="true"
        [seed]="seed"
      ></div>
      <div class="slotted-demo-measure">
        <div
          slUploadDemo
          label="The same three at 360 pixels"
          variant="button"
          [multiple]="true"
          [seed]="narrow"
        ></div>
      </div>
    `),
  }),
};

export const InAForm: Story = {
  parameters: scenario('in-a-form'),
  render: () => ({
    props: {
      adapter: demoAdapter({ bytesPerSecond: 600_000 }),
      proof: [CLAIM.logbook],
      documents: [CLAIM.front, { ...CLAIM.police, status: 'ready' }],
      failed: [{ ...CLAIM.medical, status: 'error' }],
    },
    template: stage(`
      <div
        slUploadDemo
        label="Proof of ownership"
        variant="field"
        [required]="true"
        [seed]="proof"
      ></div>
      <div
        slUploadDemo
        label="Supporting documents"
        [adapter]="adapter"
        [multiple]="true"
        [seed]="documents"
      ></div>
      <div
        slUploadDemo
        label="Medical certificate"
        variant="field"
        [invalid]="true"
        [seed]="failed"
      ></div>
    `),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: {
      adapter: demoAdapter({ bytesPerSecond: 400_000 }),
      one: [CLAIM.form],
      two: [CLAIM.form, CLAIM.front],
      none: [],
      moving: [
        { ...CLAIM.dashcam, status: 'ready' },
        { ...CLAIM.call, status: 'ready' },
      ],
      done: [CLAIM.form, CLAIM.witness],
    },
    template: stage(`
      <div slUploadDemo label="disabled" [disabled]="true" [seed]="one"></div>
      <div
        slUploadDemo
        label="readOnly — the list stays readable and every control goes"
        [multiple]="true"
        [readOnly]="true"
        [seed]="two"
      ></div>
      <div
        slUploadDemo
        label="invalid and required"
        variant="field"
        [invalid]="true"
        [required]="true"
        [seed]="none"
      ></div>
      <div
        slUploadDemo
        label="loading — the root says so while anything is moving"
        [adapter]="adapter"
        [multiple]="true"
        [seed]="moving"
      ></div>
      <div
        slUploadDemo
        label="complete — every file that entered the queue arrived"
        [multiple]="true"
        [seed]="done"
      ></div>
    `),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: {
      adapter: demoAdapter({ bytesPerSecond: 900_000 }),
      seed: [CLAIM.form, { ...CLAIM.medical, status: 'error' }, CLAIM.front],
    },
    template: stage(`
      <p slText size="sm" tone="muted">
        Tab to the trigger and press Enter. Tab again for each row: the name opens the file, then its
        controls in order.
      </p>
      <div
        slUploadDemo
        label="Supporting documents"
        [adapter]="adapter"
        [multiple]="true"
        [seed]="seed"
      ></div>
    `),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: {
      adapter: demoAdapter({ fails: true }),
      seed: [{ ...CLAIM.medical, status: 'error' }, CLAIM.form],
    },
    template: stage(`
      <div
        #demo="slUploadDemo"
        slUploadDemo
        label="The directive on the consumer's own element, with a note of the application's inside it"
        [adapter]="adapter"
        [multiple]="true"
        [seed]="seed"
      >
        <p slText size="sm" tone="muted">Documents are kept for seven years.</p>
      </div>
    `),
  }),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => ({
    props: {
      seed: [CLAIM.form, { ...CLAIM.dashcam, status: 'rejected', reason: 'size' }],
      one: [CLAIM.witness],
    },
    template: stage(`
      <div
        slUploadDemo
        description="provideUploadDefaults sets the limits once in the injector; provideSlotted sets every word and the locale."
        label="Documentos do sinistro"
        [maxSize]="2097152"
        [multiple]="true"
        [seed]="seed"
      ></div>
      <div slUploadDemo label="A second one, with the same provider" variant="field" [seed]="one"></div>
    `),
  }),
};

export const Adapter: Story = {
  parameters: scenario('adapter'),
  render: () => ({
    props: {
      works: demoAdapter({ bytesPerSecond: 2_000_000 }),
      fails: demoAdapter({ bytesPerSecond: 2_000_000, fails: true }),
      resumable: demoAdapter({ bytesPerSecond: 2_000_000, pausable: true }),
      front: [{ ...CLAIM.front, status: 'ready' }],
      rear: [{ ...CLAIM.rear, status: 'ready' }],
      video: [{ ...CLAIM.dashcam, status: 'ready' }],
    },
    template: stage(`
      <p slText size="sm" tone="muted">
        Three senders, one contract. The first reports progress and succeeds, the second fails, the
        third suspends between chunks.
      </p>
      <div slUploadDemo label="A sender that works" [adapter]="works" [seed]="front"></div>
      <div slUploadDemo label="A sender that fails" [adapter]="fails" [seed]="rear"></div>
      <div
        slUploadDemo
        label="A sender that can be suspended"
        [adapter]="resumable"
        [seed]="video"
      ></div>
    `),
  }),
};
