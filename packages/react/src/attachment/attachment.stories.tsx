import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download, Share2 } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Icon } from '../icon';
import { Text } from '../typography';
import { Attachment, AttachmentGroup } from './attachment';
import { AttachmentDefaultsProvider } from './attachment-defaults';
import {
  AttachmentAction,
  AttachmentActions,
  AttachmentBody,
  AttachmentDetail,
  AttachmentFilename,
  AttachmentLink,
  AttachmentMessage,
  AttachmentPreview,
  AttachmentProgress,
  AttachmentRemove,
  AttachmentTrigger,
} from './attachment-parts';
import { REACT_ATTACHMENT_DOCS, REACT_ATTACHMENT_TOKENS } from './attachment.docs';
import type { AttachmentFile, AttachmentProps } from './attachment.types';

const DownloadGlyph = () => <Download aria-hidden="true" focusable="false" />;
const ShareGlyph = () => <Share2 aria-hidden="true" focusable="false" />;

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

const Scene = ({ children, label, note }: { children: ReactNode; label: string; note: string }) => (
  <section className="slotted-demo-scene">
    <header className="slotted-demo-scene__header">
      <span className="slotted-demo-scene__label">{label}</span>
      <span className="slotted-demo-scene__note">{note}</span>
    </header>
    <div className="slotted-demo-stage" data-layout="block">
      {children}
    </div>
  </section>
);

const noop = () => {};

/** One file as a thread shows it: tile, link, size, download and remove. */
function FileRow({ file, src, ...props }: Omit<AttachmentProps, 'children'> & { src?: string }) {
  return (
    <Attachment file={file} onRemove={noop} {...props}>
      <AttachmentPreview {...(src === undefined ? {} : { src })} />
      <AttachmentBody>
        <AttachmentLink href={`#${file.name}`} />
        <AttachmentDetail />
      </AttachmentBody>
      <AttachmentActions>
        <AttachmentAction
          aria-label={`Download ${file.name}`}
          render={({ disabled: _disabled, type: _type, ...rest }) => (
            <a {...rest} download href={`#${file.name}`} />
          )}
        >
          <Icon>
            <DownloadGlyph />
          </Icon>
        </AttachmentAction>
        <AttachmentRemove />
      </AttachmentActions>
    </Attachment>
  );
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_ATTACHMENT_DOCS.attachment.scenes, {
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

const meta = {
  title: 'Components/Attachment',
  component: Attachment,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Attachment',
        description:
          'A file that already belongs to something — a message, a record, a tray: the kind’s tile, the name, a line of detail, a target that opens it and the actions the application offers on it.',
        framework: 'React',
        ...REACT_ATTACHMENT_DOCS.attachment,
        tokens: REACT_ATTACHMENT_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Attachment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    disabled: false,
    file: CLAIM,
    invalid: false,
    loading: false,
    orientation: 'horizontal',
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <AttachmentGroup aria-label="Attachments">
      <FileRow {...args} />
    </AttachmentGroup>
  ),
};

export const Anatomy: Story = {
  args: { file: CLAIM },
  parameters: scenario('anatomy'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Every part"
        note="Tile, trigger, detail, message, progress, an action and remove: the whole anatomy on one file that is still sending and has already been flagged."
      >
        <AttachmentGroup aria-label="Every part">
          <Attachment file={DASHCAM} invalid loading onRemove={noop}>
            <AttachmentPreview />
            <AttachmentBody>
              <AttachmentTrigger />
              <AttachmentDetail>Uploading · 62% of 84 MB</AttachmentDetail>
            </AttachmentBody>
            <AttachmentMessage>
              The file is larger than the 50 MB this claim accepts.
            </AttachmentMessage>
            <AttachmentProgress value={62} />
            <AttachmentActions>
              <AttachmentAction aria-label={`Share ${DASHCAM.name}`}>
                <Icon>
                  <ShareGlyph />
                </Icon>
              </AttachmentAction>
              <AttachmentRemove />
            </AttachmentActions>
          </Attachment>
        </AttachmentGroup>
      </Scene>
      <Scene
        label="A name and nothing else"
        note="No tile, no trigger, no actions: the name takes the width they held, and a file nobody can open writes its name without a control."
      >
        <Attachment file={{ name: 'VIN_WVWZZZ1JZXW000001_TELEMATICS_EXPORT' }}>
          <AttachmentBody>
            <AttachmentFilename />
            <AttachmentDetail>No preview available</AttachmentDetail>
          </AttachmentBody>
        </Attachment>
      </Scene>
    </div>
  ),
};

export const Sizes: Story = {
  args: { file: CLAIM },
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Scene
          key={size}
          label={size}
          note={`size="${size}": the tile is the height of the two lines beside it, and the insets step with the size.`}
        >
          <FileRow file={ESTIMATE} size={size} />
        </Scene>
      ))}
    </div>
  ),
};

export const Orientation: Story = {
  args: { file: FRONT },
  parameters: scenario('orientation'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="horizontal"
        note="The row: tile at the start, actions at the end, both centerd on the name and its detail."
      >
        <FileRow file={FRONT} src={PHOTO_FRONT} />
      </Scene>
      <Scene
        label="vertical"
        note="The card: three tiles wide, the picture square, the actions on a plate over the picture, the extension under the mark when there is no picture."
      >
        <AttachmentGroup aria-label="Photos and reports" layout="grid" orientation="vertical">
          <FileRow file={FRONT} src={PHOTO_FRONT} />
          <FileRow file={REPORT} />
        </AttachmentGroup>
      </Scene>
    </div>
  ),
};

export const Layout: Story = {
  args: { file: CLAIM },
  parameters: scenario('layout'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="list"
        note="A column, eight pixels between files: the default, and what a thread shows under a message."
      >
        <AttachmentGroup aria-label="Claim documents">
          <FileRow file={CLAIM} />
          <FileRow file={ESTIMATE} />
        </AttachmentGroup>
      </Scene>
      <Scene
        label="grid"
        note="Rows share the width and never go narrower than 16rem; cards keep their own width so each stays a whole pixel."
      >
        <AttachmentGroup aria-label="Claim documents" layout="grid">
          <FileRow file={CLAIM} />
          <FileRow file={ESTIMATE} />
          <FileRow file={REPORT} />
        </AttachmentGroup>
      </Scene>
      <Scene
        label="strip"
        note="One line that scrolls and snaps to each file — a composer’s tray. A focused file at either end keeps its whole ring."
      >
        <AttachmentGroup aria-label="Attached to your reply" layout="strip" size="sm">
          {[CLAIM, FRONT, REAR, REPORT, ESTIMATE].map((file) => (
            <Attachment file={file} key={file.name} onRemove={noop}>
              <AttachmentPreview />
              <AttachmentBody>
                <AttachmentFilename />
                <AttachmentDetail />
              </AttachmentBody>
              <AttachmentActions>
                <AttachmentRemove />
              </AttachmentActions>
            </Attachment>
          ))}
        </AttachmentGroup>
      </Scene>
    </div>
  ),
};

export const Kinds: Story = {
  args: { file: CLAIM },
  parameters: scenario('kinds'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Nine kinds"
        note="Each kind reads the tile upload reads, so a PDF is the same red in both families. The kind comes from the media type first and the extension second."
      >
        <AttachmentGroup aria-label="Every kind" layout="grid">
          {KINDS.map((file) => (
            <Attachment file={file} key={file.name}>
              <AttachmentPreview />
              <AttachmentBody>
                <AttachmentFilename />
                <AttachmentDetail />
              </AttachmentBody>
            </Attachment>
          ))}
        </AttachmentGroup>
      </Scene>
      <Scene
        label="Thumbnails, and one that fails"
        note="A picture replaces the tile. The second source does not exist, so the thumbnail falls back to the image tile rather than to a broken picture."
      >
        <AttachmentGroup aria-label="Photos" layout="grid" orientation="vertical">
          <FileRow file={FRONT} src={PHOTO_FRONT} />
          <FileRow file={REAR} src="missing-thumbnail.jpg" />
          <FileRow file={{ name: 'damage-side.jpg', size: 3_100_000 }} src={PHOTO_REAR} />
        </AttachmentGroup>
      </Scene>
    </div>
  ),
};

function ViewerDemo() {
  const [opened, setOpened] = useState<string>('nothing yet');
  return (
    <div className="slotted-demo-stack">
      <AttachmentGroup aria-label="Evidence">
        <Attachment file={REPORT}>
          <AttachmentPreview />
          <AttachmentBody>
            <AttachmentLink href="#police-report.pdf" />
            <AttachmentDetail>A link: follows, downloads, opens in a new tab</AttachmentDetail>
          </AttachmentBody>
        </Attachment>
        <Attachment file={FRONT}>
          <AttachmentPreview src={PHOTO_FRONT} />
          <AttachmentBody>
            <AttachmentTrigger onClick={() => setOpened(FRONT.name)} />
            <AttachmentDetail>A button: the page opens its own viewer</AttachmentDetail>
          </AttachmentBody>
        </Attachment>
      </AttachmentGroup>
      <Text tone="muted">Opened: {opened}</Text>
    </div>
  );
}

export const Trigger: Story = {
  args: { file: CLAIM },
  parameters: scenario('trigger'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="A link and a button"
        note="Point anywhere on either attachment: the whole of it answers and the name underlines. Tab to it: the ring goes round the attachment, not the words."
      >
        <ViewerDemo />
      </Scene>
    </div>
  ),
};

export const Actions: Story = {
  args: { file: CLAIM },
  parameters: scenario('actions'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Download, share, remove"
        note="Inner controls: no frame at rest, an 8% state layer on hover and 14% on press, the ring inside the box. A read-only thread passes no onRemove and shows no remove."
      >
        <AttachmentGroup aria-label="Claim documents">
          <Attachment file={CLAIM} onRemove={noop}>
            <AttachmentPreview />
            <AttachmentBody>
              <AttachmentLink href="#claim-form" />
              <AttachmentDetail />
            </AttachmentBody>
            <AttachmentActions>
              <AttachmentAction aria-label={`Share ${CLAIM.name}`}>
                <Icon>
                  <ShareGlyph />
                </Icon>
              </AttachmentAction>
              <AttachmentAction
                aria-label={`Download ${CLAIM.name}`}
                render={({ disabled: _disabled, type: _type, ...rest }) => (
                  <a {...rest} download href="#claim-form" />
                )}
              >
                <Icon>
                  <DownloadGlyph />
                </Icon>
              </AttachmentAction>
              <AttachmentRemove />
            </AttachmentActions>
          </Attachment>
          <Attachment file={ESTIMATE}>
            <AttachmentPreview />
            <AttachmentBody>
              <AttachmentLink href="#estimate" />
              <AttachmentDetail>Read-only: shared by the garage</AttachmentDetail>
            </AttachmentBody>
          </Attachment>
        </AttachmentGroup>
      </Scene>
    </div>
  ),
};

export const States: Story = {
  args: { file: CLAIM },
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="invalid, loading, disabled"
        note="The failed file tints, doubles its edge and says why; its tile keeps the kind. The sending file refuses its trigger and keeps remove. The expired link keeps its destination and refuses it."
      >
        <AttachmentGroup aria-label="States">
          <Attachment file={{ name: 'photos-batch.zip', size: 38_000_000 }} invalid onRemove={noop}>
            <AttachmentPreview />
            <AttachmentBody>
              <AttachmentTrigger />
              <AttachmentDetail>38 MB · Not sent</AttachmentDetail>
            </AttachmentBody>
            <AttachmentMessage>
              Archives are not accepted on this claim. Attach the photos one by one, up to 25 MB
              each.
            </AttachmentMessage>
            <AttachmentActions>
              <AttachmentRemove />
            </AttachmentActions>
          </Attachment>
          <Attachment file={DASHCAM} loading onRemove={noop}>
            <AttachmentPreview />
            <AttachmentBody>
              <AttachmentTrigger />
              <AttachmentDetail>Uploading · 62% of 84 MB</AttachmentDetail>
            </AttachmentBody>
            <AttachmentProgress value={62} />
            <AttachmentActions>
              <AttachmentRemove />
            </AttachmentActions>
          </Attachment>
          <Attachment file={{ name: 'witness-statement.docx', size: 41_000 }} loading>
            <AttachmentPreview />
            <AttachmentBody>
              <AttachmentTrigger />
              <AttachmentDetail>Scanning for viruses</AttachmentDetail>
            </AttachmentBody>
            <AttachmentProgress />
          </Attachment>
          <FileRow disabled file={{ name: 'quote-expired.pdf', size: 190_000 }} />
        </AttachmentGroup>
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  args: { file: CLAIM },
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Long, right-to-left, no extension"
        note="The stem shrinks and .pdf stays; the full name is the trigger title. The Arabic name keeps its own direction, and a name with no dot is one run."
      >
        <div className="slotted-demo-measure">
          <AttachmentGroup aria-label="Awkward names">
            <FileRow
              file={{
                name: 'quarterly-loss-adjustment-report-consolidated-final-v7-signed.pdf',
                size: 3_400_000,
              }}
            />
            <FileRow file={{ name: 'صورة-الضرر-الأمامي.png', size: 2_200_000 }} />
            <FileRow file={{ name: 'VIN_WVWZZZ1JZXW000001_TELEMATICS_EXPORT_RAW', size: 12_000 }} />
          </AttachmentGroup>
        </div>
      </Scene>
    </div>
  ),
};

export const Composition: Story = {
  args: { file: CLAIM },
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="A claim thread"
        note="A message from the adjuster with its files under the text: links that download, one photo still sending. The provider sets the size once for the thread."
      >
        <AttachmentDefaultsProvider size="sm">
          <div className="slotted-demo-stack">
            <Text>Maria Okafor · 14 Sep, 09:12</Text>
            <Text tone="muted">
              Here is the signed claim form and the garage estimate. The rear photo is still
              uploading.
            </Text>
            <AttachmentGroup aria-label="Attached to Maria Okafor’s message" layout="grid">
              <FileRow file={CLAIM} />
              <FileRow file={ESTIMATE} />
              <Attachment file={REAR} loading>
                <AttachmentPreview src={PHOTO_REAR} />
                <AttachmentBody>
                  <AttachmentTrigger />
                  <AttachmentDetail>Uploading · 40%</AttachmentDetail>
                </AttachmentBody>
                <AttachmentProgress value={40} />
              </Attachment>
            </AttachmentGroup>
          </div>
        </AttachmentDefaultsProvider>
      </Scene>
    </div>
  ),
};

function Tray() {
  const [files, setFiles] = useState([CLAIM, FRONT, REAR, REPORT]);
  const [said, setSaid] = useState('Tab to a file, then press Delete.');
  return (
    <div className="slotted-demo-stack">
      <AttachmentGroup aria-label="Attached to your reply">
        {files.map((file) => (
          <Attachment
            file={file}
            key={file.name}
            onRemove={({ reason }) => {
              setFiles((all) => all.filter((each) => each !== file));
              setSaid(
                `${file.name} removed by ${reason === 'keyboard' ? 'the keyboard' : 'the remove control'}.`,
              );
            }}
          >
            <AttachmentPreview />
            <AttachmentBody>
              <AttachmentTrigger />
              <AttachmentDetail />
            </AttachmentBody>
            <AttachmentActions>
              <AttachmentRemove />
            </AttachmentActions>
          </Attachment>
        ))}
      </AttachmentGroup>
      <Text tone="muted">{said}</Text>
    </div>
  );
}

export const Keyboard: Story = {
  args: { file: CLAIM },
  parameters: scenario('keyboard'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Remove, and keep the keyboard"
        note="Delete or Backspace on a file asks to remove it; focus moves to the file that took its place, then the last one, then the list."
      >
        <Tray />
      </Scene>
    </div>
  ),
};
