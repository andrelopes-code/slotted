import { booleanAttribute, Component, input, numberAttribute, signal } from '@angular/core';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlProgressBar } from '../../progress-bar/src/progress-bar';
import { SlFileUpload } from './file-upload';
import type { FileUploadRejection } from './file-upload';
import { ANGULAR_FILE_UPLOAD_DOCS, ANGULAR_FILE_UPLOAD_TOKENS } from './file-upload.docs';
import { SlFileUploadDropzone } from './file-upload-dropzone';
import { SlFileUploadInput } from './file-upload-input';
import { SlFileUploadItem } from './file-upload-item';
import { SlFileUploadList } from './file-upload-list';

interface FileUploadStoryArgs {
  accept: string;
  disabled: boolean;
  maxSize: number | undefined;
  multiple: boolean;
}

/**
 * A demonstration holds its own selection, because that is what a real
 * consumer does: whoever uploads the files is the one who has them.
 */
@Component({
  selector: 'sl-upload-demo',
  standalone: true,
  imports: [
    SlFileUpload,
    SlFileUploadDropzone,
    SlFileUploadInput,
    SlFileUploadItem,
    SlFileUploadList,
  ],
  template: `
    <div class="slotted-demo-stack">
      <div
        slFileUpload
        [accept]="accept()"
        [disabled]="disabled()"
        [maxSize]="maxSize()"
        [multiple]="multiple()"
        [(files)]="files"
        (reject)="rejections.set($event)"
      >
        <label slFileUploadDropzone>
          <input slFileUploadInput />
          <span>{{ prompt() }}</span>
        </label>
        <ul slFileUploadList>
          @for (file of files(); track file.name + file.lastModified) {
            <li slFileUploadItem>
              <span>{{ file.name }}</span>
              <span class="slotted-demo-scene__note">{{ kilobytes(file.size) }}</span>
            </li>
          }
        </ul>
      </div>
      @if (rejections().length > 0) {
        <ul>
          @for (rejection of rejections(); track rejection.file.name + rejection.reason) {
            <li>{{ rejection.file.name }} was refused: {{ rejection.reason }}</li>
          }
        </ul>
      }
    </div>
  `,
})
class UploadDemo {
  readonly accept = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly maxSize = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) => (value === undefined ? undefined : numberAttribute(value)),
  });
  readonly multiple = input(true, { transform: booleanAttribute });
  readonly prompt = input('Drop files here, or choose from your device');

  readonly files = signal<File[]>([]);
  readonly rejections = signal<FileUploadRejection[]>([]);

  kilobytes(bytes: number) {
    return `${Math.max(Math.round(bytes / 1024), 1)} KB`;
  }
}

const UPLOAD_IMPORTS = [
  SlFileUpload,
  SlFileUploadDropzone,
  SlFileUploadInput,
  SlFileUploadItem,
  SlFileUploadList,
];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Validation as never,
});

const meta: Meta<FileUploadStoryArgs> = {
  title: 'Components/FileUpload',
  component: SlFileUpload,
  decorators: [moduleMetadata({ imports: [SlProgressBar, UploadDemo, ...UPLOAD_IMPORTS] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'FileUpload',
        description: 'A region that accepts files by drop and by picker, and says what it refused.',
        framework: 'Angular',
        ...ANGULAR_FILE_UPLOAD_DOCS.fileUpload,
        tokens: ANGULAR_FILE_UPLOAD_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<FileUploadStoryArgs>;

export const Playground: Story = {
  args: { accept: '', disabled: false, maxSize: undefined, multiple: true },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <sl-upload-demo
    [accept]="accept"
    [disabled]="disabled"
    [maxSize]="maxSize"
    [multiple]="multiple"
  ></sl-upload-demo>
</div>`,
  }),
};

export const Validation: Story = {
  parameters: scenario('validation'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">images only</span>
      <span class="slotted-demo-scene__note">The picker filters, and so does the drop.</span>
    </header>
    <div class="slotted-demo-stage">
      <sl-upload-demo accept="image/*" prompt="Drop images here"></sl-upload-demo>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">one file, under 64 KB</span>
      <span class="slotted-demo-scene__note">A second file is refused rather than dropped in silence.</span>
    </header>
    <div class="slotted-demo-stage">
      <sl-upload-demo prompt="Drop one small file here" [maxSize]="65536" [multiple]="false"></sl-upload-demo>
    </div>
  </section>
</div>`,
  }),
};

export const Progress: Story = {
  parameters: scenario('progress'),
  render: () => ({
    props: {
      rows: [
        { name: 'brief.pdf', value: 100 },
        { name: 'diagram.png', value: 62 },
        { name: 'notes.md', value: 0 },
      ],
    },
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <div slFileUpload>
      <ul slFileUploadList>
        @for (row of rows; track row.name) {
          <li slFileUploadItem>
            <span>{{ row.name }}</span>
            <div slProgressBar style="flex: 1" [attr.aria-label]="'Uploading ' + row.name" [value]="row.value"></div>
          </li>
        }
      </ul>
    </div>
    <p>
      The library selects files and never uploads them, so it has no progress of its own to report.
      Whoever performs the upload composes a ProgressBar into the row and gives it the number they
      already have.
    </p>
  </div>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <sl-upload-demo></sl-upload-demo>
    <ul>
      <li>
        The region is a <code>&lt;label&gt;</code> and the input is inside it, so the region&rsquo;s
        text is the input&rsquo;s accessible name and clicking anywhere in the region opens the
        picker. Nothing is generated and nothing is wired.
      </li>
      <li>
        Tab to the control: the ring appears around the region, because the input it belongs to is
        one pixel and invisible.
      </li>
      <li>
        The list of chosen files is <code>aria-live="polite"</code>. A drop is otherwise silent
        &mdash; the pointer completes an action and nothing says what arrived.
      </li>
      <li>
        Drag and drop cannot be made keyboard-accessible, and is not asked to be. It is layered on a
        region whose control works without it.
      </li>
    </ul>
  </div>
</div>`,
  }),
};
