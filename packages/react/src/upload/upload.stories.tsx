import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';

import { Button } from '../button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { Text } from '../typography';
import { Upload } from './upload';
import { CLAIM, DemoUpload, demoAdapter } from './upload-demo';
import { UploadDefaultsProvider } from './upload-defaults';
import { REACT_UPLOAD_DOCS, REACT_UPLOAD_TOKENS } from './upload.docs';
import type { UploadHandle } from './upload.types';

const stage = 'slotted-demo-stage';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_UPLOAD_DOCS.upload.scenes, {
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

const meta = {
  title: 'Components/Upload',
  component: Upload,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Upload',
        description:
          'A drop region, a file input and the manager that shows what is being sent — one family, because they are one job. Every demonstration below is a live upload against a sender that moves bytes at a stated rate: drop a file on any of them, or press Browse files. The claim they are all about is CLM-2026-0914, a car accident with photographs, a police report and a garage estimate.',
        framework: 'React',
        ...REACT_UPLOAD_DOCS.upload,
        tokens: REACT_UPLOAD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Upload>;

export default meta;
type Story = StoryObj<typeof meta>;

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
  render: (args) => (
    <div className={stage} data-layout="block">
      <DemoUpload {...args} seed={[CLAIM.form, CLAIM.front]} />
    </div>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        description="The shape for a page that expects several attachments."
        label="Supporting documents"
        multiple
        seed={[CLAIM.form]}
        variant="dropzone"
      />
      <DemoUpload label="Attach a file" seed={[]} variant="button" />
      <DemoUpload label="Proof of ownership" seed={[CLAIM.logbook]} variant="field" />
    </div>
  ),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        accept="image/*"
        label="Photographs of the damage"
        layout="grid"
        multiple
        seed={[CLAIM.front, CLAIM.rear, CLAIM.airbag, CLAIM.archive]}
      />
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className={stage} data-layout="block">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <DemoUpload key={size} label={size} seed={[CLAIM.form]} size={size} variant="field" />
      ))}
      <DemoUpload label="lg, on a page of its own" seed={[CLAIM.front]} size="lg" />
    </div>
  ),
};

export const Restrictions: Story = {
  parameters: scenario('restrictions'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        accept="application/pdf,image/*"
        description="PDF, JPEG or PNG. Nothing over 5 MB, and no more than four."
        label="Supporting documents"
        maxFiles={4}
        maxSize={5 * 1024 * 1024}
        multiple
        seed={[
          CLAIM.form,
          { ...CLAIM.archive, status: 'rejected', reason: 'type' },
          { ...CLAIM.dashcam, status: 'rejected', reason: 'size' },
          { ...CLAIM.unnamed, status: 'rejected', reason: 'totalSize' },
        ]}
      />
    </div>
  ),
};

export const Duplicates: Story = {
  parameters: scenario('duplicates'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        duplicates="reject"
        label="reject — the second copy is refused"
        multiple
        seed={[CLAIM.form, { ...CLAIM.form, status: 'rejected', reason: 'duplicate' }]}
      />
      <DemoUpload
        duplicates="allow"
        label="allow — both are kept"
        multiple
        seed={[CLAIM.police, CLAIM.police]}
      />
    </div>
  ),
};

export const Directory: Story = {
  parameters: scenario('directory'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        description="Choose the folder the scanner wrote to. Every file keeps the path it had inside it."
        directory
        label="Scanned case file"
        maxFiles={400}
        maxRows={4}
        multiple
        seed={[CLAIM.form, CLAIM.police, CLAIM.witness, CLAIM.garage, CLAIM.medical]}
      />
    </div>
  ),
};

export const Capture: Story = {
  parameters: scenario('capture'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        accept="image/*"
        capture="environment"
        description="On a phone this opens the camera rather than a file browser."
        label="Photograph the damage"
        seed={[CLAIM.front]}
        variant="button"
      />
    </div>
  ),
};

export const Paste: Story = {
  parameters: scenario('paste'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        allowPaste
        description="Focus this region and press ⌘V or Ctrl+V. A screenshot on the clipboard is a file."
        label="Paste a screenshot"
        multiple
        seed={[]}
      />
    </div>
  ),
};

export const DragVerdict: Story = {
  parameters: scenario('drag-verdict'),
  render: () => (
    <div className={stage} data-layout="block">
      <Text size="sm" tone="muted">
        Drag a PDF over the first and a spreadsheet over the second, and let go of neither.
      </Text>
      <DemoUpload accept="application/pdf" label="Only a PDF is taken here" seed={[]} />
      <DemoUpload accept="image/*" label="Only a picture is taken here" multiple seed={[]} />
    </div>
  ),
};

export const Transfer: Story = {
  parameters: scenario('transfer'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        adapter={demoAdapter({ bytesPerSecond: 1_400_000 })}
        description="Drop a file, or press Browse files: it is sent at about 1.4 MB a second."
        label="Supporting documents"
        multiple
        seed={[CLAIM.form]}
      />
    </div>
  ),
};

export const ManualStart: Story = {
  parameters: scenario('manual-start'),
  render: () => {
    const upload = useRef<UploadHandle>(null);
    return (
      <div className={stage} data-layout="block">
        <DemoUpload
          adapter={demoAdapter()}
          autoUpload={false}
          description="Nothing leaves until the button below is pressed, or a row's own play control is."
          handleRef={upload}
          label="Supporting documents"
          multiple
          seed={[CLAIM.witness, CLAIM.garage, CLAIM.medical]}
        />
        <Button onClick={() => upload.current?.upload()} size="sm">
          Send the attachments
        </Button>
      </div>
    );
  },
};

export const Queue: Story = {
  parameters: scenario('queue'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        adapter={demoAdapter({ bytesPerSecond: 700_000 })}
        concurrency={3}
        description="Nine files, three at a time. What is waiting says Queued; the summary carries the count and the time left."
        label="The whole case file"
        maxRows={5}
        multiple
        seed={[
          CLAIM.form,
          CLAIM.notes,
          CLAIM.estimate,
          CLAIM.witness,
          CLAIM.garage,
          CLAIM.medical,
          CLAIM.police,
          CLAIM.front,
          CLAIM.rear,
        ].map((file) => ({ ...file, status: 'ready' as const }))}
      />
    </div>
  ),
};

export const Retry: Story = {
  parameters: scenario('retry'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        adapter={demoAdapter({ fails: true })}
        label="Two failures, and what each row offers"
        multiple
        seed={[
          { ...CLAIM.medical, status: 'error' },
          { ...CLAIM.garage, status: 'error' },
          CLAIM.form,
        ]}
      />
    </div>
  ),
};

export const Pause: Story = {
  parameters: scenario('pause'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        adapter={demoAdapter({ bytesPerSecond: 2_000_000, pausable: true })}
        description="This sender declares pausable, so the row draws a pause."
        label="A resumable sender"
        seed={[{ ...CLAIM.dashcam, status: 'ready' }]}
      />
      <DemoUpload
        adapter={demoAdapter({ bytesPerSecond: 2_000_000 })}
        description="This one does not, so the row draws none — a control that cannot be honored is a control that lies."
        label="A sender that cannot suspend"
        seed={[{ ...CLAIM.call, status: 'ready' }]}
      />
    </div>
  ),
};

export const Cancel: Story = {
  parameters: scenario('cancel'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        adapter={demoAdapter({ bytesPerSecond: 500_000 })}
        description="Cancel stops the run and keeps the file; remove takes the row away. Stop the first and start it again."
        label="Two different actions"
        multiple
        seed={[
          { ...CLAIM.dashcam, status: 'ready' },
          { ...CLAIM.call, status: 'canceled', loaded: 3_100_000 },
        ]}
      />
    </div>
  ),
};

export const Stalled: Story = {
  parameters: scenario('stalled'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        adapter={demoAdapter({ bytesPerSecond: 3_000_000, stalls: true })}
        description="This sender stops reporting at 43% and never fails. After ten seconds the row says so."
        label="A transfer that stops without failing"
        seed={[{ ...CLAIM.police, status: 'ready' }]}
        stallAfter={10_000}
      />
    </div>
  ),
};

export const Previews: Story = {
  parameters: scenario('previews'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        label="preview auto — an image gets a thumbnail"
        layout="grid"
        multiple
        preview="auto"
        seed={[CLAIM.front, CLAIM.rear, CLAIM.estimate]}
      />
      <DemoUpload
        label="preview none — a dense list of contracts"
        multiple
        preview="none"
        seed={[CLAIM.form, CLAIM.witness, CLAIM.garage]}
      />
    </div>
  ),
};

export const Viewer: Story = {
  parameters: scenario('viewer'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        description="Click a name. Arrows move through the set, Home and End jump to its ends, Escape closes it — and the spreadsheet is skipped, because a browser cannot draw one."
        label="Everything attached to the claim"
        maxRows={5}
        multiple
        seed={[CLAIM.front, CLAIM.form, CLAIM.estimate, CLAIM.rear, CLAIM.call]}
      />
    </div>
  ),
};

export const Kinds: Story = {
  parameters: scenario('kinds'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        label="Nine kinds, read against each other"
        maxRows={9}
        multiple
        seed={[
          CLAIM.form,
          CLAIM.notes,
          CLAIM.estimate,
          CLAIM.review,
          CLAIM.front,
          CLAIM.dashcam,
          CLAIM.call,
          CLAIM.archive,
          CLAIM.unnamed,
        ]}
        preview="auto"
        variant="button"
      />
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload
        label="Names the family did not choose"
        multiple
        seed={[CLAIM.long, CLAIM.arabic, { ...CLAIM.unnamed, status: 'rejected', reason: 'size' }]}
        variant="button"
      />
      <div className="slotted-demo-measure">
        <DemoUpload
          label="The same three at 360 pixels"
          multiple
          seed={[CLAIM.long, CLAIM.arabic, CLAIM.form]}
          variant="button"
        />
      </div>
    </div>
  ),
};

export const InAForm: Story = {
  parameters: scenario('in-a-form'),
  render: () => (
    <div className={stage} data-layout="block">
      <Field required>
        <FieldLabel>Proof of ownership</FieldLabel>
        <FieldDescription>The V5 logbook, or the bill of sale.</FieldDescription>
        <DemoUpload minFiles={1} seed={[CLAIM.logbook]} variant="field" />
      </Field>

      <Field>
        <FieldLabel>Supporting documents</FieldLabel>
        <DemoUpload
          adapter={demoAdapter({ bytesPerSecond: 600_000 })}
          multiple
          seed={[CLAIM.front, { ...CLAIM.police, status: 'ready' }]}
        />
      </Field>

      <Field invalid>
        <FieldLabel>Medical certificate</FieldLabel>
        <DemoUpload seed={[{ ...CLAIM.medical, status: 'error' }]} variant="field" />
        <FieldError>The certificate could not be sent. Try again, or send it by post.</FieldError>
      </Field>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className={stage} data-layout="block">
      <DemoUpload disabled label="disabled" seed={[CLAIM.form]} />
      <DemoUpload
        label="readOnly — the list stays readable and every control goes"
        readOnly
        seed={[CLAIM.form, CLAIM.front]}
        multiple
      />
      <DemoUpload invalid label="invalid and required" required seed={[]} variant="field" />
      <DemoUpload
        adapter={demoAdapter({ bytesPerSecond: 400_000 })}
        label="loading — the root says so while anything is moving"
        multiple
        seed={[
          { ...CLAIM.dashcam, status: 'ready' },
          { ...CLAIM.call, status: 'ready' },
        ]}
      />
      <DemoUpload
        label="complete — every file that entered the queue arrived"
        multiple
        seed={[CLAIM.form, CLAIM.witness]}
      />
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <div className={stage} data-layout="block">
      <Text size="sm" tone="muted">
        Tab to the trigger and press Enter. Tab again for each row: the name opens the file, then
        its controls in order.
      </Text>
      <DemoUpload
        adapter={demoAdapter({ bytesPerSecond: 900_000 })}
        label="Supporting documents"
        multiple
        seed={[CLAIM.form, { ...CLAIM.medical, status: 'error' }, CLAIM.front]}
      />
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => {
    const upload = useRef<UploadHandle>(null);
    return (
      <div className={stage} data-layout="block">
        <DemoUpload
          adapter={demoAdapter({ fails: true })}
          handleRef={upload}
          label="The root as a fieldset, with a note of the application's own inside it"
          multiple
          render={(props) => <fieldset {...props} />}
          seed={[{ ...CLAIM.medical, status: 'error' }, CLAIM.form]}
        >
          <Text size="sm" tone="muted">
            Documents are kept for seven years.
          </Text>
        </DemoUpload>

        <div className="slotted-demo-row">
          <Button onClick={() => upload.current?.browse()} size="sm" variant="outline">
            browse()
          </Button>
          <Button onClick={() => upload.current?.retryAll()} size="sm" variant="outline">
            retryAll()
          </Button>
          <Button onClick={() => upload.current?.cancelAll()} size="sm" variant="outline">
            cancelAll()
          </Button>
          <Button onClick={() => upload.current?.clear()} size="sm" variant="outline">
            clear()
          </Button>
        </div>
      </div>
    );
  },
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <div className={stage} data-layout="block">
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <UploadDefaultsProvider concurrency={2} maxRows={4}>
          <DemoUpload
            description="Every word and the locale come from the language in force; the limits from one provider above."
            label="Claim documents"
            maxSize={2 * 1024 * 1024}
            messages={{ rejection: { size: 'This file is {size}; the limit is 2 MB.' } }}
            multiple
            seed={[CLAIM.form, { ...CLAIM.dashcam, status: 'rejected', reason: 'size' }]}
          />
          <DemoUpload
            label="A second one, with the same provider"
            seed={[CLAIM.witness]}
            variant="field"
          />
        </UploadDefaultsProvider>
      </SlottedProvider>
    </div>
  ),
};

export const Adapter: Story = {
  parameters: scenario('adapter'),
  render: () => (
    <div className={stage} data-layout="block">
      <Text size="sm" tone="muted">
        Three senders, one contract. The first reports progress and succeeds, the second fails, the
        third suspends between chunks.
      </Text>
      <DemoUpload
        adapter={demoAdapter({ bytesPerSecond: 2_000_000 })}
        label="A sender that works"
        seed={[{ ...CLAIM.front, status: 'ready' }]}
      />
      <DemoUpload
        adapter={demoAdapter({ bytesPerSecond: 2_000_000, fails: true })}
        label="A sender that fails"
        seed={[{ ...CLAIM.rear, status: 'ready' }]}
      />
      <DemoUpload
        adapter={demoAdapter({ bytesPerSecond: 2_000_000, pausable: true })}
        label="A sender that can be suspended"
        seed={[{ ...CLAIM.dashcam, status: 'ready' }]}
      />
    </div>
  ),
};
