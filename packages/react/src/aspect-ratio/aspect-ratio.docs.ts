import aspectRatioTokens from '@slotted/styles/aspect-ratio/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_ASPECT_RATIO_TOKENS = aspectRatioTokens.map((name) => ({
  name,
  purpose: 'Theme-owned AspectRatio decision',
}));

const imports: ReferenceImport = {
  source: "import { AspectRatio } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The frame: a grid of one cell that is a stated proportion of its own width. Every child takes the cell and stretches to it; a replaced child is fitted whole, never cropped; content taller than the ratio grows the frame.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One frame around a survey photograph, driven by the controls: switch the ratio and the frame changes shape while the picture is shown whole inside it.',
    snippet: defineSnippet({
      id: 'aspect-ratio-react-playground',
      language: 'tsx',
      label: 'A frame around a picture',
      source:
        '<AspectRatio ratio="video">\n  <img alt="The fjord lookout at site 12" src={site.photo} />\n</AspectRatio>;',
    }),
  },
  {
    id: 'ratios',
    title: 'Five ratios a product decides once',
    note: 'square, landscape (4:3), portrait (3:4), video (16:9) and wide (21:9), each named for what it holds rather than for its numbers, so a template says "thumbnails are landscape" and the DOM says which one was taken.',
    snippet: defineSnippet({
      id: 'aspect-ratio-react-ratios',
      language: 'tsx',
      label: 'By name',
      source:
        '<AspectRatio ratio="square" />;\n<AspectRatio ratio="landscape" />;\n<AspectRatio ratio="portrait" />;\n<AspectRatio ratio="video" />;\n<AspectRatio ratio="wide" />;',
    }),
  },
  {
    id: 'custom',
    title: 'Any other proportion, as a number or a pair',
    note: 'A pair is written into the stylesheet exactly as given — 2 / 1 stays 2 / 1 — where a number is its quotient. Both mark the frame data-ratio="custom" and put the value on the instance.',
    snippet: defineSnippet({
      id: 'aspect-ratio-react-custom',
      language: 'tsx',
      label: 'A pair, and a number',
      source: '<AspectRatio ratio={[2, 1]} />;\n<AspectRatio ratio={1.85} />;',
    }),
  },
  {
    id: 'media',
    title: 'Replaced content is fitted whole',
    note: 'A 4:3 photograph in a 16:9 frame is shown entire with the frame either side; a wide one in a square frame is letterboxed the same way. The frame reserves and never crops — the crop is Image’s decision, taken with fit.',
    snippet: defineSnippet({
      id: 'aspect-ratio-react-media',
      language: 'tsx',
      label: 'A map, and an embedded player',
      source:
        '<AspectRatio ratio="video">\n  <iframe allowFullScreen src={briefing.embedUrl} title="Site briefing" />\n</AspectRatio>;',
    }),
  },
  {
    id: 'growth',
    title: 'Content taller than the ratio grows the frame',
    note: 'Two lines fit a 16:9 frame at this width and the frame keeps its ratio; a longer paragraph does not fit, and the frame is exactly as tall as the paragraph. Nothing is clipped and nothing lands on the frame below: the ratio is a floor, not a ceiling.',
    snippet: defineSnippet({
      id: 'aspect-ratio-react-growth',
      language: 'tsx',
      label: 'Text in a frame',
      source: '<AspectRatio ratio="video">\n  <p>{site.notes}</p>\n</AspectRatio>;',
    }),
  },
  {
    id: 'composition',
    title: 'Two children stack; an Image composes the frame',
    note: 'Every child takes the one cell, so a caption sits over a picture with nothing positioned by hand. An Image given a ratio renders this same frame inside its own root — the second tile is what Image writes.',
    snippet: defineSnippet({
      id: 'aspect-ratio-react-composition',
      language: 'tsx',
      label: 'A caption over a picture',
      source:
        '<AspectRatio ratio="landscape">\n  <img alt="" src={site.photo} />\n  <Text tone="inverse">{site.name}</Text>\n</AspectRatio>;',
    }),
  },
  {
    id: 'accessibility',
    title: 'The frame has no role',
    note: 'A frame is a div and announces nothing; the content is the consumer’s and carries its own name. A picture with a caption is a figure around the frame, with the figcaption after it, and the caption is not repeated in the alt.',
    snippet: defineSnippet({
      id: 'aspect-ratio-react-accessibility',
      language: 'tsx',
      label: 'A frame on a figure',
      source:
        '<figure>\n  <AspectRatio ratio="landscape">\n    <img alt="The fjord lookout at site 12 from the cliff path" src={site.photo} />\n  </AspectRatio>\n  <figcaption>Site 12 — fjord lookout, March survey</figcaption>\n</figure>;',
    }),
  },
];

export const REACT_ASPECT_RATIO_DOCS = {
  'aspect-ratio': {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'ratio',
        "'square' | 'landscape' | 'portrait' | 'video' | 'wide' | number | [number, number]",
        '—',
        'AspectRatio',
        'Required. The proportion the box holds before anything is in it: a name a product decided once, or any number',
      ],
      [
        'children',
        'ReactNode',
        '—',
        'AspectRatio',
        'What the frame holds. Each child takes the one cell; a replaced child is fitted whole',
      ],
    ]),
    events: [] satisfies EventRow[],
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'AspectRatio',
        'Substitutes the root element — a figure, an li — and hands it every data attribute and the token',
      ],
      [
        'ref',
        'Ref<HTMLDivElement>',
        '—',
        'AspectRatio',
        'Reaches the frame; the props type is the div’s own, extended',
      ],
      [
        '--slotted-aspect-ratio',
        'custom property',
        '—',
        'an instance',
        'What a custom ratio writes on the element, as w / h. A theme retunes a named ratio in the stylesheet instead',
      ],
    ]),
    accessibility: [
      'There is no aspect-ratio pattern in the WAI-ARIA Authoring Practices, and the frame needs none: it is a div with no role, and what it holds carries its own semantics — an img its alt, an iframe its title, a p its text.',
      'The frame never clips. Content taller than the ratio grows the box (css-sizing-4 keeps a content-based minimum on a box with aspect-ratio), so a translation that runs longer than the design is read whole rather than cut at the ratio or laid over the frame below.',
      'A replaced child is fitted with object-fit: contain, so a picture is shown entire; a consumer who wants the picture to cover the frame is asking for a crop, and Image is the family that decides that with its fit axis.',
      'The frame moves nothing on load: the box is its stated proportion before the first byte of a picture arrives, which is what keeps a grid of thumbnails from shifting as each request returns.',
    ],
    snippets: [
      defineSnippet({
        id: 'aspect-ratio-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '// A number writes data-ratio="custom" and --slotted-aspect-ratio: 2 / 1 on the instance.\n<div data-ui="aspect-ratio" data-part="root" data-ratio="video">\n  <img alt="The fjord lookout at site 12" src="…" />\n</div>;',
      }),
      defineSnippet({
        id: 'aspect-ratio-theming',
        language: 'css',
        label: 'Retuning a named ratio for an application',
        source:
          "/* A product whose “wide” is 2:1 rather than 21:9. */\n[data-ui='aspect-ratio'][data-ratio='wide'] {\n  --slotted-aspect-ratio: 2 / 1;\n}",
      }),
    ],
  },
} as const;
