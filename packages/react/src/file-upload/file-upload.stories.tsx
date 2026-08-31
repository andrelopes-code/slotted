import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { ProgressBar } from '../progress-bar';
import { FileUpload } from './file-upload';
import { REACT_FILE_UPLOAD_DOCS, REACT_FILE_UPLOAD_TOKENS } from './file-upload.docs';
import { FileUploadDropzone } from './file-upload-dropzone';
import { FileUploadInput } from './file-upload-input';
import { FileUploadItem } from './file-upload-item';
import { FileUploadList } from './file-upload-list';
import type { FileUploadProps, FileUploadRejection } from './file-upload.types';

const kilobytes = (bytes: number) => `${Math.max(Math.round(bytes / 1024), 1)} KB`;

/**
 * A demonstration holds its own selection, because that is what a real
 * consumer does: whoever uploads the files is the one who has them.
 */
function Upload({ children, ...props }: Partial<FileUploadProps>) {
  const [files, setFiles] = useState<File[]>([]);
  const [rejections, setRejections] = useState<FileUploadRejection[]>([]);

  return (
    <div className="slotted-demo-stack">
      <FileUpload {...props} files={files} onFilesChange={setFiles} onReject={setRejections}>
        <FileUploadDropzone>
          <FileUploadInput />
          <span>{children ?? 'Drop files here, or choose from your device'}</span>
        </FileUploadDropzone>
        <FileUploadList>
          {files.map((file) => (
            <FileUploadItem key={`${file.name}-${file.lastModified}`}>
              <span>{file.name}</span>
              <span className="slotted-demo-scene__note">{kilobytes(file.size)}</span>
            </FileUploadItem>
          ))}
        </FileUploadList>
      </FileUpload>
      {rejections.length > 0 && (
        <ul>
          {rejections.map((rejection) => (
            <li key={`${rejection.file.name}-${rejection.reason}`}>
              {rejection.file.name} was refused: {rejection.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Validation as never,
});

const meta = {
  title: 'Components/FileUpload',
  component: FileUpload,
  args: { disabled: false, multiple: true },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'FileUpload',
        description: 'A region that accepts files by drop and by picker, and says what it refused.',
        framework: 'React',
        ...REACT_FILE_UPLOAD_DOCS.fileUpload,
        tokens: REACT_FILE_UPLOAD_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { accept: '', multiple: true },
  argTypes: { maxSize: { control: 'number' } },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Upload {...args} />
    </div>
  ),
};

export const Validation: Story = {
  parameters: scenario('validation'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">images only</span>
          <span className="slotted-demo-scene__note">
            The picker filters, and so does the drop.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Upload accept="image/*" multiple>
            Drop images here
          </Upload>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">one file, under 64 KB</span>
          <span className="slotted-demo-scene__note">
            A second file is refused rather than dropped in silence.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Upload maxSize={65536}>Drop one small file here</Upload>
        </div>
      </section>
    </div>
  ),
};

export const Progress: Story = {
  parameters: scenario('progress'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <FileUpload defaultFiles={[]} multiple>
          <FileUploadList>
            {[
              ['brief.pdf', 100],
              ['diagram.png', 62],
              ['notes.md', 0],
            ].map(([name, value]) => (
              <FileUploadItem key={name as string}>
                <span>{name}</span>
                <ProgressBar
                  aria-label={`Uploading ${name as string}`}
                  style={{ flex: 1 }}
                  value={value as number}
                />
              </FileUploadItem>
            ))}
          </FileUploadList>
        </FileUpload>
        <p>
          The library selects files and never uploads them, so it has no progress of its own to
          report. Whoever performs the upload composes a ProgressBar into the row and gives it the
          number they already have.
        </p>
      </div>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Upload multiple>Drop files here, or choose from your device</Upload>
        <ul>
          <li>
            The region is a <code>&lt;label&gt;</code> and the input is inside it, so the
            region&rsquo;s text is the input&rsquo;s accessible name and clicking anywhere in the
            region opens the picker. Nothing is generated and nothing is wired.
          </li>
          <li>
            Tab to the control: the ring appears around the region, because the input it belongs to
            is one pixel and invisible.
          </li>
          <li>
            The list of chosen files is <code>aria-live=&quot;polite&quot;</code>. A drop is
            otherwise silent — the pointer completes an action and nothing says what arrived.
          </li>
          <li>
            Drag and drop cannot be made keyboard-accessible, and is not asked to be. It is layered
            on a region whose control works without it.
          </li>
        </ul>
      </div>
    </div>
  ),
};
