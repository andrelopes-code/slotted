import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ReactNode } from 'react';

import {
  Attachment,
  AttachmentBody,
  AttachmentDetail,
  AttachmentGroup,
  AttachmentPreview,
  AttachmentTrigger,
} from '../attachment';
import { Button } from '../button';
import { Text } from '../typography';
import { MediaViewer } from './media-viewer';
import {
  MediaViewerActions,
  MediaViewerBar,
  MediaViewerClose,
  MediaViewerDownload,
  MediaViewerPosition,
  MediaViewerTitle,
} from './media-viewer-bar';
import {
  MediaViewerCaption,
  MediaViewerNext,
  MediaViewerPrevious,
  MediaViewerThumbnails,
  MediaViewerZoom,
} from './media-viewer-controls';
import { MediaViewerDefaultsProvider } from './media-viewer-defaults';
import { MediaViewerStage } from './media-viewer-stage';
import { REACT_MEDIA_VIEWER_DOCS, REACT_MEDIA_VIEWER_TOKENS } from './media-viewer.docs';
import type { MediaViewerItem, MediaViewerProps } from './media-viewer.types';

/** A photograph drawn inline at its real size, so the page needs no network. */
const photo = (width: number, height: number, sky: string, ground: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}" viewBox="0 0 ${String(width)} ${String(height)}">` +
      `<rect width="100%" height="100%" fill="${sky}"/>` +
      `<path d="M0 ${String(height * 0.7)} Q ${String(width / 2)} ${String(height * 0.55)} ${String(width)} ${String(height * 0.72)} V ${String(height)} H 0Z" fill="${ground}"/>` +
      `<rect x="${String(width * 0.3)}" y="${String(height * 0.45)}" width="${String(width * 0.4)}" height="${String(height * 0.22)}" rx="${String(height * 0.04)}" fill="#c2410c"/>` +
      `<circle cx="${String(width * 0.38)}" cy="${String(height * 0.68)}" r="${String(height * 0.05)}" fill="#1f2937"/>` +
      `<circle cx="${String(width * 0.62)}" cy="${String(height * 0.68)}" r="${String(height * 0.05)}" fill="#1f2937"/>` +
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
  incident: {
    date: '2026-09-13',
    location: 'Rua Augusta 112, Lisbon',
    vehicles: 2,
    injuries: false,
  },
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
const ESTIMATE: MediaViewerItem = {
  id: 'estimate',
  name: 'repair-estimate.xlsx',
  type: '',
  src: '#repair-estimate.xlsx',
  downloadHref: '#repair-estimate.xlsx',
};
const BROKEN: MediaViewerItem = {
  id: 'broken',
  name: 'damage-wheel-arch.jpg',
  type: 'image/jpeg',
  src: 'data:image/jpeg;base64,AAAA',
  downloadHref: '#damage-wheel-arch.jpg',
};
const SCAN: MediaViewerItem = {
  id: 'scan',
  name: 'scan_2026-09-14_claim-form_insured-party-signature_page-1-of-3_final.png',
  type: 'image/png',
  src: photo(1240, 1754, '#f5f5f4', '#d6d3d1'),
};

const PHOTOS = [FRONT, REAR, PLATE];
const kinds = (): MediaViewerItem[] => [
  FRONT,
  { id: 'report', name: 'police-report.pdf', type: 'application/pdf', src: report() },
  {
    id: 'export',
    name: 'claim-0914.json',
    type: 'application/json',
    src: `data:application/json,${encodeURIComponent(EXPORT)}`,
  },
  ESTIMATE,
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

type ClaimViewerProps = Omit<MediaViewerProps, 'items' | 'open' | 'value'> & {
  files: readonly MediaViewerItem[];
  label?: string;
};

/** A claim's files as a thread shows them; pressing one opens the viewer on it. */
function ClaimViewer({
  files,
  label = 'Claim CLM-2026-0914',
  children,
  ...props
}: ClaimViewerProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(files[0]?.id ?? '');

  return (
    <>
      <AttachmentGroup aria-label={label} layout="grid" orientation="vertical">
        {files.map((file) => (
          <Attachment file={{ name: file.name, type: file.type }} key={file.id}>
            <AttachmentPreview {...(file.type.startsWith('image/') ? { src: file.src } : {})} />
            <AttachmentBody>
              <AttachmentTrigger
                onClick={() => {
                  setValue(file.id);
                  setOpen(true);
                }}
              />
              <AttachmentDetail>{file.type === '' ? 'Spreadsheet' : file.type}</AttachmentDetail>
            </AttachmentBody>
          </Attachment>
        ))}
      </AttachmentGroup>
      <MediaViewer
        {...props}
        items={files}
        onOpenChange={setOpen}
        onValueChange={setValue}
        open={open}
        value={value}
      >
        {children}
      </MediaViewer>
    </>
  );
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_MEDIA_VIEWER_DOCS.mediaViewer.scenes, {
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

const meta = {
  title: 'Components/MediaViewer',
  component: MediaViewer,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'MediaViewer',
        description:
          'The viewer a file opens in: full screen on a dark ground, fitted, zoomed around a point, turned, and stepped through the set it belongs to — a photograph, a PDF, a text file, or the way to a file the browser cannot draw.',
        framework: 'React',
        ...REACT_MEDIA_VIEWER_DOCS.mediaViewer,
        tokens: REACT_MEDIA_VIEWER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
  args: { items: PHOTOS },
} satisfies Meta<typeof MediaViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Images: Story = {
  parameters: scenario('images'),
  render: () => (
    <Scene
      label="Three photographs of a claim"
      note="Open one: it stands whole, never larger than its pixels; the steps walk the set."
    >
      <ClaimViewer files={PHOTOS} />
    </Scene>
  ),
};

export const Zoom: Story = {
  parameters: scenario('zoom'),
  render: () => (
    <Scene
      label="Up to eight times, half a step at a time"
      note="Wheel, pinch or the pill; the point under the pointer stays where it was."
    >
      <ClaimViewer files={PHOTOS} maxZoom={8} zoomStep={0.5} />
    </Scene>
  ),
};

export const Kinds: Story = {
  parameters: scenario('kinds'),
  render: () => (
    <Scene
      label="Everything a claim collects"
      note="A photograph, the police report, the JSON export and a spreadsheet no browser draws."
    >
      <ClaimViewer files={kinds()} />
    </Scene>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Scene
      label="A photograph that does not load"
      note="The wheel arch’s address no longer answers; try again or download it."
    >
      <ClaimViewer files={[FRONT, BROKEN, REAR]} />
    </Scene>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Scene
      label="A scanner’s name, alone"
      note="The name is cut in the middle so .png stays; no steps and no position for one file."
    >
      <ClaimViewer files={[SCAN]} />
    </Scene>
  ),
};

export const Thumbnails: Story = {
  parameters: scenario('thumbnails'),
  render: () => (
    <Scene
      label="A strip under the photograph"
      note="The current one is framed; press another to go straight to it."
    >
      <ClaimViewer files={PHOTOS}>
        <MediaViewerBar />
        <MediaViewerStage />
        <MediaViewerPrevious />
        <MediaViewerNext />
        <MediaViewerZoom />
        <MediaViewerCaption />
        <MediaViewerThumbnails aria-label="Claim photographs" />
      </ClaimViewer>
    </Scene>
  ),
};

function SharingViewer() {
  const [shared, setShared] = useState('Nothing shared yet.');

  return (
    <div className="slotted-demo-stack" data-stretch>
      <MediaViewerDefaultsProvider loop maxZoom={6}>
        <ClaimViewer files={PHOTOS}>
          <MediaViewerBar>
            <div data-part="heading" data-part-heading="">
              <MediaViewerTitle />
              <MediaViewerPosition />
            </div>
            <MediaViewerActions>
              <Button
                onClick={() => setShared('Link to the photograph copied for the adjuster.')}
                size="sm"
                tone="neutral"
                variant="ghost"
              >
                Share with adjuster
              </Button>
              <MediaViewerDownload />
            </MediaViewerActions>
            <MediaViewerClose />
          </MediaViewerBar>
          <MediaViewerStage />
          <MediaViewerPrevious />
          <MediaViewerNext />
          <MediaViewerZoom />
        </ClaimViewer>
      </MediaViewerDefaultsProvider>
      <Text tone="muted">{shared}</Text>
    </div>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Scene
      label="The product’s own action, and a provider"
      note="Share sits beside the download; the provider loops the set and allows six times."
    >
      <SharingViewer />
    </Scene>
  ),
};

function LoggedViewer() {
  const [log, setLog] = useState<string[]>([]);
  const add = (line: string) => setLog((lines) => [line, ...lines].slice(0, 4));

  return (
    <div className="slotted-demo-stack" data-stretch>
      <ClaimViewer
        files={PHOTOS}
        onRotationChange={(rotation, { reason }) =>
          add(`turn to ${String(rotation)}° by ${reason}`)
        }
        onZoomChange={(zoom, { reason }) =>
          add(`level ${String(Math.round(zoom * 100))}% by ${reason}`)
        }
      />
      <Text tone="muted">
        {log.length === 0 ? 'Open a photograph, zoom, turn and step.' : log.join(' · ')}
      </Text>
    </div>
  );
}

export const Controlled: Story = {
  parameters: scenario('controlled'),
  render: () => (
    <Scene
      label="Every request, with its reason"
      note="Zoom and turn, then step: the level and the turn come back with select."
    >
      <LoggedViewer />
    </Scene>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Scene
      label="Every key of the viewer"
      note="Arrows, Home, End, plus, minus, zero, R and Escape, from the stage."
    >
      <ClaimViewer files={PHOTOS} />
    </Scene>
  ),
};
